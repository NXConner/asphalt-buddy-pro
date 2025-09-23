import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Calculator, Sparkles, Save } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

interface EstimateData {
  customer: {
    name: string;
    address: string;
    date: string;
  };
  asphaltRepair: {
    crackLength: number;
  };
  asphaltPaving: {
    length: number;
    width: number;
    area: number;
    thicknessInches: number;
    densityLbPerFt3: number;
    wastePercent: number;
    costPerTon: number;
  };
  sealcoating: {
    length: number;
    width: number;
    area: number;
    coats: number;
  };
  premiumServices: string[];
}

interface CalculationResult {
  materials: {
    sealer: { amount: string; cost: string };
    sand: { amount: number; cost: string };
    crackFiller: { amount: number; cost: string };
    asphalt: { tons: string; cost: string };
  };
  labor: {
    sealcoat: string;
    crack: string;
    total: string;
    cost: number;
  };
  premium: string;
  subtotal: string;
  markup: string;
  total: string;
}

export const EstimatorTab = () => {
  const { toast } = useToast();
  const [estimate, setEstimate] = useState<EstimateData>({
    customer: { name: "", address: "", date: new Date().toISOString().split('T')[0] },
    asphaltRepair: { crackLength: 0 },
    asphaltPaving: { length: 0, width: 0, area: 0, thicknessInches: 2, densityLbPerFt3: 145, wastePercent: 5, costPerTon: 125 },
    sealcoating: { length: 0, width: 0, area: 0, coats: 1 },
    premiumServices: []
  });

  const [calculation, setCalculation] = useState<CalculationResult | null>(null);

  // Calculate area automatically when length or width changes
  useEffect(() => {
    const area = estimate.sealcoating.length * estimate.sealcoating.width;
    setEstimate(prev => ({
      ...prev,
      sealcoating: { ...prev.sealcoating, area }
    }));
  }, [estimate.sealcoating.length, estimate.sealcoating.width]);

  // Calculate asphalt paving area automatically when length or width changes
  useEffect(() => {
    const area = estimate.asphaltPaving.length * estimate.asphaltPaving.width;
    setEstimate(prev => ({
      ...prev,
      asphaltPaving: { ...prev.asphaltPaving, area }
    }));
  }, [estimate.asphaltPaving.length, estimate.asphaltPaving.width]);

  const premiumServices = [
    { id: "edgework", name: "Hand working with brush/squeegee", price: 0.50 },
    { id: "grasswork", name: "Push grass and dirt back from edges", price: 0.25 },
    { id: "rockwork", name: "Adding rock to outside edges", price: 1.00 },
    { id: "oilspots", name: "Oil spot priming", price: 2.00 },
    { id: "cleanlines", name: "Clean existing lines", price: 0.75 }
  ];

  const calculateEstimate = () => {
    // Basic calculation logic based on your business knowledge
    const pmmCost = 3.65; // per gallon
    const sandCost = 10; // per 50lb bag
    const crackFillerCost = 44.95; // per 30lb box
    const laborRate = 20; // per hour

    // Sealcoating calculations
    const sealerNeeded = estimate.sealcoating.area * 0.014 * estimate.sealcoating.coats; // gallons
    const sandNeeded = Math.ceil((sealerNeeded * 3) / 50); // bags
    const sealcoatMaterial = (sealerNeeded * pmmCost) + (sandNeeded * sandCost);
    const sealcoatLabor = (estimate.sealcoating.area / 5000) * laborRate; // hours

    // Crack repair calculations
    const crackFillerBoxes = Math.ceil(estimate.sealcoating.area / 1000); // approximate
    const crackMaterial = crackFillerBoxes * crackFillerCost;
    const crackLabor = (estimate.asphaltRepair.crackLength / 100) * laborRate;

    // Asphalt paving/patching calculations
    const aArea = estimate.asphaltPaving.area; // sq ft
    const thicknessIn = estimate.asphaltPaving.thicknessInches; // inches
    const density = estimate.asphaltPaving.densityLbPerFt3; // lb/ft^3
    const waste = estimate.asphaltPaving.wastePercent / 100; // fraction
    const costPerTon = estimate.asphaltPaving.costPerTon; // $/ton
    // Tons = area * thickness(in) * density(lb/ft^3) / (12 in/ft * 2000 lb/ton)
    const tonsRaw = aArea > 0 && thicknessIn > 0 ? (aArea * thicknessIn * density) / 24000 : 0; 
    const tonsNeeded = tonsRaw * (1 + waste);
    const asphaltMaterial = tonsNeeded * costPerTon;

    // Premium services
    const premiumCost = estimate.premiumServices.reduce((total, serviceId) => {
      const service = premiumServices.find(s => s.id === serviceId);
      return total + (service ? service.price * estimate.sealcoating.area : 0);
    }, 0);

    const subtotal = sealcoatMaterial + sealcoatLabor + crackMaterial + crackLabor + asphaltMaterial + premiumCost;
    const markup = subtotal * 0.25; // 25% markup
    const total = subtotal + markup;

    const result = {
      materials: {
        sealer: { amount: sealerNeeded.toFixed(1), cost: (sealerNeeded * pmmCost).toFixed(2) },
        sand: { amount: sandNeeded, cost: (sandNeeded * sandCost).toFixed(2) },
        crackFiller: { amount: crackFillerBoxes, cost: crackMaterial.toFixed(2) },
        asphalt: { tons: tonsNeeded.toFixed(2), cost: asphaltMaterial.toFixed(2) }
      },
      labor: {
        sealcoat: sealcoatLabor.toFixed(1),
        crack: crackLabor.toFixed(1),
        total: (sealcoatLabor + crackLabor).toFixed(1),
        cost: (sealcoatLabor + crackLabor) * laborRate
      },
      premium: premiumCost.toFixed(2),
      subtotal: subtotal.toFixed(2),
      markup: markup.toFixed(2),
      total: total.toFixed(2)
    };

    setCalculation(result);
  };

  const handlePremiumServiceChange = (serviceId: string, checked: boolean) => {
    setEstimate(prev => ({
      ...prev,
      premiumServices: checked 
        ? [...prev.premiumServices, serviceId]
        : prev.premiumServices.filter(id => id !== serviceId)
    }));
  };

  const saveEstimate = () => {
    if (!calculation) {
      toast({
        title: "Calculate first",
        description: "Please calculate the estimate before saving.",
        variant: "destructive"
      });
      return;
    }

    // Save to localStorage for now (would be Supabase in production)
    const estimates = JSON.parse(localStorage.getItem('estimates') || '[]');
    const newEstimate = {
      id: Date.now().toString(),
      ...estimate,
      calculation,
      createdAt: new Date().toISOString()
    };
    estimates.push(newEstimate);
    localStorage.setItem('estimates', JSON.stringify(estimates));

    toast({
      title: "Estimate saved!",
      description: "The estimate has been saved successfully."
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Customer Info */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              className="input-professional"
              value={estimate.customer.name}
              onChange={(e) => setEstimate(prev => ({
                ...prev,
                customer: { ...prev.customer, name: e.target.value }
              }))}
            />
          </div>
          <div>
            <Label htmlFor="customerAddress">Address</Label>
            <Input
              id="customerAddress"
              className="input-professional"
              value={estimate.customer.address}
              onChange={(e) => setEstimate(prev => ({
                ...prev,
                customer: { ...prev.customer, address: e.target.value }
              }))}
            />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              className="input-professional"
              value={estimate.customer.date}
              onChange={(e) => setEstimate(prev => ({
                ...prev,
                customer: { ...prev.customer, date: e.target.value }
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Middle Column - Services */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle>Services & Measurements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Asphalt Repair */}
          <div>
            <h4 className="font-semibold mb-3">Asphalt Repair</h4>
            <div>
              <Label htmlFor="crackLength">Crack Length (linear ft)</Label>
              <Input
                id="crackLength"
                type="number"
                className="input-professional"
                value={estimate.asphaltRepair.crackLength}
                onChange={(e) => setEstimate(prev => ({
                  ...prev,
                  asphaltRepair: { crackLength: parseFloat(e.target.value) || 0 }
                }))}
              />
            </div>
          </div>

          <Separator />

          {/* Asphalt Paving / Patching */}
          <div>
            <h4 className="font-semibold mb-3">Asphalt Paving / Patching</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ap_length">Length (ft)</Label>
                <Input
                  id="ap_length"
                  type="number"
                  className="input-professional"
                  value={estimate.asphaltPaving.length}
                  onChange={(e) => setEstimate(prev => ({
                    ...prev,
                    asphaltPaving: { ...prev.asphaltPaving, length: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="ap_width">Width (ft)</Label>
                <Input
                  id="ap_width"
                  type="number"
                  className="input-professional"
                  value={estimate.asphaltPaving.width}
                  onChange={(e) => setEstimate(prev => ({
                    ...prev,
                    asphaltPaving: { ...prev.asphaltPaving, width: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
            <div className="mt-2">
              <Label>Total Area: {estimate.asphaltPaving.area.toFixed(0)} sq ft</Label>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="ap_thickness">Thickness (in)</Label>
                <Input
                  id="ap_thickness"
                  type="number"
                  step="0.25"
                  className="input-professional"
                  value={estimate.asphaltPaving.thicknessInches}
                  onChange={(e) => setEstimate(prev => ({
                    ...prev,
                    asphaltPaving: { ...prev.asphaltPaving, thicknessInches: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="ap_costPerTon">Asphalt Cost ($/ton)</Label>
                <Input
                  id="ap_costPerTon"
                  type="number"
                  step="0.01"
                  className="input-professional"
                  value={estimate.asphaltPaving.costPerTon}
                  onChange={(e) => setEstimate(prev => ({
                    ...prev,
                    asphaltPaving: { ...prev.asphaltPaving, costPerTon: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="ap_waste">Waste (%)</Label>
                <Input
                  id="ap_waste"
                  type="number"
                  step="1"
                  className="input-professional"
                  value={estimate.asphaltPaving.wastePercent}
                  onChange={(e) => setEstimate(prev => ({
                    ...prev,
                    asphaltPaving: { ...prev.asphaltPaving, wastePercent: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="ap_density">Density (lb/ft³)</Label>
                <Input
                  id="ap_density"
                  type="number"
                  step="1"
                  className="input-professional"
                  value={estimate.asphaltPaving.densityLbPerFt3}
                  onChange={(e) => setEstimate(prev => ({
                    ...prev,
                    asphaltPaving: { ...prev.asphaltPaving, densityLbPerFt3: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Tons ≈ Area × Thickness × Density ÷ 24,000</p>
          </div>

          <Separator />

          {/* Sealcoating */}
          <div>
            <h4 className="font-semibold mb-3">Sealcoating</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="length">Length (ft)</Label>
                <Input
                  id="length"
                  type="number"
                  className="input-professional"
                  value={estimate.sealcoating.length}
                  onChange={(e) => setEstimate(prev => ({
                    ...prev,
                    sealcoating: { ...prev.sealcoating, length: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="width">Width (ft)</Label>
                <Input
                  id="width"
                  type="number"
                  className="input-professional"
                  value={estimate.sealcoating.width}
                  onChange={(e) => setEstimate(prev => ({
                    ...prev,
                    sealcoating: { ...prev.sealcoating, width: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
            <div className="mt-2">
              <Label>Total Area: {estimate.sealcoating.area.toFixed(0)} sq ft</Label>
            </div>
            <div className="mt-4">
              <Label htmlFor="coats">Number of Coats</Label>
              <Select value={estimate.sealcoating.coats.toString()} onValueChange={(value) => 
                setEstimate(prev => ({
                  ...prev,
                  sealcoating: { ...prev.sealcoating, coats: parseInt(value) }
                }))
              }>
                <SelectTrigger className="input-professional">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Coat</SelectItem>
                  <SelectItem value="2">2 Coats</SelectItem>
                  <SelectItem value="3">3 Coats</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Premium Services */}
          <div>
            <h4 className="font-semibold mb-3">Premium Services</h4>
            <div className="space-y-3">
              {premiumServices.map((service) => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={service.id}
                    checked={estimate.premiumServices.includes(service.id)}
                    onCheckedChange={(checked) => handlePremiumServiceChange(service.id, !!checked)}
                  />
                  <Label htmlFor={service.id} className="text-sm">
                    {service.name} (+${service.price}/sq ft)
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Column - Calculation Results */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle>Estimate Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={calculateEstimate} 
            className="w-full btn-primary"
          >
            <Calculator className="mr-2 h-4 w-4" />
            Calculate Estimate
          </Button>

          {calculation && (
            <div className="space-y-4">
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">Materials</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Sealer ({calculation.materials.sealer.amount} gal)</span>
                    <span>${calculation.materials.sealer.cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sand ({calculation.materials.sand.amount} bags)</span>
                    <span>${calculation.materials.sand.cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Crack Filler ({calculation.materials.crackFiller.amount} boxes)</span>
                    <span>${calculation.materials.crackFiller.cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Asphalt ({calculation.materials.asphalt.tons} tons)</span>
                    <span>${calculation.materials.asphalt.cost}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Labor</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Hours: {calculation.labor.total}</span>
                    <span>${calculation.labor.cost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Premium Services</h4>
                <div className="flex justify-between text-sm">
                  <span>Additional Services</span>
                  <span>${calculation.premium}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${calculation.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Markup (25%)</span>
                  <span>${calculation.markup}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${calculation.total}</span>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Button onClick={saveEstimate} className="w-full btn-secondary">
                  <Save className="mr-2 h-4 w-4" />
                  Save Estimate
                </Button>
                <Button variant="outline" className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate AI Proposal
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};