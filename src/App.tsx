import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useRef } from "react";
import { applyUITheme, listenForThemeChanges } from "@/lib/theme";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const watcherIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const lastSentRef = useRef<{ t: number; lat: number; lng: number }>({ t: 0, lat: 0, lng: 0 });
  const queueRef = useRef<any[]>([]);
  const flushTimerRef = useRef<any>(null);
  const configRef = useRef<{ distanceM: number; minIntervalMs: number }>({ distanceM: 50, minIntervalMs: 30000 });
  const trackingRef = useRef<boolean>(false);
  const lastSyncRef = useRef<number>(0);

  useEffect(() => {
    // Apply persisted UI theme and subscribe to future updates
    try {
      const saved = localStorage.getItem('uiSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.theme) applyUITheme(parsed.theme);
      }
      listenForThemeChanges();
    } catch {}

    let BG: any = null;

    async function startWatcher() {
      if (!BG) return;
      try {
        if (trackingRef.current) return;
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
            distanceFilter: Math.max(10, Math.min(100, configRef.current.distanceM)),
            minAndroidSdk: 26,
          },
          async (location: any, error: any) => {
            if (error || !location) return;
            if (!userIdRef.current) {
              const user = await supabase.auth.getUser();
              userIdRef.current = user.data.user?.id ?? null;
            }
            const employeeId = userIdRef.current;
            if (!employeeId) return;

            const now = Date.now();
            const dt = now - lastSentRef.current.t;
            const R = 6371e3;
            const toRad = (d: number) => (d * Math.PI) / 180;
            const dLat = toRad(location.latitude - lastSentRef.current.lat);
            const dLng = toRad(location.longitude - lastSentRef.current.lng);
            const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lastSentRef.current.lat)) * Math.cos(toRad(location.latitude)) * Math.sin(dLng/2)**2;
            const dist = 2 * R * Math.asin(Math.sqrt(a));

            if (lastSentRef.current.t === 0 || dt >= configRef.current.minIntervalMs || dist >= configRef.current.distanceM) {
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
              window.dispatchEvent(new CustomEvent('bg-tracking-state', { detail: { active: true, lastUpdateTs: now } }));
            }
          }
        );
        watcherIdRef.current = id;
        trackingRef.current = true;
        window.dispatchEvent(new CustomEvent('bg-tracking-state', { detail: { active: true, lastUpdateTs: Date.now() } }));

        if (!flushTimerRef.current) {
          flushTimerRef.current = setInterval(async () => {
            if (queueRef.current.length === 0) return;
            const batch = queueRef.current.splice(0, queueRef.current.length);
            await supabase.from("employee_locations").insert(batch);
            lastSyncRef.current = Date.now();
            window.dispatchEvent(new CustomEvent('bg-tracking-sync', { detail: { lastSyncTs: lastSyncRef.current } }));
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
      trackingRef.current = false;
      window.dispatchEvent(new CustomEvent('bg-tracking-state', { detail: { active: false, lastUpdateTs: lastSentRef.current.t } }));
    }

    function handleToggle(e: any) {
      const enabled = !!e.detail?.enabled;
      if (enabled) startWatcher(); else stopWatcher();
    }

    // Resolve plugin from Capacitor runtime to avoid bundling issues
    BG = (window as any)?.Capacitor?.Plugins?.BackgroundGeolocation || null;

    window.addEventListener('bg-tracking-toggle', handleToggle as any);
    window.addEventListener('bg-tracking-config', (e: any) => {
      const distanceM = e.detail?.distanceM;
      const minIntervalMs = e.detail?.minIntervalMs;
      if (typeof distanceM === 'number') configRef.current.distanceM = distanceM;
      if (typeof minIntervalMs === 'number') configRef.current.minIntervalMs = minIntervalMs;
    });
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
