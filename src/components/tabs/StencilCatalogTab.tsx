import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Palette, Search, ShoppingCart, Plus, Ruler } from "lucide-react";

interface Stencil {
  id: string;
  name: string;
  category: string;
  size: string;
  price: number;
  material: string;
  durability: string;
  description: string;
  inStock: boolean;
}

const stencilData: Stencil[] = [
  { id: '1', name: 'Handicap Symbol', category: 'ADA Compliance', size: '36" x 36"', price: 45.99, material: 'Polyethylene', durability: '2-3 years', description: 'Standard ADA compliant handicap symbol stencil', inStock: true },
  { id: '2', name: 'Arrow - Straight', category: 'Directional', size: '48" x 12"', price: 28.50, material: 'LDPE', durability: '2-3 years', description: 'Straight directional arrow for traffic flow', inStock: true },
  { id: '3', name: 'Arrow - Turn Right', category: 'Directional', size: '36" x 36"', price: 32.75, material: 'LDPE', durability: '2-3 years', description: 'Right turn arrow for corner marking', inStock: true },
  { id: '4', name: 'Arrow - Turn Left', category: 'Directional', size: '36" x 36"', price: 32.75, material: 'LDPE', durability: '2-3 years', description: 'Left turn arrow for corner marking', inStock: false },
  { id: '5', name: 'STOP Text', category: 'Text', size: '72" x 24"', price: 52.00, material: 'Polyethylene', durability: '3-4 years', description: 'Large STOP text for stop lines', inStock: true },
  { id: '6', name: 'LOADING ZONE', category: 'Text', size: '120" x 18"', price: 75.25, material: 'Polyethylene', durability: '3-4 years', description: 'Loading zone designation text', inStock: true },
  { id: '7', name: 'Fire Lane - No Parking', category: 'Safety', size: '144" x 6"', price: 68.99, material: 'LDPE', durability: '2-3 years', description: 'Fire lane marking stencil', inStock: true },
  { id: '8', name: 'Visitor Parking', category: 'Text', size: '48" x 12"', price: 35.50, material: 'LDPE', durability: '2-3 years', description: 'Visitor parking designation', inStock: true },
  { id: '9', name: 'Number Set 0-9', category: 'Numbers', size: '12" x 8" each', price: 89.99, material: 'Polyethylene', durability: '3-4 years', description: 'Complete number set for parking spaces', inStock: true },
  { id: '10', name: 'Compact Car Only', category: 'Text', size: '72" x 12"', price: 42.25, material: 'LDPE', durability: '2-3 years', description: 'Compact car parking designation', inStock: true },
];

export const StencilCatalogTab = () => {
  const [stencils] = useState<Stencil[]>(stencilData);
  const [filteredStencils, setFilteredStencils] = useState<Stencil[]>(stencilData);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cart, setCart] = useState<{stencil: Stencil, quantity: number}[]>([]);
  const [lineStriping, setLineStriping] = useState({
    stallLines: { quantity: 0, pricePer: 0, color: 'white' },
    letters: { quantity: 0, pricePer: 0, color: 'white' },
    numbers: { quantity: 0, pricePer: 0, color: 'white' },
    handicap: { quantity: 0, pricePer: 0, color: 'blue' },
    arrows: {
      straight: { quantity: 0, pricePer: 0, color: 'white' },
      leftTurn: { quantity: 0, pricePer: 0, color: 'white' },
      rightTurn: { quantity: 0, pricePer: 0, color: 'white' }
    },
    curbStops: { quantity: 0, pricePer: 0, color: 'yellow' },
    fireLane: { quantity: 0, pricePer: 0, color: 'red' }
  });

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterStencils(term, categoryFilter);
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category);
    filterStencils(searchTerm, category);
  };

  const filterStencils = (search: string, category: string) => {
    let filtered = stencils;

    if (search) {
      filtered = filtered.filter(stencil => 
        stencil.name.toLowerCase().includes(search.toLowerCase()) ||
        stencil.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category !== 'all') {
      filtered = filtered.filter(stencil => stencil.category === category);
    }

    setFilteredStencils(filtered);
  };

  const addToCart = (stencil: Stencil) => {
    setCart(prev => {
      const existing = prev.find(item => item.stencil.id === stencil.id);
      if (existing) {
        return prev.map(item => 
          item.stencil.id === stencil.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { stencil, quantity: 1 }];
    });
  };

  const getTotalCart = () => {
    return cart.reduce((total, item) => total + (item.stencil.price * item.quantity), 0);
  };

  const getLineStripingTotal = () => {
    const s = lineStriping;
    const baseItems = (
      s.stallLines.quantity * s.stallLines.pricePer +
      s.letters.quantity * s.letters.pricePer +
      s.numbers.quantity * s.numbers.pricePer +
      s.handicap.quantity * s.handicap.pricePer +
      s.curbStops.quantity * s.curbStops.pricePer +
      s.fireLane.quantity * s.fireLane.pricePer
    );
    const arrows = (
      s.arrows.straight.quantity * s.arrows.straight.pricePer +
      s.arrows.leftTurn.quantity * s.arrows.leftTurn.pricePer +
      s.arrows.rightTurn.quantity * s.arrows.rightTurn.pricePer
    );
    return baseItems + arrows;
  };

  const colorOptions = [
    { value: 'white', label: 'White' },
    { value: 'blue', label: 'Blue' },
    { value: 'yellow', label: 'Yellow' }
  ];

  const categories = ['all', ...Array.from(new Set(stencils.map(s => s.category)))];

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <Card className="card-professional">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Stencil Catalog
            </CardTitle>
            
            {cart.length > 0 && (
              <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
                <ShoppingCart className="h-4 w-4" />
                <span className="font-medium">{cart.length} items - ${getTotalCart().toFixed(2)}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search stencils..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Line Striping & Stencils Custom Builder */}
      <Card className="card-professional border-primary/20">
        <CardHeader>
          <CardTitle>Line Striping & Stencils</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Parking Stall Lines */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="stallLinesQty">Parking Stall Lines - Quantity</Label>
              <Input
                id="stallLinesQty"
                type="number"
                value={lineStriping.stallLines.quantity}
                onChange={(e) => setLineStriping(prev => ({
                  ...prev,
                  stallLines: { ...prev.stallLines, quantity: parseFloat(e.target.value) || 0 }
                }))}
                className="input-professional"
              />
            </div>
            <div>
              <Label htmlFor="stallLinesPrice">Price per Line</Label>
              <Input
                id="stallLinesPrice"
                type="number"
                value={lineStriping.stallLines.pricePer}
                onChange={(e) => setLineStriping(prev => ({
                  ...prev,
                  stallLines: { ...prev.stallLines, pricePer: parseFloat(e.target.value) || 0 }
                }))}
                className="input-professional"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Paint Color</Label>
              <Select value={lineStriping.stallLines.color} onValueChange={(v) => setLineStriping(prev => ({
                ...prev,
                stallLines: { ...prev.stallLines, color: v }
              }))}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Letters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="lettersQty">Letters - Quantity</Label>
              <Input
                id="lettersQty"
                type="number"
                value={lineStriping.letters.quantity}
                onChange={(e) => setLineStriping(prev => ({
                  ...prev,
                  letters: { ...prev.letters, quantity: parseFloat(e.target.value) || 0 }
                }))}
                className="input-professional"
              />
            </div>
            <div>
              <Label htmlFor="lettersPrice">Price per Letter</Label>
              <Input
                id="lettersPrice"
                type="number"
                value={lineStriping.letters.pricePer}
                onChange={(e) => setLineStriping(prev => ({
                  ...prev,
                  letters: { ...prev.letters, pricePer: parseFloat(e.target.value) || 0 }
                }))}
                className="input-professional"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Paint Color</Label>
              <Select value={lineStriping.letters.color} onValueChange={(v) => setLineStriping(prev => ({
                ...prev,
                letters: { ...prev.letters, color: v }
              }))}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="numbersQty">Numbers - Quantity</Label>
              <Input
                id="numbersQty"
                type="number"
                value={lineStriping.numbers.quantity}
                onChange={(e) => setLineStriping(prev => ({
                  ...prev,
                  numbers: { ...prev.numbers, quantity: parseFloat(e.target.value) || 0 }
                }))}
                className="input-professional"
              />
            </div>
            <div>
              <Label htmlFor="numbersPrice">Price per Number</Label>
              <Input
                id="numbersPrice"
                type="number"
                value={lineStriping.numbers.pricePer}
                onChange={(e) => setLineStriping(prev => ({
                  ...prev,
                  numbers: { ...prev.numbers, pricePer: parseFloat(e.target.value) || 0 }
                }))}
                className="input-professional"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Paint Color</Label>
              <Select value={lineStriping.numbers.color} onValueChange={(v) => setLineStriping(prev => ({
                ...prev,
                numbers: { ...prev.numbers, color: v }
              }))}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Handicap Symbols */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="handicapQty">Handicap Symbols - Quantity</Label>
              <Input
                id="handicapQty"
                type="number"
                value={lineStriping.handicap.quantity}
                onChange={(e) => setLineStriping(prev => ({
                  ...prev,
                  handicap: { ...prev.handicap, quantity: parseFloat(e.target.value) || 0 }
                }))}
                className="input-professional"
              />
            </div>
            <div>
              <Label htmlFor="handicapPrice">Price per Symbol</Label>
              <Input
                id="handicapPrice"
                type="number"
                value={lineStriping.handicap.pricePer}
                onChange={(e) => setLineStriping(prev => ({
                  ...prev,
                  handicap: { ...prev.handicap, pricePer: parseFloat(e.target.value) || 0 }
                }))}
                className="input-professional"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Paint Color</Label>
              <Select value={lineStriping.handicap.color} onValueChange={(v) => setLineStriping(prev => ({
                ...prev,
                handicap: { ...prev.handicap, color: v }
              }))}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Arrows by Type */}
          <div className="space-y-4">
            <Label>Arrows</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Straight */}
              <Card className="card-professional">
                <CardContent className="space-y-3 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Straight - Qty</Label>
                      <Input
                        type="number"
                        value={lineStriping.arrows.straight.quantity}
                        onChange={(e) => setLineStriping(prev => ({
                          ...prev,
                          arrows: { ...prev.arrows, straight: { ...prev.arrows.straight, quantity: parseFloat(e.target.value) || 0 } }
                        }))}
                        className="input-professional"
                      />
                    </div>
                    <div>
                      <Label>Price</Label>
                      <Input
                        type="number"
                        value={lineStriping.arrows.straight.pricePer}
                        onChange={(e) => setLineStriping(prev => ({
                          ...prev,
                          arrows: { ...prev.arrows, straight: { ...prev.arrows.straight, pricePer: parseFloat(e.target.value) || 0 } }
                        }))}
                        className="input-professional"
                      />
                    </div>
                  </div>
                  <Select value={lineStriping.arrows.straight.color} onValueChange={(v) => setLineStriping(prev => ({
                    ...prev,
                    arrows: { ...prev.arrows, straight: { ...prev.arrows.straight, color: v } }
                  }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Left Turn */}
              <Card className="card-professional">
                <CardContent className="space-y-3 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Left Turn - Qty</Label>
                      <Input
                        type="number"
                        value={lineStriping.arrows.leftTurn.quantity}
                        onChange={(e) => setLineStriping(prev => ({
                          ...prev,
                          arrows: { ...prev.arrows, leftTurn: { ...prev.arrows.leftTurn, quantity: parseFloat(e.target.value) || 0 } }
                        }))}
                        className="input-professional"
                      />
                    </div>
                    <div>
                      <Label>Price</Label>
                      <Input
                        type="number"
                        value={lineStriping.arrows.leftTurn.pricePer}
                        onChange={(e) => setLineStriping(prev => ({
                          ...prev,
                          arrows: { ...prev.arrows, leftTurn: { ...prev.arrows.leftTurn, pricePer: parseFloat(e.target.value) || 0 } }
                        }))}
                        className="input-professional"
                      />
                    </div>
                  </div>
                  <Select value={lineStriping.arrows.leftTurn.color} onValueChange={(v) => setLineStriping(prev => ({
                    ...prev,
                    arrows: { ...prev.arrows, leftTurn: { ...prev.arrows.leftTurn, color: v } }
                  }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Right Turn */}
              <Card className="card-professional">
                <CardContent className="space-y-3 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Right Turn - Qty</Label>
                      <Input
                        type="number"
                        value={lineStriping.arrows.rightTurn.quantity}
                        onChange={(e) => setLineStriping(prev => ({
                          ...prev,
                          arrows: { ...prev.arrows, rightTurn: { ...prev.arrows.rightTurn, quantity: parseFloat(e.target.value) || 0 } }
                        }))}
                        className="input-professional"
                      />
                    </div>
                    <div>
                      <Label>Price</Label>
                      <Input
                        type="number"
                        value={lineStriping.arrows.rightTurn.pricePer}
                        onChange={(e) => setLineStriping(prev => ({
                          ...prev,
                          arrows: { ...prev.arrows, rightTurn: { ...prev.arrows.rightTurn, pricePer: parseFloat(e.target.value) || 0 } }
                        }))}
                        className="input-professional"
                      />
                    </div>
                  </div>
                  <Select value={lineStriping.arrows.rightTurn.color} onValueChange={(v) => setLineStriping(prev => ({
                    ...prev,
                    arrows: { ...prev.arrows, rightTurn: { ...prev.arrows.rightTurn, color: v } }
                  }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Curb Stops */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="curbStopsQty">Curb Stops - Quantity</Label>
              <Input
                id="curbStopsQty"
                type="number"
                value={lineStriping.curbStops.quantity}
                onChange={(e) => setLineStriping(prev => ({
                  ...prev,
                  curbStops: { ...prev.curbStops, quantity: parseFloat(e.target.value) || 0 }
                }))}
                className="input-professional"
              />
            </div>
            <div>
              <Label htmlFor="curbStopsPrice">Price per Curb Stop</Label>
              <Input
                id="curbStopsPrice"
                type="number"
                value={lineStriping.curbStops.pricePer}
                onChange={(e) => setLineStriping(prev => ({
                  ...prev,
                  curbStops: { ...prev.curbStops, pricePer: parseFloat(e.target.value) || 0 }
                }))}
                className="input-professional"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Paint Color</Label>
              <Select value={lineStriping.curbStops.color} onValueChange={(v) => setLineStriping(prev => ({
                ...prev,
                curbStops: { ...prev.curbStops, color: v }
              }))}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Fire Lane (Red only) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="fireLaneQty">Fire Lane Text - Quantity</Label>
              <Input
                id="fireLaneQty"
                type="number"
                value={lineStriping.fireLane.quantity}
                onChange={(e) => setLineStriping(prev => ({
                  ...prev,
                  fireLane: { ...prev.fireLane, quantity: parseFloat(e.target.value) || 0 }
                }))}
                className="input-professional"
              />
            </div>
            <div>
              <Label htmlFor="fireLanePrice">Price per Application</Label>
              <Input
                id="fireLanePrice"
                type="number"
                value={lineStriping.fireLane.pricePer}
                onChange={(e) => setLineStriping(prev => ({
                  ...prev,
                  fireLane: { ...prev.fireLane, pricePer: parseFloat(e.target.value) || 0 }
                }))}
                className="input-professional"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Paint Color</Label>
              <Select value={lineStriping.fireLane.color} onValueChange={() => {}}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red">Red (Fire Lane Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Line Striping Subtotal</p>
              <p className="text-2xl font-bold text-primary">${getLineStripingTotal().toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stencil Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStencils.map((stencil) => (
          <Card key={stencil.id} className="card-professional hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{stencil.name}</h3>
                  <Badge variant="secondary" className="mt-1">
                    {stencil.category}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">${stencil.price}</p>
                  <Badge variant={stencil.inStock ? "default" : "destructive"} className="text-xs">
                    {stencil.inStock ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Ruler className="h-4 w-4" />
                <span>{stencil.size}</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Material:</span>
                  <span className="font-medium">{stencil.material}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durability:</span>
                  <span className="font-medium">{stencil.durability}</span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">{stencil.description}</p>
              
              <Button 
                onClick={() => addToCart(stencil)}
                disabled={!stencil.inStock}
                className="w-full"
                variant={stencil.inStock ? "default" : "secondary"}
              >
                <Plus className="mr-2 h-4 w-4" />
                {stencil.inStock ? 'Add to Quote' : 'Out of Stock'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStencils.length === 0 && (
        <Card className="card-professional">
          <CardContent className="text-center py-12">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No stencils found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      )}

      {/* Shopping Cart Summary */}
      {(cart.length > 0 || getLineStripingTotal() > 0) && (
        <Card className="card-professional border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Quote Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={`cart-${index}`} className="flex justify-between items-center py-2 border-b border-border/50">
                  <div>
                    <p className="font-medium">{item.stencil.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${item.stencil.price} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">${(item.stencil.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}

              {/* Line striping summary items */}
              {lineStriping.stallLines.quantity > 0 && lineStriping.stallLines.pricePer > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div>
                    <p className="font-medium">Parking Stall Lines ({lineStriping.stallLines.color})</p>
                    <p className="text-sm text-muted-foreground">${lineStriping.stallLines.pricePer} x {lineStriping.stallLines.quantity}</p>
                  </div>
                  <p className="font-semibold">${(lineStriping.stallLines.quantity * lineStriping.stallLines.pricePer).toFixed(2)}</p>
                </div>
              )}

              {lineStriping.letters.quantity > 0 && lineStriping.letters.pricePer > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div>
                    <p className="font-medium">Letters ({lineStriping.letters.color})</p>
                    <p className="text-sm text-muted-foreground">${lineStriping.letters.pricePer} x {lineStriping.letters.quantity}</p>
                  </div>
                  <p className="font-semibold">${(lineStriping.letters.quantity * lineStriping.letters.pricePer).toFixed(2)}</p>
                </div>
              )}

              {lineStriping.numbers.quantity > 0 && lineStriping.numbers.pricePer > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div>
                    <p className="font-medium">Numbers ({lineStriping.numbers.color})</p>
                    <p className="text-sm text-muted-foreground">${lineStriping.numbers.pricePer} x {lineStriping.numbers.quantity}</p>
                  </div>
                  <p className="font-semibold">${(lineStriping.numbers.quantity * lineStriping.numbers.pricePer).toFixed(2)}</p>
                </div>
              )}

              {lineStriping.handicap.quantity > 0 && lineStriping.handicap.pricePer > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div>
                    <p className="font-medium">Handicap Symbols ({lineStriping.handicap.color})</p>
                    <p className="text-sm text-muted-foreground">${lineStriping.handicap.pricePer} x {lineStriping.handicap.quantity}</p>
                  </div>
                  <p className="font-semibold">${(lineStriping.handicap.quantity * lineStriping.handicap.pricePer).toFixed(2)}</p>
                </div>
              )}

              {lineStriping.arrows.straight.quantity > 0 && lineStriping.arrows.straight.pricePer > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div>
                    <p className="font-medium">Arrows - Straight ({lineStriping.arrows.straight.color})</p>
                    <p className="text-sm text-muted-foreground">${lineStriping.arrows.straight.pricePer} x {lineStriping.arrows.straight.quantity}</p>
                  </div>
                  <p className="font-semibold">${(lineStriping.arrows.straight.quantity * lineStriping.arrows.straight.pricePer).toFixed(2)}</p>
                </div>
              )}
              {lineStriping.arrows.leftTurn.quantity > 0 && lineStriping.arrows.leftTurn.pricePer > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div>
                    <p className="font-medium">Arrows - Left Turn ({lineStriping.arrows.leftTurn.color})</p>
                    <p className="text-sm text-muted-foreground">${lineStriping.arrows.leftTurn.pricePer} x {lineStriping.arrows.leftTurn.quantity}</p>
                  </div>
                  <p className="font-semibold">${(lineStriping.arrows.leftTurn.quantity * lineStriping.arrows.leftTurn.pricePer).toFixed(2)}</p>
                </div>
              )}
              {lineStriping.arrows.rightTurn.quantity > 0 && lineStriping.arrows.rightTurn.pricePer > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div>
                    <p className="font-medium">Arrows - Right Turn ({lineStriping.arrows.rightTurn.color})</p>
                    <p className="text-sm text-muted-foreground">${lineStriping.arrows.rightTurn.pricePer} x {lineStriping.arrows.rightTurn.quantity}</p>
                  </div>
                  <p className="font-semibold">${(lineStriping.arrows.rightTurn.quantity * lineStriping.arrows.rightTurn.pricePer).toFixed(2)}</p>
                </div>
              )}

              {lineStriping.curbStops.quantity > 0 && lineStriping.curbStops.pricePer > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div>
                    <p className="font-medium">Curb Stops ({lineStriping.curbStops.color})</p>
                    <p className="text-sm text-muted-foreground">${lineStriping.curbStops.pricePer} x {lineStriping.curbStops.quantity}</p>
                  </div>
                  <p className="font-semibold">${(lineStriping.curbStops.quantity * lineStriping.curbStops.pricePer).toFixed(2)}</p>
                </div>
              )}

              {lineStriping.fireLane.quantity > 0 && lineStriping.fireLane.pricePer > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div>
                    <p className="font-medium">Fire Lane Text (red)</p>
                    <p className="text-sm text-muted-foreground">${lineStriping.fireLane.pricePer} x {lineStriping.fireLane.quantity}</p>
                  </div>
                  <p className="font-semibold">${(lineStriping.fireLane.quantity * lineStriping.fireLane.pricePer).toFixed(2)}</p>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-3 text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">${(getTotalCart() + getLineStripingTotal()).toFixed(2)}</span>
              </div>
              
              <Button className="w-full btn-primary mt-4">
                Generate Stencil Quote
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};