-- Tighten RLS policies with explicit command-level rules and WITH CHECK clauses

-- Helper: ensure RLS enabled on relevant tables
DO $$ BEGIN
  PERFORM 1 FROM pg_tables WHERE schemaname='public' AND tablename='profiles';
  IF FOUND THEN
    EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';
  END IF;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  FOREACH tablename IN ARRAY ARRAY[
    'business_settings',
    'customers',
    'estimates',
    'invoices',
    'premium_services',
    'job_costs',
    'documents'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tablename);
  END LOOP;
END $$;

-- profiles (owner-only)
DO $$ BEGIN
  DROP POLICY IF EXISTS "profiles_all" ON public.profiles;
  DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (id = auth.uid());

-- Generic owner-only policy generator for tables that have user_id
-- Replaces broad FOR ALL policies with explicit ones
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['business_settings','customers','estimates','invoices','premium_services','job_costs','documents'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %L ON public.%I', 'owner_all', t);
    EXECUTE format('DROP POLICY IF EXISTS %L ON public.%I', 'Users can manage their own '||t, t);

    EXECUTE format('CREATE POLICY %L ON public.%I FOR SELECT USING (user_id = auth.uid())',
                   t||'_select_own', t);
    EXECUTE format('CREATE POLICY %L ON public.%I FOR INSERT WITH CHECK (user_id = auth.uid())',
                   t||'_insert_own', t);
    EXECUTE format('CREATE POLICY %L ON public.%I FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
                   t||'_update_own', t);
    EXECUTE format('CREATE POLICY %L ON public.%I FOR DELETE USING (user_id = auth.uid())',
                   t||'_delete_own', t);
  END LOOP;
END $$;

-- Equipment/Expenses/Financial records: ensure explicit policies exist (role-gated)
-- Note: these are intentionally role-based; tighten by scoping per-command
DO $$ BEGIN
  ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "equipment_access" ON public.equipment;
  CREATE POLICY "equipment_select_roles" ON public.equipment FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles WHERE is_admin = true OR role IN ('super_admin','fleet_manager')
    )
  );
  CREATE POLICY "equipment_insert_roles" ON public.equipment FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles WHERE is_admin = true OR role IN ('super_admin','fleet_manager')
    )
  );
  CREATE POLICY "equipment_update_roles" ON public.equipment FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles WHERE is_admin = true OR role IN ('super_admin','fleet_manager')
    )
  ) WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles WHERE is_admin = true OR role IN ('super_admin','fleet_manager')
    )
  );
  CREATE POLICY "equipment_delete_roles" ON public.equipment FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles WHERE is_admin = true OR role IN ('super_admin','fleet_manager')
    )
  );
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "expenses_access" ON public.expenses;
  CREATE POLICY "expenses_select_roles" ON public.expenses FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles WHERE is_admin = true OR role IN ('super_admin','finance_manager')
    )
  );
  CREATE POLICY "expenses_insert_roles" ON public.expenses FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles WHERE is_admin = true OR role IN ('super_admin','finance_manager')
    )
  );
  CREATE POLICY "expenses_update_roles" ON public.expenses FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles WHERE is_admin = true OR role IN ('super_admin','finance_manager')
    )
  ) WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles WHERE is_admin = true OR role IN ('super_admin','finance_manager')
    )
  );
  CREATE POLICY "expenses_delete_roles" ON public.expenses FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles WHERE is_admin = true OR role IN ('super_admin','finance_manager')
    )
  );
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "financial_records_access" ON public.financial_records;
  CREATE POLICY "financial_records_select_roles" ON public.financial_records FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles WHERE is_admin = true OR role IN ('super_admin','finance_manager')
    )
  );
  CREATE POLICY "financial_records_insert_roles" ON public.financial_records FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles WHERE is_admin = true OR role IN ('super_admin','finance_manager')
    )
  );
  CREATE POLICY "financial_records_update_roles" ON public.financial_records FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles WHERE is_admin = true OR role IN ('super_admin','finance_manager')
    )
  ) WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles WHERE is_admin = true OR role IN ('super_admin','finance_manager')
    )
  );
  CREATE POLICY "financial_records_delete_roles" ON public.financial_records FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles WHERE is_admin = true OR role IN ('super_admin','finance_manager')
    )
  );
EXCEPTION WHEN undefined_table THEN NULL; END $$;

