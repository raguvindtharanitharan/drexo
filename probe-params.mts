import { parseWorkbook } from './src/index.ts';

const wb = await parseWorkbook('examples/Forecast GAAP revenue with custom weighting.twbx');
const lines: string[] = [];
lines.push('PARAM COUNT: ' + wb.parameters.length);
for (const p of wb.parameters.slice(0, 25)) {
  lines.push('P ' + JSON.stringify({ name: p.name, dataType: p.dataType, currentValue: p.currentValue }));
}
lines.push('');
lines.push('FORMULAS referencing Parameters:');
const all = [
  ...wb.calculations.map((c) => ({ n: c.name, f: c.formula })),
  ...wb.fields.filter((f) => f.calculation?.formula).map((f) => ({ n: f.caption || f.name, f: f.calculation!.formula })),
];
let shown = 0;
for (const c of all) {
  if (/Parameters/i.test(c.f) && shown < 6) {
    lines.push('[' + c.n + '] => ' + c.f.replace(/\s+/g, ' ').slice(0, 320));
    shown++;
  }
}
const { writeFileSync } = await import('node:fs');
writeFileSync('probe-out.txt', lines.join('\n'), 'utf8');
