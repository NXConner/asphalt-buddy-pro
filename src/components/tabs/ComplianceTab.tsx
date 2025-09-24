import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/simple-card";
import { Badge } from "@/components/ui/simple-badge";
import { SimpleAccordion as Accordion, SimpleAccordionContent as AccordionContent, SimpleAccordionItem as AccordionItem, SimpleAccordionTrigger as AccordionTrigger } from "@/components/ui/simple-accordion";

type RegionKey = 'general' | 'va' | 'nc';

const complianceData = {
  general: {
    label: "General Rules",
    sections: [
      {
        id: "safety",
        label: "Safety Requirements", 
        icon: "🦺",
        items: [
          {
            title: "Personal Protective Equipment",
            points: ["Hard hats required at all times", "Safety vests in work zones", "Steel-toe boots mandatory"]
          },
          {
            title: "Vehicle Safety",
            points: ["Daily vehicle inspections", "Emergency equipment check", "Backup alarms functional"]
          }
        ]
      }
    ]
  },
  va: {
    label: "Virginia Requirements",
    sections: [
      {
        id: "va-rules",
        label: "VA State Rules",
        icon: "🏛️", 
        items: [
          {
            title: "State-Specific Regulations",
            points: ["Virginia DOT compliance", "State inspection requirements", "Worker certification"]
          }
        ]
      }
    ]
  },
  nc: {
    label: "North Carolina Requirements", 
    sections: [
      {
        id: "nc-rules",
        label: "NC State Rules",
        icon: "🏛️",
        items: [
          {
            title: "State-Specific Regulations", 
            points: ["North Carolina DOT compliance", "State inspection requirements", "Worker certification"]
          }
        ]
      }
    ]
  }
};

export function ComplianceTab() {
  const [activeRegion, setActiveRegion] = useState<RegionKey>('general');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compliance Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Region Selector */}
            <div className="flex gap-2 mb-6">
              {Object.entries(complianceData).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => setActiveRegion(key as RegionKey)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    activeRegion === key 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background hover:bg-accent border-border'
                  }`}
                >
                  {data.label}
                </button>
              ))}
            </div>

            {/* Active Region Content */}
            <div className="space-y-4">
              {complianceData[activeRegion].sections.map((section) => (
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
                              <ul className="list-disc list-inside space-y-1">
                                {item.points.map((point, pointIndex) => (
                                  <li key={pointIndex} className="text-sm text-muted-foreground">
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}