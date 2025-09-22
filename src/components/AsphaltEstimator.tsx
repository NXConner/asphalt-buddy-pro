import { Suspense, useEffect, useRef, useState, lazy } from "react";
import { Calculator, Settings, Users, FileText, DollarSign, FolderOpen, Palette, User, BookOpen, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EstimatorTab } from "./tabs/EstimatorTab";
const OverwatchTab = lazy(() => import("./tabs/OverwatchTab").then(m => ({ default: m.OverwatchTab })));
import { SettingsTab } from "./tabs/SettingsTab";
import { CustomersTab } from "./tabs/CustomersTab";
import { InvoicesTab } from "./tabs/InvoicesTab";
import { JobCostingTab } from "./tabs/JobCostingTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { StencilCatalogTab } from "./tabs/StencilCatalogTab";
import { PremiumServicesTab } from "./tabs/PremiumServicesTab";
import { BestPracticesTab } from "./tabs/BestPracticesTab";
import { ProfileTab } from "./tabs/ProfileTab";
import { UISettingsTab } from "./tabs/UISettingsTab";
import { DraggableCalculator } from "./tabs/DraggableCalculator";

const AsphaltEstimator = () => {
  const [activeTab, setActiveTab] = useState("estimator");
  const overwatchTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    // Prefetch the OverwatchTab module during idle and when the trigger is visible
    const idleId = (window as any).requestIdleCallback?.(() => {
      import("./tabs/OverwatchTab");
    });
    const el = overwatchTriggerRef.current;
    if (el && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) {
          import("./tabs/OverwatchTab");
          io.disconnect();
        }
      }, { rootMargin: "200px" });
      io.observe(el);
      return () => {
        io.disconnect();
        if ((window as any).cancelIdleCallback && idleId) (window as any).cancelIdleCallback(idleId);
      };
    }
    return () => {
      if ((window as any).cancelIdleCallback && idleId) (window as any).cancelIdleCallback(idleId);
    };
  }, []);

  const tabs = [
    { id: "estimator", label: "Estimator", icon: Calculator },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "customers", label: "Customers & Jobs", icon: Users },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "costing", label: "Job Costing", icon: DollarSign },
    { id: "documents", label: "Documents", icon: FolderOpen },
    { id: "stencils", label: "Stencil Catalog", icon: Palette },
    { id: "premium", label: "Premium Services", icon: Sparkles },
    { id: "practices", label: "Best Practices", icon: BookOpen },
    { id: "profile", label: "Profile", icon: User },
    { id: "ui", label: "UI Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-4xl font-bold gradient-text mb-2">
                Asphalt Business Estimator
              </h1>
              <p className="text-muted-foreground text-lg">
                Professional estimation and job management for asphalt maintenance
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCalculator(true)}
                className="flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                Calculator
              </Button>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* OverWatch top tab */}
          <TabsList className="w-full mb-2 bg-primary text-primary-foreground relative z-10 justify-center">
            <TabsTrigger
              value="overwatch"
              className="text-center p-3 font-semibold"
              ref={overwatchTriggerRef}
              onMouseEnter={() => { import("./tabs/OverwatchTab"); }}
            >
              OverWatch System Command
            </TabsTrigger>
          </TabsList>
          <TabsList className="w-full mb-6 bg-card/50 backdrop-blur-sm flex flex-wrap gap-1 !h-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="shrink-0 flex flex-col items-center gap-1 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs hidden lg:block">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="overwatch" className="space-y-6">
            <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading map module…</div>}>
              <OverwatchTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="estimator" className="space-y-6">
            <EstimatorTab />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsTab />
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <CustomersTab />
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <InvoicesTab />
          </TabsContent>

          <TabsContent value="costing" className="space-y-6">
            <JobCostingTab />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <DocumentsTab />
          </TabsContent>

          <TabsContent value="stencils" className="space-y-6">
            <StencilCatalogTab />
          </TabsContent>

          <TabsContent value="premium" className="space-y-6">
            <PremiumServicesTab />
          </TabsContent>

          <TabsContent value="practices" className="space-y-6">
            <BestPracticesTab />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="ui" className="space-y-6">
            <UISettingsTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Draggable Calculator */}
      <DraggableCalculator 
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
      />
    </div>
  );
};

export default AsphaltEstimator;