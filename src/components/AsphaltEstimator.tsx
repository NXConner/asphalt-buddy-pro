import { useState } from "react";
import { Calculator, Settings, Users, FileText, DollarSign, FolderOpen, Palette, User, BookOpen, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EstimatorTab } from "./tabs/EstimatorTab";
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

const AsphaltEstimator = () => {
  const [activeTab, setActiveTab] = useState("estimator");

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
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Asphalt Business Estimator
          </h1>
          <p className="text-muted-foreground text-lg">
            Professional estimation and job management for asphalt maintenance
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-11 mb-6 bg-card/50 backdrop-blur-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs hidden lg:block">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

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
    </div>
  );
};

export default AsphaltEstimator;