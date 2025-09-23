-- Enable RLS on critical business tables and fix security issues

-- Enable RLS on equipment table
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Enable RLS on expenses table  
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Enable RLS on financial_records table
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

-- Enable RLS on invoices table (if not already enabled)
DO $$ 
BEGIN
    IF NOT (SELECT schemaname = 'public' AND tablename = 'invoices' AND rowsecurity = true 
            FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
        ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
    END IF;
EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, skip
    NULL;
END $$;

-- Create secure RLS policies for equipment
DROP POLICY IF EXISTS "equipment_access" ON public.equipment;
CREATE POLICY "equipment_access" ON public.equipment
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM public.user_profiles 
            WHERE is_admin = true OR role IN ('super_admin', 'fleet_manager')
        )
    );

-- Create secure RLS policies for expenses  
DROP POLICY IF EXISTS "expenses_access" ON public.expenses;
CREATE POLICY "expenses_access" ON public.expenses
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM public.user_profiles 
            WHERE is_admin = true OR role IN ('super_admin', 'finance_manager')
        ) OR created_by = auth.uid()
    );

-- Create secure RLS policies for financial records
DROP POLICY IF EXISTS "financial_records_access" ON public.financial_records;
CREATE POLICY "financial_records_access" ON public.financial_records
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM public.user_profiles 
            WHERE is_admin = true OR role IN ('super_admin', 'finance_manager')
        )
    );

-- Fix security definer functions by adding proper search_path
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND (is_admin = true OR role IN ('super_admin', 'admin'))
  );
$$;

CREATE OR REPLACE FUNCTION public.check_user_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND (is_admin = true OR role = ANY(allowed_roles))
  );
$$;

-- Create user roles enum if it doesn't exist
DO $$ 
BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin', 'finance_manager', 'hr_manager', 'fleet_manager', 'operations_manager', 'employee', 'viewer');
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- Create user_roles table for proper role management
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create secure function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy for user_roles table
CREATE POLICY "user_roles_admin_access" ON public.user_roles
    FOR ALL USING (
        public.has_role(auth.uid(), 'admin'::app_role) OR 
        public.has_role(auth.uid(), 'super_admin'::app_role)
    );

-- Create audit log table for security tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    table_name text,
    record_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "audit_logs_admin_only" ON public.audit_logs
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier text NOT NULL,
    action text NOT NULL,
    count integer DEFAULT 1,
    window_start timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(identifier, action)
);

-- Create function for rate limiting
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier text, 
    p_action text, 
    p_limit integer DEFAULT 10, 
    p_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_count integer;
  time_threshold timestamp with time zone;
BEGIN
  time_threshold := now() - (p_window_minutes || ' minutes')::interval;
  DELETE FROM public.rate_limits WHERE created_at < time_threshold;
  
  SELECT COALESCE(SUM(count), 0) INTO current_count
  FROM public.rate_limits
  WHERE identifier = p_identifier AND action = p_action AND created_at >= time_threshold;
  
  IF current_count < p_limit THEN
    INSERT INTO public.rate_limits (identifier, action, count, window_start)
    VALUES (p_identifier, p_action, 1, now())
    ON CONFLICT (identifier, action) DO UPDATE SET count = public.rate_limits.count + 1, created_at = now();
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;