import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

type TabKey =
  | "estimator"
  | "documents"
  | "compliance"
  | "best-practices";

interface ChecklistPoint {
  id: string;
  label: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  points: ChecklistPoint[];
  suggestTab?: TabKey;
}

const SECTIONS: ChecklistSection[] = [
  {
    id: "scope",
    title: "Scope & Assumptions",
    points: [
      { id: "scope-deliverables", label: "Are deliverables and exclusions defined?" },
      { id: "scope-site", label: "Are site conditions and utilities confirmed?" },
    ],
    suggestTab: "documents",
  },
  {
    id: "quantities",
    title: "Quantities & Takeoff",
    points: [
      { id: "quantities-measurements", label: "Have quantities been verified and waste factors applied?" },
    ],
    suggestTab: "estimator",
  },
  {
    id: "labor",
    title: "Labor",
    points: [
      { id: "labor-crew-rates", label: "Are crew mix, wage rates, and burden confirmed?" },
      { id: "labor-productivity", label: "Is productivity factor justified and documented?" },
    ],
    suggestTab: "estimator",
  },
  {
    id: "materials",
    title: "Materials",
    points: [
      { id: "materials-pricing", label: "Are unit prices current and sources logged?" },
      { id: "materials-logistics", label: "Are freight, taxes/duties, and lead times included?" },
    ],
    suggestTab: "estimator",
  },
  {
    id: "equipment",
    title: "Equipment & Logistics",
    points: [
      { id: "equipment-rentals", label: "Are rental rates, fuel, and small tools accounted for?" },
      { id: "equipment-hoisting", label: "Are hoisting, storage, and security included?" },
    ],
    suggestTab: "estimator",
  },
  {
    id: "subs",
    title: "Subs & Vendors",
    points: [
      { id: "subs-scope", label: "Are quotes apples-to-apples and scope gaps resolved?" },
      { id: "subs-commercial", label: "Are validity, warranty, bonding, insurance verified?" },
    ],
    suggestTab: "documents",
  },
  {
    id: "permits",
    title: "Permits & Compliance",
    points: [
      { id: "permits-authorities", label: "Are permits, inspections, testing, disposal fees included?" },
    ],
    suggestTab: "compliance",
  },
  {
    id: "schedule",
    title: "Schedule & Escalation",
    points: [
      { id: "schedule-calendar", label: "Is schedule realistic and escalation applied for duration?" },
    ],
    suggestTab: "estimator",
  },
  {
    id: "risk",
    title: "Risk & Contingency",
    points: [
      { id: "risk-contingency", label: "Is contingency aligned to design maturity and risk?" },
    ],
    suggestTab: "best-practices",
  },
  {
    id: "ohp",
    title: "Overhead & Profit",
    points: [
      { id: "ohp-calc", label: "Are general conditions, OH, and profit applied correctly?" },
    ],
    suggestTab: "estimator",
  },
  {
    id: "commercial",
    title: "Commercial Terms",
    points: [
      { id: "commercial-payments", label: "Are payment terms, retention, bonds acceptable?" },
    ],
    suggestTab: "documents",
  },
  {
    id: "quality",
    title: "Deliverables & Quality",
    points: [
      { id: "quality-controls", label: "Is estimate basis, WBS, versioning, and peer review complete?" },
    ],
    suggestTab: "best-practices",
  },
];

export const ChecklistTab = () => {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("estimatorChecklist:v1");
      if (raw) {
        const parsed: string[] = JSON.parse(raw);
        setCheckedIds(new Set(parsed));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("estimatorChecklist:v1", JSON.stringify(Array.from(checkedIds)));
    } catch {}
  }, [checkedIds]);

  const totalItems = useMemo(() => SECTIONS.reduce((sum, s) => sum + s.points.length, 0), []);
  const completion = totalItems > 0 ? Math.round((checkedIds.size / totalItems) * 100) : 0;

  const toggle = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const navigateToTab = (tab: TabKey) => {
    window.dispatchEvent(new CustomEvent("navigate-tab", { detail: { tab } }));
  };

  const resetAll = () => setCheckedIds(new Set());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Estimator Checklist</h2>
          <p className="text-muted-foreground">Work through steps and jump to relevant tools</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline">{completion}% Complete</Badge>
          <div className="w-40">
            <Progress value={completion} />
          </div>
          <Button variant="outline" size="sm" onClick={resetAll}>Reset</Button>
        </div>
      </div>

      <div className="grid gap-4">
        {SECTIONS.map(section => (
          <Card key={section.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{section.title}</CardTitle>
              {section.suggestTab && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigateToTab(section.suggestTab!)}
                >
                  Go to {section.suggestTab === "estimator" ? "Estimator" : section.suggestTab === "documents" ? "Documents" : section.suggestTab === "compliance" ? "Compliance" : "Best Practices"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {section.points.map(point => (
                  <div key={point.id} className="flex items-start gap-3">
                    <Checkbox
                      id={point.id}
                      checked={checkedIds.has(point.id)}
                      onCheckedChange={() => toggle(point.id)}
                    />
                    <label htmlFor={point.id} className="text-sm leading-6 flex-1">
                      {point.label}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ChecklistTab;

