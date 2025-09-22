import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Settings, Palette, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BusinessSettings {
  materials: {
    pmmSealer: number;
    crackFiller: number;
    sand: number;
    fastDry: number;
    prepSeal: number;
  };
  striping: {
    whitePaint: number;
    yellowPaint: number;
    bluePaint: number;
    redPaint: number;
    rollers: number;
    brushes: number;
  };
  labor: {
    hourlyRate: number;
    propaneRefill: number;
    businessAddress: string;
    fuelPrice: number;
  };
  applicationRates: {
    sealerCoverage: number;
    crackFillerCoverage: number;
    sandMixRate: number;
    profitMarkup: number;
  };
}

export const SettingsTab = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BusinessSettings>({
    materials: {
      pmmSealer: 3.65,
      crackFiller: 44.95,
      sand: 10.00,
      fastDry: 140.00,
      prepSeal: 50.00,
    },
    striping: {
      whitePaint: 85.00,
      yellowPaint: 90.00,
      bluePaint: 95.00,
      redPaint: 100.00,
      rollers: 15.00,
      brushes: 8.00,
    },
    labor: {
      hourlyRate: 20.00,
      propaneRefill: 10.00,
      businessAddress: "337 Ayers Orchard Road, Stuart, VA 24171",
      fuelPrice: 3.45,
    },
    applicationRates: {
      sealerCoverage: 75.0,
      crackFillerCoverage: 100.0,
      sandMixRate: 3.0,
      profitMarkup: 25.0,
    },
  });

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('businessSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('businessSettings', JSON.stringify(settings));
    toast({
      title: "Settings saved!",
      description: "Your business settings have been updated successfully.",
    });
  };

  const updateSettings = (category: keyof BusinessSettings, field: string, value: number | string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Business Knowledge Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="materials" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="striping">Striping</TabsTrigger>
              <TabsTrigger value="labor">Labor & Equipment</TabsTrigger>
              <TabsTrigger value="rates">Application Rates</TabsTrigger>
            </TabsList>

            <TabsContent value="materials" className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold mb-4">Material Costs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pmmSealer">PMM Sealer ($/gallon)</Label>
                  <Input
                    id="pmmSealer"
                    type="number"
                    step="0.01"
                    className="input-professional"
                    value={settings.materials.pmmSealer}
                    onChange={(e) => updateSettings('materials', 'pmmSealer', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="crackFiller">Crack Filler ($/box)</Label>
                  <Input
                    id="crackFiller"
                    type="number"
                    step="0.01"
                    className="input-professional"
                    value={settings.materials.crackFiller}
                    onChange={(e) => updateSettings('materials', 'crackFiller', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="sand">Sand ($/bag)</Label>
                  <Input
                    id="sand"
                    type="number"
                    step="0.01"
                    className="input-professional"
                    value={settings.materials.sand}
                    onChange={(e) => updateSettings('materials', 'sand', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="fastDry">Fast Dry Additive ($/bucket)</Label>
                  <Input
                    id="fastDry"
                    type="number"
                    step="0.01"
                    className="input-professional"
                    value={settings.materials.fastDry}
                    onChange={(e) => updateSettings('materials', 'fastDry', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="prepSeal">Prep Seal ($/bucket)</Label>
                  <Input
                    id="prepSeal"
                    type="number"
                    step="0.01"
                    className="input-professional"
                    value={settings.materials.prepSeal}
                    onChange={(e) => updateSettings('materials', 'prepSeal', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="striping" className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold mb-4">Striping Costs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="whitePaint">White Paint ($/5-gal bucket)</Label>
                  <Input
                    id="whitePaint"
                    type="number"
                    step="0.01"
                    className="input-professional"
                    value={settings.striping.whitePaint}
                    onChange={(e) => updateSettings('striping', 'whitePaint', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="yellowPaint">Yellow Paint ($/5-gal bucket)</Label>
                  <Input
                    id="yellowPaint"
                    type="number"
                    step="0.01"
                    className="input-professional"
                    value={settings.striping.yellowPaint}
                    onChange={(e) => updateSettings('striping', 'yellowPaint', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="bluePaint">Blue Paint ($/5-gal bucket)</Label>
                  <Input
                    id="bluePaint"
                    type="number"
                    step="0.01"
                    className="input-professional"
                    value={settings.striping.bluePaint}
                    onChange={(e) => updateSettings('striping', 'bluePaint', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="redPaint">Red Paint ($/5-gal bucket)</Label>
                  <Input
                    id="redPaint"
                    type="number"
                    step="0.01"
                    className="input-professional"
                    value={settings.striping.redPaint}
                    onChange={(e) => updateSettings('striping', 'redPaint', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="rollers">Rollers ($/each)</Label>
                  <Input
                    id="rollers"
                    type="number"
                    step="0.01"
                    className="input-professional"
                    value={settings.striping.rollers}
                    onChange={(e) => updateSettings('striping', 'rollers', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="brushes">Brushes ($/each)</Label>
                  <Input
                    id="brushes"
                    type="number"
                    step="0.01"
                    className="input-professional"
                    value={settings.striping.brushes}
                    onChange={(e) => updateSettings('striping', 'brushes', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="labor" className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold mb-4">Labor & Equipment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hourlyRate">Labor Rate ($/hour)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    className="input-professional"
                    value={settings.labor.hourlyRate}
                    onChange={(e) => updateSettings('labor', 'hourlyRate', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="propaneRefill">Propane Refill ($/tank)</Label>
                  <Input
                    id="propaneRefill"
                    type="number"
                    step="0.01"
                    className="input-professional"
                    value={settings.labor.propaneRefill}
                    onChange={(e) => updateSettings('labor', 'propaneRefill', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="fuelPrice">Current Fuel Price ($/gallon)</Label>
                  <Input
                    id="fuelPrice"
                    type="number"
                    step="0.01"
                    className="input-professional"
                    value={settings.labor.fuelPrice}
                    onChange={(e) => updateSettings('labor', 'fuelPrice', parseFloat(e.target.value))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Input
                    id="businessAddress"
                    className="input-professional"
                    value={settings.labor.businessAddress}
                    onChange={(e) => updateSettings('labor', 'businessAddress', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rates" className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold mb-4">Application Rates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sealerCoverage">Sealer Coverage (sq ft/gallon)</Label>
                  <Input
                    id="sealerCoverage"
                    type="number"
                    step="0.1"
                    className="input-professional"
                    value={settings.applicationRates.sealerCoverage}
                    onChange={(e) => updateSettings('applicationRates', 'sealerCoverage', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="crackFillerCoverage">Crack Filler Coverage (ft/box)</Label>
                  <Input
                    id="crackFillerCoverage"
                    type="number"
                    step="0.1"
                    className="input-professional"
                    value={settings.applicationRates.crackFillerCoverage}
                    onChange={(e) => updateSettings('applicationRates', 'crackFillerCoverage', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="sandMixRate">Sand Mix Rate (lbs/gallon)</Label>
                  <Input
                    id="sandMixRate"
                    type="number"
                    step="0.1"
                    className="input-professional"
                    value={settings.applicationRates.sandMixRate}
                    onChange={(e) => updateSettings('applicationRates', 'sandMixRate', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="profitMarkup">Default Profit Markup (%)</Label>
                  <Input
                    id="profitMarkup"
                    type="number"
                    step="0.1"
                    className="input-professional"
                    value={settings.applicationRates.profitMarkup}
                    onChange={(e) => updateSettings('applicationRates', 'profitMarkup', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="pt-6">
            <Button onClick={saveSettings} className="btn-primary">
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};