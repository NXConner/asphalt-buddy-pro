import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      {cart.length > 0 && (
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
                <div key={index} className="flex justify-between items-center py-2 border-b border-border/50">
                  <div>
                    <p className="font-medium">{item.stencil.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${item.stencil.price} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">${(item.stencil.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-3 text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">${getTotalCart().toFixed(2)}</span>
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