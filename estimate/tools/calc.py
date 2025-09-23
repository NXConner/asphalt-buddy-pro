#!/usr/bin/env python3
import json
import math
import sys
from pathlib import Path


def load_estimate(path: Path) -> dict:
    with path.open() as f:
        return json.load(f)


def compute_labor(costs: dict) -> float:
    base_hours = costs["labor"]["baseLaborHours"]
    productivity = costs["labor"]["productivityFactor"]
    rate = costs["labor"]["laborRate"]
    burden = costs["labor"].get("laborBurdenPct", 0)
    ot_mult = costs["labor"].get("overtimeMultiplier", 1.0)
    adjusted_hours = base_hours / max(productivity, 1e-9)
    return adjusted_hours * rate * ot_mult * (1 + burden)


def compute_materials(costs: dict) -> float:
    items = costs["materials"]["items"]
    subtotal = 0.0
    for item in items:
        qty = item.get("quantity", 0)
        waste = item.get("wasteFactor", 0)
        unit_cost = item.get("unitCost", 0)
        subtotal += qty * (1 + waste) * unit_cost
    subtotal += costs["materials"].get("freightCost", 0)
    duties_pct = costs["materials"].get("dutiesTaxesPct", 0)
    subtotal *= (1 + duties_pct)
    return subtotal


def compute_equipment(costs: dict) -> float:
    items = costs["equipment"]["items"]
    subtotal = 0.0
    for item in items:
        subtotal += item.get("hours", 0) * item.get("rate", 0)
    fuel_pct = costs["equipment"].get("fuelPct", 0)
    subtotal *= (1 + fuel_pct)
    subtotal += costs["equipment"].get("mobilizationLumpSum", 0)
    return subtotal


def compute_subs(costs: dict) -> float:
    return sum(s.get("quote", 0) for s in costs.get("subcontractors", []))


def compute_permits(costs: dict) -> float:
    p = costs.get("permitsAndFees", {})
    return p.get("permitFees", 0) + p.get("testingInspectionCosts", 0) + p.get("disposalFees", 0)


def compute_direct(costs: dict) -> float:
    return compute_labor(costs) + compute_materials(costs) + compute_equipment(costs) + compute_subs(costs) + compute_permits(costs)


def apply_soft_costs(costs: dict, direct_cost: float, duration_months: float) -> dict:
    insurance_pct = costs["risk"].get("insurancePct", 0)
    bond_pct = costs["risk"].get("bondPct", 0)
    contingency_pct = costs["risk"].get("contingencyPct", 0)
    escalation_annual = costs["escalation"].get("escalationPctPerYear", 0)
    overhead_pct = costs["overheadAndProfit"].get("overheadPct", 0)
    profit_pct = costs["overheadAndProfit"].get("profitPct", 0)
    tax_pct = costs["taxes"].get("salesTaxPct", 0)

    with_insurance_bond = direct_cost * (1 + insurance_pct + bond_pct)

    # linear escalation for duration
    months = max(duration_months, 0)
    escalation_factor = 1 + (escalation_annual * (months / 12.0))
    with_escalation = with_insurance_bond * escalation_factor

    with_contingency = with_escalation * (1 + contingency_pct)
    with_overhead = with_contingency * (1 + overhead_pct)
    with_profit = with_overhead * (1 + profit_pct)
    with_tax = with_profit * (1 + tax_pct)

    return {
        "directCost": round(direct_cost, 2),
        "withInsuranceBond": round(with_insurance_bond, 2),
        "withEscalation": round(with_escalation, 2),
        "withContingency": round(with_contingency, 2),
        "withOverhead": round(with_overhead, 2),
        "withProfit": round(with_profit, 2),
        "totalWithTax": round(with_tax, 2),
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: calc.py /path/to/estimate.json")
        sys.exit(1)

    path = Path(sys.argv[1])
    est = load_estimate(path)

    duration_months = est.get("scope", {}).get("schedule", {}).get("durationMonths", 0)

    direct = compute_direct(est["costs"])
    summary = apply_soft_costs(est["costs"], direct, duration_months)

    print(json.dumps({
        "meta": est.get("meta", {}),
        "scope": est.get("scope", {}),
        "breakdown": summary
    }, indent=2))


if __name__ == "__main__":
    main()