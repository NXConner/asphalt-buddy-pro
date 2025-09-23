import { useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Gavel, Scale, ShieldCheck, AlertTriangle, Droplets, Ruler, Construction } from "lucide-react";

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
  rules: <Gavel className="h-4 w-4" />,
  standards: <Ruler className="h-4 w-4" />,
  policies: <BookOpen className="h-4 w-4" />,
  compliance: <Scale className="h-4 w-4" />,
};

const regionLabel: Record<RegionKey, string> = {
  general: 'General',
  va: 'Virginia',
  nc: 'North Carolina',
};

const generalSections: Section[] = [
  {
    id: 'rules-regulations',
    label: 'Rules & Regulations',
    icon: sectionIcons.rules,
    items: [
      {
        title: 'Line Striping (Parking Lots)',
        points: [
          'Follow MUTCD principles for colors/symbols; use white for stalls, blue for accessible markings, yellow for hazard/no-parking areas where locally required',
          'ADA 2010 Standards: provide required accessible spaces, access aisles, and signage (R7-8; van accessible)',
          'Fire lanes and hydrant clearances per locally adopted Fire Code (often IFC): markings and stenciling as required',
          'Local zoning/ordinances may set stall width/length, aisle width, and counts; verify with AHJ',
        ],
        notes: [
          'Typical stall width 8.5–9 ft; accessible car 8 ft + 5 ft aisle; accessible van 11 ft + 5 ft aisle or 8 ft + 8 ft aisle',
          'Signage bottom height typically 60–72 in above grade; confirm local requirement',
        ],
      },
      {
        title: 'Crack Sealing / Routing',
        points: [
          'Comply with manufacturer SDS and application specs; heated materials handling per OSHA',
          'Control debris and silica dust if routing; follow OSHA Respirable Crystalline Silica standard',
          'Prevent debris and melt from entering storm drains; protect inlets',
        ],
      },
      {
        title: 'Sealcoating',
        points: [
          'Use products permitted by local VOC regulations; follow manufacturer coverage and cure times',
          'Set up traffic control per MUTCD Part 6 for short-duration operations; maintain emergency access',
          'Protect drainage and adjacent surfaces; prevent tracking onto public ways',
        ],
        notes: [
          'Some jurisdictions restrict coal-tar based sealers; verify local rules and contracts',
        ],
      },
      {
        title: 'Paving / Patching',
        points: [
          'Follow compaction, thickness, and temperature specs per manufacturer/engineer',
          'Hot mix delivery tickets, tonnage, and density testing may be required on public projects',
          'Excavation utility locates (811) prior to sawcutting or milling',
        ],
      },
    ],
  },
  {
    id: 'standards-best-practices',
    label: 'Standards & Best Practices',
    icon: sectionIcons.standards,
    items: [
      {
        title: 'Markings Geometry & Materials',
        points: [
          'Use durable pavement marking paint compatible with substrate; ensure surface is clean and dry',
          'Maintain consistent line width (typically 4 in or 6 in); use templates for arrows/text',
          'Apply glass beads where specified for retroreflectivity (public work or high-visibility areas)',
        ],
      },
      {
        title: 'Weather & Curing Windows',
        points: [
          'Air ≥ 50°F and rising; surface ≥ 60°F; RH < 85%; no rain in 24 hours for sealers unless product allows otherwise',
          'Observe manufacturer cure times before opening to traffic; use barricades and notices',
        ],
      },
      {
        title: 'Work Zone Safety',
        points: [
          'Short-duration traffic control compliant with MUTCD: advance warning signs, cones, tapers',
          'Maintain fire and ADA access during closures; coordinate with property management',
        ],
      },
    ],
  },
  {
    id: 'policies-procedures',
    label: 'Policies & Procedures',
    icon: sectionIcons.policies,
    items: [
      {
        title: 'Pre-Job Planning (All Property Types)',
        points: [
          'Confirm scope, drawings, and local requirements; obtain written approvals/permits if required',
          'Notify tenants/customers with schedule, closures, towing plan, and contact info',
          'Mark utilities, sprinklers, and sensitive areas; protect buildings and landscaping',
        ],
      },
      {
        title: 'Execution & Quality Control',
        points: [
          'Document substrate condition (photos) before and after; keep batch mix logs',
          'Measure and layout with chalk/string or laser; verify ADA counts and locations',
          'Have spill kits on site; stop work for weather that violates product specs',
        ],
      },
      {
        title: 'Closeout',
        points: [
          'Post-cure inspection; punchlist and touch-ups; provide as-built striping plan if changed',
          'Deliver SDS, product data, and warranty; provide maintenance guidance to owner',
        ],
      },
    ],
  },
  {
    id: 'compliance-laws',
    label: 'Compliance & Laws',
    icon: sectionIcons.compliance,
    items: [
      {
        title: 'Environmental & Stormwater',
        points: [
          'Prevent materials/wash water from entering storm drains; plug/protect inlets; use absorbents/berms',
          'Dispose of waste per SDS and local solid waste rules; never discharge to surface waters',
          'Construction stormwater permits typically apply at ≥ 1 acre disturbance; most maintenance is below but still must control pollutants',
        ],
      },
      {
        title: 'Labor, Safety, Insurance',
        points: [
          'OSHA: PPE, Hazard Communication, Silica, Hot Work; training and documentation required',
          'Maintain workers’ comp and liability insurance meeting contract requirements',
        ],
      },
      {
        title: 'Public vs. Private Property',
        points: [
          'Public projects often require DOT specs, certified materials, and traffic control submittals',
          'Private projects must still meet ADA and fire access requirements enforceable by AHJ',
        ],
      },
    ],
  },
];

const virginiaAdds: Partial<Record<string, ChecklistItem[]>> = {
  'rules-regulations': [
    {
      title: 'State Adoption & References',
      points: [
        'VDOT Standard Specifications/Drawings govern public work; use as guidance for private lots when referenced',
        'ADA requirements apply statewide; local building officials enforce accessible parking and signage',
      ],
    },
    {
      title: 'Materials & VOC',
      points: [
        'Follow Virginia DEQ requirements for coatings/sealers VOC limits where applicable',
        'Verify local restrictions on coal‑tar based sealers in project jurisdiction',
      ],
    },
  ],
  'compliance-laws': [
    {
      title: 'Stormwater & Waste (Virginia)',
      points: [
        'VPDES stormwater requirements enforced by Virginia DEQ and localities; protect MS4 storm drains',
        'Manage wash water and slurry as solid waste per local guidance; keep SDS on site',
      ],
    },
  ],
};

const northCarolinaAdds: Partial<Record<string, ChecklistItem[]>> = {
  'rules-regulations': [
    {
      title: 'State Adoption & References',
      points: [
        'NCDOT Standard Specifications/Drawings govern public work; reference for private lots as specified',
        'ADA requirements apply statewide; enforcement via local building inspections',
      ],
    },
    {
      title: 'Materials & VOC',
      points: [
        'Comply with North Carolina DAQ VOC rules for architectural/industrial maintenance coatings where applicable',
        'Check any local prohibitions or restrictions on coal‑tar based sealers',
      ],
    },
  ],
  'compliance-laws': [
    {
      title: 'Stormwater & Waste (North Carolina)',
      points: [
        'NPDES stormwater requirements enforced by NC DEQ; protect storm drains and surface waters',
        'Handle and dispose of wash water and absorbents per SDS and local solid waste rules',
      ],
    },
  ],
};

function mergeRegionSections(base: Section[], additions?: Partial<Record<string, ChecklistItem[]>>): Section[] {
  if (!additions) return base;
  return base.map((section) => {
    const extra = additions[section.id];
    if (!extra) return section;
    return {
      ...section,
      items: [...section.items, ...extra],
    };
  });
}

export const ComplianceTab = () => {
  const [region, setRegion] = useState<RegionKey>('general');

  const sectionsByRegion: Record<RegionKey, Section[]> = {
    general: generalSections,
    va: mergeRegionSections(generalSections, virginiaAdds),
    nc: mergeRegionSections(generalSections, northCarolinaAdds),
  };

  const activeSections = sectionsByRegion[region];

  return (
    <div className="space-y-6">
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Regulations, Standards, Policies & Compliance
          </CardTitle>
          <p className="text-muted-foreground">
            Key requirements and checklists for line striping, crack sealing, sealcoating, and paving on residential, commercial, public, and private properties.
          </p>
        </CardHeader>
      </Card>

      <Tabs value={region} onValueChange={(v) => setRegion(v as RegionKey)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {(['general','va','nc'] as RegionKey[]).map((r) => (
            <TabsTrigger key={r} value={r} className="flex flex-col items-center gap-1 p-3">
              <span className="text-xs font-medium">{regionLabel[r]}</span>
              <Badge variant="secondary" className="text-xs">{r === 'general' ? 'All markets' : 'State-specific'}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={region} className="mt-6">
          <div className="space-y-4">
            {activeSections.map((section) => (
              <Card key={section.id} className="card-professional">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {section.icon}
                    {section.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {section.items.map((item, idx) => (
                      <AccordionItem key={idx} value={`${section.id}-${idx}`}>
                        <AccordionTrigger className="text-left">
                          <span className="flex items-center gap-2">
                            <TrafficCone className="h-4 w-4" />
                            {item.title}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2">
                            {item.points.map((p, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <BookOpen className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <span className="text-sm">{p}</span>
                              </li>
                            ))}
                          </ul>
                          {item.notes && item.notes.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {item.notes.map((n, j) => (
                                <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                                  <AlertTriangle className="h-3 w-3 mt-0.5 text-yellow-600" />
                                  <span>{n}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="card-professional border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Droplets className="h-5 w-5" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 text-sm space-y-2 text-muted-foreground">
            <li>Always verify local ordinances (city/county), fire marshal guidelines, and property-specific requirements before work.</li>
            <li>ADA requirements are federally enforceable and apply to most public accommodations and commercial facilities, regardless of project size.</li>
            <li>Where public roads are affected, coordinate with the DOT or local public works for traffic control approvals.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceTab;

