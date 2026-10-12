import { loadTwbx } from './src/parsers/twbx.ts';
import { writeFileSync } from 'node:fs';

const { workbook } = loadTwbx('examples/Forecast GAAP revenue with custom weighting.twbx');
const dss = workbook.datasources.datasource;
const arr = Array.isArray(dss) ? dss : [dss];
const params = arr.find((d: any) => d['@_name'] === 'Parameters');
const cols = Array.isArray(params.column) ? params.column : [params.column];
const lines: string[] = [];
for (const c of cols) {
  lines.push(JSON.stringify({ name: c['@_name'], caption: c['@_caption'], datatype: c['@_datatype'], value: c['@_value'] }));
}
writeFileSync('probe-raw-out.txt', lines.join('\n'), 'utf8');
