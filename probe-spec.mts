import { parseWorkbook } from './src/index.ts';
import { generateApiServer } from './src/generators/react/api-server.ts';
import { writeFileSync } from 'node:fs';

const wb = await parseWorkbook('examples/Forecast GAAP revenue with custom weighting.twbx');
const { specs } = generateApiServer(wb, [], 'forecast');
const lines: string[] = [];
for (const [ws, spec] of Object.entries(specs)) {
  lines.push('### worksheet: ' + ws);
  if (spec.pivotOn) {
    lines.push('  pivot measureExpr: ' + spec.pivotOn.measureExpr);
  }
  for (const m of spec.measures) lines.push('  measure[' + m.alias + ']: ' + m.expr);
  lines.push('');
}
lines.push('TOTAL WORKSHEETS WITH SPECS: ' + Object.keys(specs).length);
writeFileSync('probe-spec-out.txt', lines.join('\n'), 'utf8');
