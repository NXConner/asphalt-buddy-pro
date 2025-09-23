import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ShieldCheck, AlertTriangle, CheckCircle2, Star, Clock, Thermometer, Droplets } from "lucide-react";

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
      'Use respirator when working with sealers and chemicals',
      'Wear long pants and long-sleeved shirts',
      'Use chemical-resistant gloves',
      'Wear non-slip, closed-toe shoes',
      'Use hard hat in areas with overhead hazards'
    ],
    tips: [
      'Keep extra PPE in vehicle for emergencies',
      'Replace damaged PPE immediately',
      'Clean PPE regularly to maintain effectiveness',
      'Train all crew members on proper PPE usage'
    ],
    warnings: [
      'Never work without proper PPE',
      'Sealer vapors can cause respiratory issues',
      'Chemical burns possible with direct skin contact'
    ],
    regulatoryInfo: 'OSHA requires appropriate PPE for construction work. Check local regulations for specific requirements.'
  },
  {
    id: '2',
    category: 'weather',
    title: 'Optimal Weather Conditions',
    description: 'Weather requirements for successful sealcoating application',
    importance: 'critical',
    steps: [
      'Check weather forecast 48 hours in advance',
      'Ensure air temperature is between 50°F and 85°F',
      'Pavement temperature should be between 60°F and 90°F',
      'Avoid application if rain expected within 24 hours',
      'Wind speed should be less than 15 mph',
      'Relative humidity should be below 85%'
    ],
    tips: [
      'Early morning applications often have ideal conditions',
      'Use infrared thermometer for accurate pavement temperature',
      'Monitor radar for unexpected weather changes',
      'Have weather monitoring app on phone'
    ],
    warnings: [
      'Sealer applied in poor weather may fail prematurely',
      'High humidity can prevent proper curing',
      'Cold temperatures slow curing process significantly'
    ],
    seasonality: 'Best results achieved between April and October in most climates'
  },
  {
    id: '3',
    category: 'quality',
    title: 'Surface Preparation Standards',
    description: 'Proper cleaning and preparation techniques',
    importance: 'high',
    steps: [
      'Remove all loose debris and vegetation',
      'Clean oil stains with degreaser',
      'Fill cracks larger than 1/4 inch',
      'Allow cleaning solutions to dry completely',
      'Inspect for proper drainage',
      'Mark sprinkler heads and utilities'
    ],
    tips: [
      'Use rotary broom for thorough cleaning',
      'Pressure wash heavily soiled areas',
      'Allow 24 hours after pressure washing before sealing',
      'Take before and after photos for documentation'
    ],
    warnings: [
      'Poor preparation is the leading cause of premature failure',
      'Wet surfaces will prevent proper adhesion',
      'Overlooked oil stains will bleed through sealer'
    ]
  },
  {
    id: '4',
    category: 'materials',
    title: 'Sealer Mixing and Application',
    description: 'Proper sealer preparation and application techniques',
    importance: 'high',
    steps: [
      'Stir sealer thoroughly before use',
      'Add sand at recommended rate (typically 2-3 lbs per gallon)',
      'Mix additives according to manufacturer specifications',
      'Apply in thin, even coats',
      'Maintain consistent application rate',
      'Overlap spray patterns by 2-4 inches'
    ],
    tips: [
      'Use mechanical paddle mixer for best results',
      'Test spray pattern on cardboard before starting',
      'Keep sealer containers closed when not in use',
      'Work systematically from one end to the other'
    ],
    warnings: [
      'Over-application leads to tracking and poor curing',
      'Under-mixing results in uneven coverage',
      'Contaminated sealer may cause adhesion problems'
    ]
  },
  {
    id: '5',
    category: 'equipment',
    title: 'Spray Equipment Maintenance',
    description: 'Daily maintenance procedures for spray equipment',
    importance: 'high',
    steps: [
      'Check pump pressure settings',
      'Inspect hoses for wear and leaks',
      'Clean spray tips and filters',
      'Check hydraulic fluid levels',
      'Calibrate spray gun pressure',
      'Clean tank thoroughly after each use'
    ],
    tips: [
      'Keep spare spray tips and filters on hand',
      'Use appropriate cleaning solvents',
      'Store equipment in covered area',
      'Schedule professional maintenance annually'
    ],
    warnings: [
      'Dirty equipment leads to poor application quality',
      'Worn spray tips create uneven patterns',
      'Low pump pressure reduces coverage rate'
    ]
  },
  {
    id: '6',
    category: 'regulations',
    title: 'Environmental Compliance',
    description: 'Environmental regulations and best practices',
    importance: 'critical',
    steps: [
      'Prevent material from entering storm drains',
      'Use drop cloths around sensitive areas',
      'Store materials in approved containers',
      'Dispose of waste materials properly',
      'Follow local VOC regulations',
      'Maintain spill cleanup materials on site'
    ],
    tips: [
      'Contact local environmental agency for specific requirements',
      'Use low-VOC sealers when required',
      'Keep Material Safety Data Sheets (MSDS) on site',
      'Train crew on spill response procedures'
    ],
    warnings: [
      'Violations can result in significant fines',
      'Contamination of water sources is illegal',
      'Improper disposal harms environment'
    ],
    regulatoryInfo: 'EPA and state environmental agencies regulate asphalt maintenance activities. Check local requirements before starting work.'
  }
];

export const BestPracticesTab = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [practices] = useState<BestPractice[]>(bestPracticesData);

  const filteredPractices = selectedCategory === 'all' 
    ? practices 
    : practices.filter(p => p.category === selectedCategory);

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'safety': return <Shield className="h-5 w-5" />;
      case 'quality': return <Star className="h-5 w-5" />;
      case 'weather': return <Thermometer className="h-5 w-5" />;
      case 'equipment': return <Clock className="h-5 w-5" />;
      case 'materials': return <Droplets className="h-5 w-5" />;
      case 'regulations': return <BookOpen className="h-5 w-5" />;
      default: return <CheckCircle className="h-5 w-5" />;
    }
  };

  const categories = [
    { id: 'all', label: 'All Practices', count: practices.length },
    { id: 'safety', label: 'Safety', count: practices.filter(p => p.category === 'safety').length },
    { id: 'quality', label: 'Quality', count: practices.filter(p => p.category === 'quality').length },
    { id: 'weather', label: 'Weather', count: practices.filter(p => p.category === 'weather').length },
    { id: 'equipment', label: 'Equipment', count: practices.filter(p => p.category === 'equipment').length },
    { id: 'materials', label: 'Materials', count: practices.filter(p => p.category === 'materials').length },
    { id: 'regulations', label: 'Regulations', count: practices.filter(p => p.category === 'regulations').length }
  ];

  return (
    <div className="space-y-6">
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Asphalt Maintenance Best Practices
          </CardTitle>
          <p className="text-muted-foreground">
            Industry standards, safety protocols, and professional techniques for asphalt maintenance work
          </p>
        </CardHeader>
      </Card>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          {categories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="flex flex-col items-center gap-1 p-3"
            >
              <span className="text-xs font-medium">{category.label}</span>
              <Badge variant="secondary" className="text-xs">
                {category.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="space-y-4">
            {filteredPractices.map((practice) => (
              <Card key={practice.id} className="card-professional">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(practice.category)}
                      <div>
                        <h3 className="text-lg font-semibold">{practice.title}</h3>
                        <p className="text-sm text-muted-foreground">{practice.description}</p>
                      </div>
                    </div>
                    <Badge className={`${getImportanceColor(practice.importance)} text-white`}>
                      {practice.importance}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="steps">
                      <AccordionTrigger className="text-left">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Step-by-Step Procedures ({practice.steps.length} steps)
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ol className="space-y-2">
                          {practice.steps.map((step, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </span>
                              <span className="text-sm">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="tips">
                      <AccordionTrigger className="text-left">
                        <span className="flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Professional Tips ({practice.tips.length} tips)
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {practice.tips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <Star className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    {practice.warnings && practice.warnings.length > 0 && (
                      <AccordionItem value="warnings">
                        <AccordionTrigger className="text-left">
                          <span className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Important Warnings ({practice.warnings.length} warnings)
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2">
                            {practice.warnings.map((warning, index) => (
                              <li key={index} className="flex items-start gap-3">
                                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-red-700 dark:text-red-300">{warning}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {practice.seasonality && (
                      <AccordionItem value="seasonality">
                        <AccordionTrigger className="text-left">
                          <span className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4" />
                            Seasonal Considerations
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-muted-foreground">{practice.seasonality}</p>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {practice.regulatoryInfo && (
                      <AccordionItem value="regulatory">
                        <AccordionTrigger className="text-left">
                          <span className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Regulatory Information
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-muted-foreground">{practice.regulatoryInfo}</p>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredPractices.length === 0 && (
        <Card className="card-professional">
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No practices found</h3>
            <p className="text-muted-foreground">
              No best practices available for the selected category.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Reference Card */}
      <Card className="card-professional border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <AlertTriangle className="h-5 w-5" />
            Critical Safety Reminder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-600" />
              <span>Always wear proper PPE</span>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-600" />
              <span>Check weather conditions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-orange-600" />
              <span>Follow preparation standards</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};