import { parseWorkbook } from './src/index.ts';
import { generateApiServer } from './src/generators/react/api-server.ts';

const wb = await parseWorkbook('examples/Forecast GAAP revenue with custom weighting.twbx');

// Show the measure names that the migration would try to translate
const encs = (wb as any).encodings ?? wb.worksheets?.map((w: any) => ({
  worksheet: w.name,
  selectedMeasures: w.selectedMeasures ?? [],
})) ?? [];

const lines: string[] = [];
lines.push('=== Worksheets and their selectedMeasures ===');
for (const w of wb.worksheets ?? []) {
  const sel = (w as any).selectedMeasures ?? [];
  lines.push(`[${w.name}] selectedMeasures=${JSON.stringify(sel)}`);
}

// Now generate the specs with an empty parquet list and dump each measure expr
const { specs } = generateApiServer(wb, [], 'forecast');
lines.push('');
lines.push('=== Generated query specs ===');
for (const [ws, spec] of Object.entries(specs)) {
  lines.push(`--- ${ws} ---`);
  lines.push(JSON.stringify(spec, null, 2).slice(0, 900));
}

const { writeFileSync } = await import('node:fs');
writeFileSync('probe-full-out.txt', lines.join('\n'), 'utf8');
console.log('Wrote probe-full-out.txt');
