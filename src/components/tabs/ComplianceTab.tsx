import React, { useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RegionKey = 'general' | 'va' | 'nc';

interface ChecklistItem {
  title: string;
  points: string[];
  notes?: string[];
}

interface Section {
  id: string;
  label: string;
  icon: ReactNode;
  items: ChecklistItem[];
}

const sectionIcons = {
  rules: '📋',
  standards: '📏',
  policies: '📚',
  compliance: '⚖️',
};

const regionLabel: Record<RegionKey, string> = {
  general: 'General Requirements',
  va: 'Virginia Specific',
  nc: 'North Carolina Specific'
};

const complianceData: Record<RegionKey, Section[]> = {
  general: [
    {
      id: 'safety',
      label: 'Safety Standards',
      icon: '🛡️',
      items: [
        {
          title: 'Personal Protective Equipment',
          points: [
            'Safety glasses required at all times',
            'Heat-resistant gloves for hot asphalt work',
            'High-visibility clothing in traffic areas',
            'Steel-toed boots with slip-resistant soles'
          ]
        },
        {
          title: 'Traffic Control',
          points: [
            'Proper signage and barriers required',
            'Flag persons must be certified',
            'Work zone speed limits enforced',
            'Emergency vehicle access maintained'
          ]
        }
      ]
    },
    {
      id: 'environmental',
      label: 'Environmental Compliance',
      icon: '🌱',
      items: [
        {
          title: 'Storm Water Management',
          points: [
            'Prevent contaminated runoff',
            'Cover stockpiled materials',
            'Maintain sediment barriers',
            'Report any spills immediately'
          ]
        },
        {
          title: 'Air Quality',
          points: [
            'Monitor emissions from equipment',
            'Use low-emission equipment when possible',
            'Minimize dust generation',
            'Comply with local air quality standards'
          ]
        }
      ]
    }
  ],
  va: [
    {
      id: 'vdot',
      label: 'VDOT Requirements',
      icon: '🛣️',
      items: [
        {
          title: 'Material Standards',
          points: [
            'All materials must meet VDOT specifications',
            'Certified mix designs required',
            'Quality control testing mandatory',
            'Supplier certification required'
          ]
        },
        {
          title: 'Work Zone Safety',
          points: [
            'VDOT work zone manual compliance',
            'Certified traffic control supervisors',
            'Daily safety briefings required',
            'Incident reporting procedures'
          ]
        }
      ]
    }
  ],
  nc: [
    {
      id: 'ncdot',
      label: 'NCDOT Requirements',
      icon: '🛤️',
      items: [
        {
          title: 'Quality Assurance',
          points: [
            'NCDOT approved materials only',
            'Independent testing required',
            'Compaction density standards',
            'Temperature monitoring mandatory'
          ]
        }
      ]
    }
  ]
};

export const ComplianceTab = () => {
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>('general');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  const getCompletionPercentage = () => {
    const totalItems = complianceData[selectedRegion].reduce(
      (total, section) => total + section.items.reduce((sectionTotal, item) => sectionTotal + item.points.length, 0),
      0
    );
    return totalItems > 0 ? Math.round((checkedItems.size / totalItems) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Management</h2>
          <p className="text-muted-foreground">Regulatory requirements and safety standards</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            {getCompletionPercentage()}% Complete
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="checklist" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            📋 Checklist
          </TabsTrigger>
          <TabsTrigger value="regulations" className="flex items-center gap-2">
            📚 Regulations
          </TabsTrigger>
          <TabsTrigger value="safety" className="flex items-center gap-2">
            🛡️ Safety
          </TabsTrigger>
          <TabsTrigger value="traffic" className="flex items-center gap-2">
            🚧 Traffic Control
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-4">
          <div className="flex gap-2 mb-4">
            {Object.entries(regionLabel).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedRegion(key as RegionKey)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedRegion === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            {complianceData[selectedRegion].map(section => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>{section.icon}</span>
                    {section.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {section.items.map((item, itemIndex) => (
                      <AccordionItem key={itemIndex} value={`${section.id}-${itemIndex}`}>
                        <AccordionTrigger className="text-left">
                          {item.title}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {item.points.map((point, pointIndex) => {
                              const itemId = `${section.id}-${itemIndex}-${pointIndex}`;
                              return (
                                <div key={pointIndex} className="flex items-start gap-2">
                                  <input
                                    type="checkbox"
                                    id={itemId}
                                    checked={checkedItems.has(itemId)}
                                    onChange={() => toggleItem(itemId)}
                                    className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <label htmlFor={itemId} className="text-sm flex-1">
                                    {point}
                                  </label>
                                </div>
                              );
                            })}
                            {item.notes && (
                              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                                <p className="text-sm font-medium mb-1">Additional Notes:</p>
                                {item.notes.map((note, noteIndex) => (
                                  <p key={noteIndex} className="text-sm text-muted-foreground">
                                    • {note}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="regulations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Framework</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Federal Requirements</h4>
                  <ul className="text-sm space-y-1">
                    <li>• OSHA safety standards</li>
                    <li>• EPA environmental regulations</li>
                    <li>• DOT material specifications</li>
                    <li>• ADA accessibility requirements</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">State Requirements</h4>
                  <ul className="text-sm space-y-1">
                    <li>• State DOT specifications</li>
                    <li>• Local building codes</li>
                    <li>• Environmental permits</li>
                    <li>• Professional licensing</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🛡️ Safety Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">PPE Requirements</h4>
                  <ul className="text-sm space-y-1">
                    <li>✓ Safety glasses</li>
                    <li>✓ Hard hat</li>
                    <li>✓ Steel-toed boots</li>
                    <li>✓ High-vis clothing</li>
                    <li>✓ Heat-resistant gloves</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Equipment Safety</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Daily equipment inspections</li>
                    <li>• Operator certification</li>
                    <li>• Maintenance records</li>
                    <li>• Emergency shut-offs</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Emergency Procedures</h4>
                  <ul className="text-sm space-y-1">
                    <li>• First aid kit on site</li>
                    <li>• Emergency contacts posted</li>
                    <li>• Evacuation routes marked</li>
                    <li>• Incident reporting forms</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🚧 Traffic Control Standards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Signage Requirements</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-orange-100 dark:bg-orange-950 rounded">
                      <span className="text-orange-600">⚠️</span>
                      <span className="text-sm">Work Zone Ahead signs</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-950 rounded">
                      <span className="text-red-600">🛑</span>
                      <span className="text-sm">Stop/Slow paddles</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-yellow-100 dark:bg-yellow-950 rounded">
                      <span className="text-yellow-600">🚧</span>
                      <span className="text-sm">Construction barriers</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Personnel Requirements</h4>
                  <ul className="text-sm space-y-2">
                    <li>• Certified flaggers required</li>
                    <li>• High-visibility clothing mandatory</li>
                    <li>• Two-way radio communication</li>
                    <li>• Traffic control supervisor on site</li>
                    <li>• Regular safety briefings</li>
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