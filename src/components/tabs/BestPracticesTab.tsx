import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BestPractice {
  id: string;
  category: 'safety' | 'quality' | 'weather' | 'equipment' | 'materials' | 'regulations';
  title: string;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  steps: string[];
  tips: string[];
  warnings?: string[];
  seasonality?: string;
  regulatoryInfo?: string;
}

const bestPracticesData: BestPractice[] = [
  {
    id: '1',
    category: 'safety',
    title: 'Personal Protective Equipment (PPE)',
    description: 'Essential safety gear for asphalt maintenance work',
    importance: 'critical',
    steps: [
      'Wear safety glasses or goggles at all times',
      'Use heat-resistant gloves when handling hot materials',
      'Wear high-visibility clothing',
      'Use steel-toed boots with slip-resistant soles',
      'Wear hard hats in designated areas'
    ],
    tips: [
      'Replace damaged PPE immediately',
      'Ensure all PPE is properly fitted',
      'Clean and maintain equipment regularly'
    ],
    warnings: [
      'Never work without proper eye protection',
      'Hot asphalt can cause severe burns'
    ]
  },
  {
    id: '2',
    category: 'quality',
    title: 'Proper Surface Preparation',
    description: 'Critical steps for preparing surfaces before asphalt application',
    importance: 'critical',
    steps: [
      'Clean all debris and vegetation',
      'Repair cracks and potholes',
      'Apply primer or tack coat where needed',
      'Ensure proper drainage',
      'Check for structural integrity'
    ],
    tips: [
      'Use compressed air for thorough cleaning',
      'Test adhesion before full application',
      'Document all preparation steps'
    ]
  },
  {
    id: '3',
    category: 'weather',
    title: 'Weather Considerations',
    description: 'Understanding weather impact on asphalt work',
    importance: 'high',
    steps: [
      'Check weather forecast 48 hours ahead',
      'Avoid work during rain or high humidity',
      'Monitor temperature conditions',
      'Plan for wind direction and speed',
      'Have contingency plans ready'
    ],
    tips: [
      'Early morning starts often provide best conditions',
      'Keep materials covered during transport',
      'Use weather monitoring apps'
    ],
    seasonality: 'Best performed in spring through fall, avoid extreme temperatures'
  }
];

export const BestPracticesTab = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const categories = [
    { id: 'all', label: 'All Categories', icon: '📋' },
    { id: 'safety', label: 'Safety', icon: '🛡️' },
    { id: 'quality', label: 'Quality Control', icon: '✅' },
    { id: 'weather', label: 'Weather Guidelines', icon: '🌤️' },
    { id: 'equipment', label: 'Equipment', icon: '🔧' },
    { id: 'materials', label: 'Materials', icon: '🧱' },
    { id: 'regulations', label: 'Regulations', icon: '📋' }
  ];

  const filteredPractices = selectedCategory === 'all' 
    ? bestPracticesData 
    : bestPracticesData.filter(practice => practice.category === selectedCategory);

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Best Practices Guide</h2>
          <p className="text-muted-foreground">Industry standards and proven methods for asphalt work</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredPractices.length} practices
        </Badge>
      </div>

      <Tabs defaultValue="practices" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="practices" className="flex items-center gap-2">
            📋 Practices
          </TabsTrigger>
          <TabsTrigger value="safety" className="flex items-center gap-2">
            🛡️ Safety
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            ✅ Quality
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            🔧 Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="practices" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2"
              >
                <span>{category.icon}</span>
                {category.label}
              </Button>
            ))}
          </div>

          <div className="grid gap-4">
            {filteredPractices.map(practice => (
              <Card key={practice.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-3">
                        {practice.title}
                        <Badge 
                          className={`text-white ${getImportanceColor(practice.importance)}`}
                        >
                          {practice.importance}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {practice.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(practice.id)}
                    >
                      {expandedItems.includes(practice.id) ? '−' : '+'}
                    </Button>
                  </div>
                </CardHeader>

                {expandedItems.includes(practice.id) && (
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        📝 Steps
                      </h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        {practice.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        💡 Tips
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {practice.tips.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>

                    {practice.warnings && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-600">
                          ⚠️ Warnings
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                          {practice.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {practice.seasonality && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          🌤️ Seasonal Notes
                        </h4>
                        <p className="text-sm text-muted-foreground">{practice.seasonality}</p>
                      </div>
                    )}

                    {practice.regulatoryInfo && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          📋 Regulatory Information
                        </h4>
                        <p className="text-sm text-muted-foreground">{practice.regulatoryInfo}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="safety" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🛡️ Safety Protocols
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Required PPE</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Safety glasses/goggles</li>
                    <li>• Heat-resistant gloves</li>
                    <li>• High-visibility clothing</li>
                    <li>• Steel-toed boots</li>
                    <li>• Hard hat</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Emergency Procedures</h4>
                  <ul className="text-sm space-y-1">
                    <li>• First aid kit accessible</li>
                    <li>• Emergency contact numbers</li>
                    <li>• Fire extinguisher on site</li>
                    <li>• Burn treatment protocol</li>
                    <li>• Evacuation routes marked</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};