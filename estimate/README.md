## Building Estimate Toolkit

Contents:
- `schema/estimate.schema.json` — JSON Schema for estimate data
- `samples/sample.estimate.json` — Example estimate
- `templates/checklist.csv` — Estimator checklist
- `tools/calc.py` — Calculator that outputs totals from an estimate JSON

### Install (optional for exports/validation)
```bash
python3 -m pip install -r /workspace/estimate/requirements.txt
```

### Quick start
1. Review and complete `templates/checklist.csv` for your estimate.
2. Copy `samples/sample.estimate.json` and edit values to your project.
3. Run the calculator (with validation by default):

```bash
python3 /workspace/estimate/tools/calc.py /workspace/estimate/samples/sample.estimate.json
```

- Disable validation: add `--no-validate`
- Use a custom schema: `--schema /path/to/schema.json`

### Export
- CSV breakdown:
```bash
python3 /workspace/estimate/tools/calc.py /workspace/estimate/samples/sample.estimate.json \
  --out-csv /workspace/estimate/out/breakdown.csv
```
- Excel breakdown:
```bash
python3 /workspace/estimate/tools/calc.py /workspace/estimate/samples/sample.estimate.json \
  --out-xlsx /workspace/estimate/out/breakdown.xlsx
```
- WBS detail CSV (per item):
```bash
python3 /workspace/estimate/tools/calc.py /workspace/estimate/samples/sample.estimate.json \
  --out-wbs-csv /workspace/estimate/out/wbs_detail.csv
```
- PDF summary:
```bash
python3 /workspace/estimate/tools/calc.py /workspace/estimate/samples/sample.estimate.json \
  --out-pdf /workspace/estimate/out/summary.pdf
```
- Combine any of the above flags in one run.

### Allowances & Alternates
- In `scope.allowances[]` and `scope.alternates[]`, set `includeInTotal: true` to roll those amounts into totals. If `false` or omitted, they are reported separately but excluded from totals.

### Calculation order
- Labor, Materials, Equipment, Subcontractors, Permits, Allowances, Alternates = Direct Cost
- Apply Insurance + Bond → Escalation (linear per duration) → Contingency → Overhead → Profit → Sales Tax

### Key variables
- baseLaborHours, productivityFactor, laborRate, laborBurdenPct, overtimeMultiplier
- materials: quantity, unitCost, wasteFactor, freightCost, dutiesTaxesPct, wbsCode (optional)
- equipment: hours, rate, fuelPct, mobilizationLumpSum, wbsCode (optional)
- subs: quote totals, wbsCode (optional)
- permits/testing/disposal fees
- risk: contingencyPct, insurancePct, bondPct
- overheadAndProfit: overheadPct, profitPct
- taxes: salesTaxPct
- escalation: escalationPctPerYear; schedule.durationMonths

### Recommendations
- Document assumptions and sources for each line.
- Benchmark unit costs/productivity; run sensitivity on top 3 drivers.
- Keep allowances/alternates separate; note currency and exchange rate.
- Align contingency with design maturity; avoid double-counting.