import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Plus, Edit, Trash2, DollarSign, Clock, Star, TrendingUp } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

interface PremiumService {
  id: string;
  name: string;
  description: string;
  category: 'preparation' | 'application' | 'finishing' | 'specialty' | 'maintenance';
  pricing: {
    type: 'per_sqft' | 'per_hour' | 'flat_rate' | 'per_linear_ft';
    rate: number;
    minimumCharge?: number;
  };
  estimatedTime: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  equipmentRequired: string[];
  isActive: boolean;
  popularity: number; // 1-5 stars
  profitMargin: number; // percentage
}

const defaultServices: PremiumService[] = [
  {
    id: '1',
    name: 'Hand Edging with Brush',
    description: 'Precision edge work around buildings, curbs, and landscape features',
    category: 'finishing',
    pricing: { type: 'per_linear_ft', rate: 0.75, minimumCharge: 50 },
    estimatedTime: 30,
    difficulty: 'easy',
    equipmentRequired: ['Brush', 'Drop cloths'],
    isActive: true,
    popularity: 5,
    profitMargin: 65
  },
  {
    id: '2', 
    name: 'Oil Spot Priming',
    description: 'Pre-treatment of oil stains for better sealer adhesion',
    category: 'preparation',
    pricing: { type: 'per_sqft', rate: 2.50, minimumCharge: 75 },
    estimatedTime: 45,
    difficulty: 'medium',
    equipmentRequired: ['Oil primer', 'Brushes', 'Safety equipment'],
    isActive: true,
    popularity: 4,
    profitMargin: 70
  },
  {
    id: '3',
    name: 'Crack Cleaning & Routing',
    description: 'Professional crack preparation before filling',
    category: 'preparation',
    pricing: { type: 'per_linear_ft', rate: 1.25, minimumCharge: 100 },
    estimatedTime: 60,
    difficulty: 'medium',
    equipmentRequired: ['Crack router', 'Air compressor', 'Wire brushes'],
    isActive: true,
    popularity: 4,
    profitMargin: 55
  },
  {
    id: '4',
    name: 'Fast Dry Application',
    description: 'Premium fast-drying additive for quick turnaround',
    category: 'application',
    pricing: { type: 'per_sqft', rate: 0.35, minimumCharge: 150 },
    estimatedTime: 15,
    difficulty: 'easy',
    equipmentRequired: ['Fast dry additive', 'Mixing equipment'],
    isActive: true,
    popularity: 3,
    profitMargin: 45
  },
  {
    id: '5',
    name: 'Line Striping Setup',
    description: 'Layout and application of parking lot lines',
    category: 'specialty',
    pricing: { type: 'per_hour', rate: 85, minimumCharge: 200 },
    estimatedTime: 120,
    difficulty: 'hard',
    equipmentRequired: ['Line striper', 'Paint', 'Measuring tools', 'Stencils'],
    isActive: true,
    popularity: 5,
    profitMargin: 60
  }
];

export const PremiumServicesTab = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<PremiumService[]>(defaultServices);
  const [filteredServices, setFilteredServices] = useState<PremiumService[]>(defaultServices);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<PremiumService | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [newService, setNewService] = useState<Partial<PremiumService>>({
    category: 'preparation',
    pricing: { type: 'per_sqft', rate: 0 },
    difficulty: 'easy',
    equipmentRequired: [],
    isActive: true,
    popularity: 3,
    profitMargin: 50
  });

  useEffect(() => {
    // Load saved services
    const saved = localStorage.getItem('premiumServices');
    if (saved) {
      const savedServices = JSON.parse(saved);
      setServices(savedServices);
      setFilteredServices(savedServices);
    }
  }, []);

  useEffect(() => {
    filterServices();
  }, [categoryFilter, services]);

  const filterServices = () => {
    if (categoryFilter === 'all') {
      setFilteredServices(services);
    } else {
      setFilteredServices(services.filter(s => s.category === categoryFilter));
    }
  };

  const saveService = () => {
    if (!newService.name || !newService.description || !newService.pricing?.rate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const service: PremiumService = {
      id: editingService?.id || Date.now().toString(),
      name: newService.name || '',
      description: newService.description || '',
      category: newService.category as PremiumService['category'],
      pricing: newService.pricing as PremiumService['pricing'],
      estimatedTime: newService.estimatedTime || 30,
      difficulty: newService.difficulty as PremiumService['difficulty'],
      equipmentRequired: newService.equipmentRequired || [],
      isActive: newService.isActive ?? true,
      popularity: newService.popularity || 3,
      profitMargin: newService.profitMargin || 50
    };

    let updatedServices;
    if (editingService) {
      updatedServices = services.map(s => s.id === editingService.id ? service : s);
    } else {
      updatedServices = [...services, service];
    }

    setServices(updatedServices);
    localStorage.setItem('premiumServices', JSON.stringify(updatedServices));

    toast({
      title: editingService ? "Service updated!" : "Service added!",
      description: `${service.name} has been ${editingService ? 'updated' : 'added'} successfully.`
    });

    resetForm();
  };

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingService(null);
    setNewService({
      category: 'preparation',
      pricing: { type: 'per_sqft', rate: 0 },
      difficulty: 'easy',
      equipmentRequired: [],
      isActive: true,
      popularity: 3,
      profitMargin: 50
    });
  };

  const editService = (service: PremiumService) => {
    setEditingService(service);
    setNewService(service);
    setIsDialogOpen(true);
  };

  const deleteService = (id: string) => {
    const updatedServices = services.filter(s => s.id !== id);
    setServices(updatedServices);
    localStorage.setItem('premiumServices', JSON.stringify(updatedServices));

    toast({
      title: "Service deleted",
      description: "The premium service has been removed."
    });
  };

  const toggleServiceStatus = (id: string) => {
    const updatedServices = services.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    );
    setServices(updatedServices);
    localStorage.setItem('premiumServices', JSON.stringify(updatedServices));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'preparation': return '🔧';
      case 'application': return '🎨';
      case 'finishing': return '✨';
      case 'specialty': return '⭐';
      case 'maintenance': return '🔄';
      default: return '📋';
    }
  };

  const formatPricing = (pricing: PremiumService['pricing']) => {
    const { type, rate, minimumCharge } = pricing;
    let unit = '';
    
    switch (type) {
      case 'per_sqft': unit = '/sq ft'; break;
      case 'per_hour': unit = '/hour'; break;
      case 'per_linear_ft': unit = '/linear ft'; break;
      case 'flat_rate': unit = ' flat'; break;
    }

    return `$${rate}${unit}${minimumCharge ? ` (min $${minimumCharge})` : ''}`;
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'preparation', label: 'Preparation' },
    { value: 'application', label: 'Application' },
    { value: 'finishing', label: 'Finishing' },
    { value: 'specialty', label: 'Specialty' },
    { value: 'maintenance', label: 'Maintenance' }
  ];

  const totalRevenuePotential = filteredServices
    .filter(s => s.isActive)
    .reduce((sum, s) => sum + (s.pricing.rate * s.popularity * 100), 0);

  const averageMargin = filteredServices.length > 0 
    ? filteredServices.reduce((sum, s) => sum + s.profitMargin, 0) / filteredServices.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-professional">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Services</p>
                <p className="text-2xl font-bold text-primary">{services.filter(s => s.isActive).length}</p>
              </div>
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Margin</p>
                <p className="text-2xl font-bold text-green-600">{averageMargin.toFixed(0)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue Potential</p>
                <p className="text-2xl font-bold text-blue-600">${totalRevenuePotential.toFixed(0)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {(services.reduce((sum, s) => sum + s.popularity, 0) / services.length).toFixed(1)}⭐
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header and Controls */}
      <Card className="card-professional">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Premium Services Management
            </CardTitle>
            
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary" onClick={() => setEditingService(null)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingService ? 'Edit Premium Service' : 'Add Premium Service'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="serviceName">Service Name</Label>
                        <Input
                          id="serviceName"
                          value={newService.name || ''}
                          onChange={(e) => setNewService({...newService, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select 
                          value={newService.category} 
                          onValueChange={(value: PremiumService['category']) => 
                            setNewService({...newService, category: value})
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="preparation">Preparation</SelectItem>
                            <SelectItem value="application">Application</SelectItem>
                            <SelectItem value="finishing">Finishing</SelectItem>
                            <SelectItem value="specialty">Specialty</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newService.description || ''}
                        onChange={(e) => setNewService({...newService, description: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="pricingType">Pricing Type</Label>
                        <Select 
                          value={newService.pricing?.type} 
                          onValueChange={(value: PremiumService['pricing']['type']) => 
                            setNewService({
                              ...newService, 
                              pricing: {...newService.pricing, type: value} as PremiumService['pricing']
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="per_sqft">Per Sq Ft</SelectItem>
                            <SelectItem value="per_hour">Per Hour</SelectItem>
                            <SelectItem value="per_linear_ft">Per Linear Ft</SelectItem>
                            <SelectItem value="flat_rate">Flat Rate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="rate">Rate ($)</Label>
                        <Input
                          id="rate"
                          type="number"
                          step="0.01"
                          value={newService.pricing?.rate || ''}
                          onChange={(e) => setNewService({
                            ...newService,
                            pricing: {
                              ...newService.pricing,
                              rate: parseFloat(e.target.value) || 0
                            } as PremiumService['pricing']
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="minimum">Minimum Charge ($)</Label>
                        <Input
                          id="minimum"
                          type="number"
                          step="0.01"
                          value={newService.pricing?.minimumCharge || ''}
                          onChange={(e) => setNewService({
                            ...newService,
                            pricing: {
                              ...newService.pricing,
                              minimumCharge: parseFloat(e.target.value) || undefined
                            } as PremiumService['pricing']
                          })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="estimatedTime">Est. Time (min)</Label>
                        <Input
                          id="estimatedTime"
                          type="number"
                          value={newService.estimatedTime || ''}
                          onChange={(e) => setNewService({...newService, estimatedTime: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <Select 
                          value={newService.difficulty} 
                          onValueChange={(value: PremiumService['difficulty']) => 
                            setNewService({...newService, difficulty: value})
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="profitMargin">Profit Margin (%)</Label>
                        <Input
                          id="profitMargin"
                          type="number"
                          value={newService.profitMargin || ''}
                          onChange={(e) => setNewService({...newService, profitMargin: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="equipment">Equipment Required (comma separated)</Label>
                      <Input
                        id="equipment"
                        value={newService.equipmentRequired?.join(', ') || ''}
                        onChange={(e) => setNewService({
                          ...newService,
                          equipmentRequired: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                      <Button onClick={saveService} className="btn-primary">
                        {editingService ? 'Update Service' : 'Add Service'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => (
          <Card key={service.id} className="card-professional hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(service.category)}</span>
                  <Badge className={`${getDifficultyColor(service.difficulty)} text-white text-xs`}>
                    {service.difficulty}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < service.popularity ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Switch
                    checked={service.isActive}
                    onCheckedChange={() => toggleServiceStatus(service.id)}
                  />
                </div>
              </div>

              <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{service.description}</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pricing:</span>
                  <span className="font-semibold text-primary">{formatPricing(service.pricing)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {service.estimatedTime}min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margin:</span>
                  <span className="font-semibold text-green-600">{service.profitMargin}%</span>
                </div>
              </div>

              {service.equipmentRequired.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Equipment:</p>
                  <div className="flex flex-wrap gap-1">
                    {service.equipmentRequired.slice(0, 3).map((equipment, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {equipment}
                      </Badge>
                    ))}
                    {service.equipmentRequired.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{service.equipmentRequired.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => editService(service)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteService(service.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <Card className="card-professional">
          <CardContent className="text-center py-12">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No premium services found</h3>
            <p className="text-muted-foreground mb-4">
              {categoryFilter !== 'all' 
                ? `No services found in the ${categoryFilter} category.`
                : "Add your first premium service to get started."
              }
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="btn-primary">
              <Plus className="mr-2 h-4 w-4" />
              Add Premium Service
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};