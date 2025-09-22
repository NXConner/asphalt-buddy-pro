import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const watcherIdRef = useRef<string | null>(null);
  const lastSentRef = useRef<{ t: number; lat: number; lng: number }>({ t: 0, lat: 0, lng: 0 });
  const queueRef = useRef<any[]>([]);
  const flushTimerRef = useRef<any>(null);

  useEffect(() => {
    let BG: any = null;

    async function startWatcher() {
      if (!BG) return;
      try {
        await BG.initialize({
          notificationTitle: "OverWatch Tracking",
          notificationText: "Background location active",
          notificationIconColor: "#3b82f6",
          notificationSmallIcon: "ic_launcher",
        });

        const id = await BG.addWatcher(
          {
            backgroundMessage: "Tracking location in background",
            backgroundTitle: "OverWatch Tracking",
            requestPermissions: true,
            stale: false,
            distanceFilter: 25,
            minAndroidSdk: 26,
          },
          async (location: any, error: any) => {
            if (error || !location) return;
            const user = await supabase.auth.getUser();
            const employeeId = user.data.user?.id;
            if (!employeeId) return;

            const now = Date.now();
            const dt = now - lastSentRef.current.t;
            const R = 6371e3;
            const toRad = (d: number) => (d * Math.PI) / 180;
            const dLat = toRad(location.latitude - lastSentRef.current.lat);
            const dLng = toRad(location.longitude - lastSentRef.current.lng);
            const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lastSentRef.current.lat)) * Math.cos(toRad(location.latitude)) * Math.sin(dLng/2)**2;
            const dist = 2 * R * Math.asin(Math.sqrt(a));

            if (lastSentRef.current.t === 0 || dt >= 30000 || dist >= 50) {
              queueRef.current.push({
                employee_id: employeeId,
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy ?? null,
                heading: location.bearing ?? null,
                speed: location.speed ?? null,
                timestamp: new Date().toISOString(),
                is_active: true,
              });
              lastSentRef.current.t = now;
              lastSentRef.current.lat = location.latitude;
              lastSentRef.current.lng = location.longitude;
            }
          }
        );
        watcherIdRef.current = id;

        if (!flushTimerRef.current) {
          flushTimerRef.current = setInterval(async () => {
            if (queueRef.current.length === 0) return;
            const batch = queueRef.current.splice(0, queueRef.current.length);
            await supabase.from("employee_locations").insert(batch);
          }, 60000);
        }
      } catch {}
    }

    async function stopWatcher() {
      try {
        if (watcherIdRef.current && BG) {
          await BG.removeWatcher({ id: watcherIdRef.current });
          watcherIdRef.current = null;
        }
      } catch {}
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    }

    function handleToggle(e: any) {
      const enabled = !!e.detail?.enabled;
      if (enabled) startWatcher(); else stopWatcher();
    }

    // Resolve plugin from Capacitor runtime to avoid bundling issues
    BG = (window as any)?.Capacitor?.Plugins?.BackgroundGeolocation || null;

    window.addEventListener('bg-tracking-toggle', handleToggle as any);
    if (Capacitor?.isNativePlatform?.() && localStorage.getItem('bgTrackingEnabled') === 'true' && BG) {
      startWatcher();
    }

    return () => {
      window.removeEventListener('bg-tracking-toggle', handleToggle as any);
      stopWatcher();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
