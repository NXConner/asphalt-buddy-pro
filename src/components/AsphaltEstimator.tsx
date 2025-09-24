import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, DollarSign, TrendingUp, FileText, Settings, Save, MapPin } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import AsphaltMap from "./AsphaltMap";

const AsphaltEstimator = () => {
  const { toast } = useToast();
  const [measurements, setMeasurements] = useState({
    length: "",
    width: "",
    thickness: ""
  });

  const [costs, setCosts] = useState({
    materialCost: 0,
    laborCost: 0,
    equipmentCost: 0,
    totalCost: 0,
    profitMargin: 15
  });

  const [estimateData, setEstimateData] = useState({
    area: 0,
    volume: 0,
    tonnage: 0
  });

  // Calculate estimates when measurements change
  useEffect(() => {
    const length = parseFloat(measurements.length) || 0;
    const width = parseFloat(measurements.width) || 0;
    const thickness = parseFloat(measurements.thickness) || 0;

    const area = length * width; // square feet
    const volume = (area * thickness) / 12; // cubic feet (thickness in inches)
    const tonnage = volume * 145 / 2000; // approximate weight in tons

    setEstimateData({ area, volume, tonnage });

    // Calculate costs
    const materialCost = tonnage * 120; // $120 per ton base cost
    const laborCost = area * 2.5; // $2.50 per sq ft labor
    const equipmentCost = Math.max(500, area * 0.75); // minimum $500 or $0.75/sq ft
    const subtotal = materialCost + laborCost + equipmentCost;
    const totalCost = subtotal * (1 + costs.profitMargin / 100);

    setCosts(prev => ({
      ...prev,
      materialCost,
      laborCost,
      equipmentCost,
      totalCost
    }));
  }, [measurements, costs.profitMargin]);

  const handleInputChange = (field: string, value: string) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveEstimate = () => {
    toast({
      title: "Estimate Saved",
      description: "Your asphalt estimate has been saved successfully.",
    });
  };

  const exportEstimate = () => {
    const data = {
      measurements,
      estimateData,
      costs,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asphalt-estimate-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Estimate Exported",
      description: "Your estimate has been downloaded as a JSON file.",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary">Asphalt Cost Estimator</h1>
          <p className="text-muted-foreground">Professional asphalt project estimation and planning</p>
        </div>

        <Tabs defaultValue="detection" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto">
            <TabsTrigger value="detection" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              AI Detection
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="estimates" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Estimates
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* AI Detection Tab */}
          <TabsContent value="detection" className="space-y-6">
            <AsphaltMap />
          </TabsContent>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Project Measurements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="length">Length (ft)</Label>
                      <Input
                        id="length"
                        type="number"
                        value={measurements.length}
                        onChange={(e) => handleInputChange("length", e.target.value)}
                        placeholder="Enter length"
                      />
                    </div>
                    <div>
                      <Label htmlFor="width">Width (ft)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={measurements.width}
                        onChange={(e) => handleInputChange("width", e.target.value)}
                        placeholder="Enter width"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="thickness">Thickness (inches)</Label>
                    <Input
                      id="thickness"
                      type="number"
                      value={measurements.thickness}
                      onChange={(e) => handleInputChange("thickness", e.target.value)}
                      placeholder="Enter thickness"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profit">Profit Margin (%)</Label>
                    <Input
                      id="profit"
                      type="number"
                      value={costs.profitMargin}
                      onChange={(e) => setCosts(prev => ({ ...prev, profitMargin: parseFloat(e.target.value) || 0 }))}
                      placeholder="Enter profit margin"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Results Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Area:</span>
                        <Badge variant="secondary">{estimateData.area.toFixed(0)} sq ft</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Volume:</span>
                        <Badge variant="secondary">{estimateData.volume.toFixed(1)} cu ft</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Tonnage:</span>
                        <Badge variant="secondary">{estimateData.tonnage.toFixed(1)} tons</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Materials:</span>
                        <span>${costs.materialCost.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Labor:</span>
                        <span>${costs.laborCost.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Equipment:</span>
                        <span>${costs.equipmentCost.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Cost:</span>
                      <span className="text-primary">${costs.totalCost.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveEstimate} className="flex items-center gap-2 flex-1">
                      <Save className="w-4 h-4" />
                      Save Estimate
                    </Button>
                    <Button onClick={exportEstimate} variant="outline" className="flex items-center gap-2 flex-1">
                      <FileText className="w-4 h-4" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Estimates Tab */}
          <TabsContent value="estimates">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Saved Estimates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No saved estimates yet</p>
                  <p className="text-sm">Create your first estimate using the calculator</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Project Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No reports available</p>
                  <p className="text-sm">Complete some estimates to generate reports</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Application Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Cost Parameters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Material Cost (per ton)</Label>
                        <Input defaultValue="120" type="number" />
                      </div>
                      <div>
                        <Label>Labor Rate (per sq ft)</Label>
                        <Input defaultValue="2.50" type="number" step="0.01" />
                      </div>
                      <div>
                        <Label>Equipment Rate (per sq ft)</Label>
                        <Input defaultValue="0.75" type="number" step="0.01" />
                      </div>
                      <div>
                        <Label>Default Profit Margin (%)</Label>
                        <Input defaultValue="15" type="number" />
                      </div>
                    </div>
                  </div>
                  <Button>Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AsphaltEstimator;