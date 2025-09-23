import React, { useEffect, useRef, useState } from "react";
import { Settings } from "@/components/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EstimatorTab } from "./tabs/EstimatorTab";
const OverwatchTab = React.lazy(() => import("./tabs/OverwatchTab").then(m => ({ default: m.OverwatchTab })));
import { SettingsTab } from "./tabs/SettingsTab";
import { CustomersTab } from "./tabs/CustomersTab";
import { InvoicesTab } from "./tabs/InvoicesTab";
import { JobCostingTab } from "./tabs/JobCostingTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { StencilCatalogTab } from "./tabs/StencilCatalogTab";
import { PremiumServicesTab } from "./tabs/PremiumServicesTab";
import { BestPracticesTab } from "./tabs/BestPracticesTab";
import ChecklistTab from "./tabs/ChecklistTab";
import { ComplianceTab } from "./tabs/ComplianceTab";
import { ProfileTab } from "./tabs/ProfileTab";
import { UISettingsTab } from "./tabs/UISettingsTab";
import { DraggableCalculator } from "./tabs/DraggableCalculator";

const AsphaltEstimator = () => {
  const [activeTab, setActiveTab] = useState("estimator");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const tabsListRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsListRef.current) {
      const scrollAmount = 200;
      const currentScroll = tabsListRef.current.scrollLeft;
      tabsListRef.current.scrollTo({
        left: direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        setIsFullscreen(!isFullscreen);
      }
      if (e.key === 'c' && e.ctrlKey) {
        e.preventDefault();
        setShowCalculator(!showCalculator);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    const navHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { tab?: string } | undefined;
      if (detail?.tab) setActiveTab(detail.tab);
    };
    window.addEventListener('navigate-tab', navHandler as EventListener);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('navigate-tab', navHandler as EventListener);
    };
  }, [isFullscreen, showCalculator]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="container mx-auto p-4 h-full">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Asphalt Estimator Pro</h1>
            <p className="text-muted-foreground">Comprehensive asphalt maintenance and estimation tools</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowCalculator(!showCalculator)}
              className="hidden md:flex"
            >
              🧮 Calculator
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? '⤴' : '⤢'} {isFullscreen ? 'Exit' : 'Fullscreen'}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="relative mb-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-1 h-auto p-1">
              <TabsTrigger value="checklist" className="flex items-center gap-2">
                📋 Checklist
              </TabsTrigger>
              <TabsTrigger value="estimator" className="flex items-center gap-2">
                🧮 Estimator
              </TabsTrigger>
              <TabsTrigger value="overwatch" className="flex items-center gap-2">
                📊 Overwatch
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="customers" className="flex items-center gap-2">
                👥 Customers
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex items-center gap-2">
                📄 Invoices
              </TabsTrigger>
              <TabsTrigger value="job-costing" className="flex items-center gap-2">
                💰 Job Costing
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                📁 Documents
              </TabsTrigger>
              <TabsTrigger value="stencil-catalog" className="flex items-center gap-2">
                🎯 Stencils
              </TabsTrigger>
              <TabsTrigger value="premium-services" className="flex items-center gap-2">
                ✨ Premium
              </TabsTrigger>
              <TabsTrigger value="best-practices" className="flex items-center gap-2">
                📚 Best Practices
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2">
                🛡️ Compliance
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                👤 Profile
              </TabsTrigger>
              <TabsTrigger value="ui-settings" className="flex items-center gap-2">
                🎨 UI Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-[600px]">
            <TabsContent value="checklist">
              <ChecklistTab />
            </TabsContent>

            <TabsContent value="estimator">
              <EstimatorTab />
            </TabsContent>

            <TabsContent value="overwatch">
              <React.Suspense fallback={<div>Loading Overwatch...</div>}>
                <OverwatchTab />
              </React.Suspense>
            </TabsContent>

            <TabsContent value="settings">
              <SettingsTab />
            </TabsContent>

            <TabsContent value="customers">
              <CustomersTab />
            </TabsContent>

            <TabsContent value="invoices">
              <InvoicesTab />
            </TabsContent>

            <TabsContent value="job-costing">
              <JobCostingTab />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentsTab />
            </TabsContent>

            <TabsContent value="stencil-catalog">
              <StencilCatalogTab />
            </TabsContent>

            <TabsContent value="premium-services">
              <PremiumServicesTab />
            </TabsContent>

            <TabsContent value="best-practices">
              <BestPracticesTab />
            </TabsContent>

            <TabsContent value="compliance">
              <ComplianceTab />
            </TabsContent>

            <TabsContent value="profile">
              <ProfileTab />
            </TabsContent>

            <TabsContent value="ui-settings">
              <UISettingsTab />
            </TabsContent>
          </div>
        </Tabs>

        <DraggableCalculator 
          isOpen={showCalculator} 
          onClose={() => setShowCalculator(false)} 
        />
      </div>
    </div>
  );
};

export default AsphaltEstimator;