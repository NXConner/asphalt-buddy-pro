import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BackgroundGeolocation } from "@capacitor-community/background-geolocation";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const setup = async () => {
      try {
        await BackgroundGeolocation.initialize({
          notificationTitle: "OverWatch Tracking",
          notificationText: "Background location active",
          notificationIconColor: "#3b82f6",
          notificationSmallIcon: "ic_launcher",
        });

        await BackgroundGeolocation.addWatcher(
          {
            backgroundMessage: "Tracking location in background",
            backgroundTitle: "OverWatch Tracking",
            requestPermissions: true,
            stale: false,
            distanceFilter: 25,
            minAndroidSdk: 26,
          },
          async (location, error) => {
            if (error) {
              return;
            }
            try {
              const employeeId = (await supabase.auth.getUser()).data.user?.id;
              if (!employeeId || !location) return;
              await supabase.from("employee_locations").insert({
                employee_id: employeeId,
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy ?? null,
                heading: location.bearing ?? null,
                speed: location.speed ?? null,
                timestamp: new Date().toISOString(),
                is_active: true,
              });
            } catch {}
          }
        );
      } catch {}
    };
    setup();
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
