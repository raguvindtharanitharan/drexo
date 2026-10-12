import { parseWorkbook } from './src/index.ts';

const wb = await parseWorkbook('examples/Forecast GAAP revenue with custom weighting.twbx');
const lines: string[] = [];

lines.push('=== Parameters (first 10, with internalName) ===');
for (const p of wb.parameters.slice(0, 10)) {
  lines.push(JSON.stringify({
    name: p.name,
    internalName: (p as any).internalName,
    dataType: p.dataType,
    currentValue: p.currentValue,
  }));
}

lines.push('');
lines.push('=== The Revenue View parameter ===');
const rv = wb.parameters.find((p) => p.name === 'Revenue View');
lines.push(JSON.stringify(rv, null, 2));

lines.push('');
lines.push('=== Sample formulas referencing Parameters ===');
const all = [
  ...wb.calculations.map((c) => ({ n: c.name, f: c.formula })),
  ...wb.fields.filter((f) => f.calculation?.formula).map((f) => ({ n: f.caption || f.name, f: f.calculation!.formula })),
];
const withParams = all.filter((c) => /Parameters/i.test(c.f));
lines.push('TOTAL formulas referencing Parameters: ' + withParams.length);

// Manually run the substitution logic from api-server.ts to see what happens
function substituteParameters(formula: string, workbook: any): string {
  if (!workbook.parameters?.length) return formula;
  return formula.replace(/\[Parameters\]\.\[([^\]]+)\]/g, (match, ref: string) => {
    const param = workbook.parameters.find(
      (p: any) => p.internalName?.replace(/^\[|\]$/g, '') === ref || p.name === ref,
    );
    if (!param || param.currentValue === undefined) return match;
    return param.currentValue;
  });
}

lines.push('');
lines.push('=== Substitution test on first 5 param-referencing formulas ===');
for (const c of withParams.slice(0, 5)) {
  const cleaned = c.f
    .replace(/&#13;/g, ' ').replace(/&#10;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const substituted = substituteParameters(cleaned, wb);
  const stillHasParams = /Parameters/i.test(substituted);
  const stillHasFederated = /federated\./i.test(substituted);
  lines.push(`--- [${c.n}] ---`);
  lines.push(`BEFORE: ${cleaned.slice(0, 260)}`);
  lines.push(`AFTER:  ${substituted.slice(0, 260)}`);
  lines.push(`stillHasParameters=${stillHasParams}  stillHasFederated=${stillHasFederated}`);
}

const { writeFileSync } = await import('node:fs');
writeFileSync('probe-subst-out.txt', lines.join('\n'), 'utf8');
console.log('Wrote probe-subst-out.txt');
