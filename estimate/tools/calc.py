#!/usr/bin/env python3
import json
import math
import sys
from pathlib import Path
from typing import Dict, List, Tuple


try:
    import argparse
except Exception as e:
    print("Failed to import argparse", file=sys.stderr)
    raise


def load_estimate(path: Path) -> dict:
    with path.open() as f:
        return json.load(f)


def validate_estimate(est: dict, schema_path: Path) -> None:
    try:
        from jsonschema import Draft202012Validator
    except ImportError:
        print("jsonschema not installed. Install with: pip install -r /workspace/estimate/requirements.txt", file=sys.stderr)
        sys.exit(2)

    with schema_path.open() as f:
        schema = json.load(f)

    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(est), key=lambda e: e.path)
    if errors:
        for err in errors:
            loc = "/".join([str(p) for p in err.path])
            print(f"Schema error at '{loc}': {err.message}", file=sys.stderr)
        sys.exit(2)


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


def compute_components(costs: dict) -> Dict[str, float]:
    labor = compute_labor(costs)
    materials = compute_materials(costs)
    equipment = compute_equipment(costs)
    subcontractors = compute_subs(costs)
    permits = compute_permits(costs)
    return {
        "Labor": labor,
        "Materials": materials,
        "Equipment": equipment,
        "Subcontractors": subcontractors,
        "Permits": permits,
    }


def compute_direct(costs: dict) -> float:
    comps = compute_components(costs)
    return sum(comps.values())


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
        "withInsuranceBond": with_insurance_bond,
        "withEscalation": with_escalation,
        "withContingency": with_contingency,
        "withOverhead": with_overhead,
        "withProfit": with_profit,
        "totalWithTax": with_tax,
    }


def to_currency(amount: float) -> float:
    return round(float(amount), 2)


def rows_for_export(components: Dict[str, float], summary: Dict[str, float], direct_cost: float) -> List[Tuple[str, float]]:
    rows: List[Tuple[str, float]] = []
    for k in ["Labor", "Materials", "Equipment", "Subcontractors", "Permits"]:
        rows.append((k, to_currency(components.get(k, 0.0))))
    rows.append(("DirectCost", to_currency(direct_cost)))
    rows.append(("WithInsuranceBond", to_currency(summary["withInsuranceBond"])))
    rows.append(("WithEscalation", to_currency(summary["withEscalation"])))
    rows.append(("WithContingency", to_currency(summary["withContingency"])))
    rows.append(("WithOverhead", to_currency(summary["withOverhead"])))
    rows.append(("WithProfit", to_currency(summary["withProfit"])))
    rows.append(("TotalWithTax", to_currency(summary["totalWithTax"])))
    return rows


def write_csv(path: Path, rows: List[Tuple[str, float]]) -> None:
    import csv
    with path.open("w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Category", "Amount"])
        for name, amt in rows:
            writer.writerow([name, amt])


def write_xlsx(path: Path, rows: List[Tuple[str, float]], meta: dict, duration_months: float) -> None:
    try:
        from openpyxl import Workbook
    except ImportError:
        print("openpyxl not installed. Install with: pip install -r /workspace/estimate/requirements.txt", file=sys.stderr)
        sys.exit(2)
    wb = Workbook()
    ws = wb.active
    ws.title = "Breakdown"
    ws.append(["Category", "Amount"])
    for name, amt in rows:
        ws.append([name, amt])

    ws2 = wb.create_sheet("Meta")
    ws2.append(["Field", "Value"])
    ws2.append(["id", meta.get("id", "")])
    ws2.append(["name", meta.get("name", "")])
    ws2.append(["currencyCode", meta.get("currencyCode", "")])
    ws2.append(["durationMonths", duration_months])

    wb.save(path)


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Estimate calculator with validation and export")
    p.add_argument("estimate", help="Path to estimate JSON file")
    p.add_argument("--schema", default="/workspace/estimate/schema/estimate.schema.json", help="Path to JSON Schema")
    p.add_argument("--no-validate", action="store_true", help="Disable schema validation")
    p.add_argument("--out-csv", help="Write breakdown CSV to this path")
    p.add_argument("--out-xlsx", help="Write breakdown XLSX to this path")
    return p


def main():
    parser = build_arg_parser()
    args = parser.parse_args()

    path = Path(args.estimate)
    est = load_estimate(path)

    if not args.no_validate:
        validate_estimate(est, Path(args.schema))

    duration_months = est.get("scope", {}).get("schedule", {}).get("durationMonths", 0)

    components = compute_components(est["costs"])
    direct = sum(components.values())
    softs = apply_soft_costs(est["costs"], direct, duration_months)

    output = {
        "meta": est.get("meta", {}),
        "scope": est.get("scope", {}),
        "breakdown": {
            "Labor": to_currency(components["Labor"]),
            "Materials": to_currency(components["Materials"]),
            "Equipment": to_currency(components["Equipment"]),
            "Subcontractors": to_currency(components["Subcontractors"]),
            "Permits": to_currency(components["Permits"]),
            "directCost": to_currency(direct),
            "withInsuranceBond": to_currency(softs["withInsuranceBond"]),
            "withEscalation": to_currency(softs["withEscalation"]),
            "withContingency": to_currency(softs["withContingency"]),
            "withOverhead": to_currency(softs["withOverhead"]),
            "withProfit": to_currency(softs["withProfit"]),
            "totalWithTax": to_currency(softs["totalWithTax"]),
        },
    }

    print(json.dumps(output, indent=2))

    rows = rows_for_export(components, softs, direct)
    if args.out_csv:
        write_csv(Path(args.out_csv), rows)
    if args.out_xlsx:
        write_xlsx(Path(args.out_xlsx), rows, output["meta"], duration_months)


if __name__ == "__main__":
    main()