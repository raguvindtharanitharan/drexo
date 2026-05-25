/**
 * Integration test: full pipeline on the reference fixture.
 *
 * Runs `parseWorkbook` + `generateMarkdownModel` against the real
 * `.twbx` in `examples/` and pins the output via snapshot. Any
 * regression in the parser or generator will surface as a snapshot
 * diff.
 *
 * The fixture is gitignored; if it's missing the test fails with a
 * clear message so you know to copy it locally.
 */

import { existsSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

import { parseWorkbook } from '../../src/parsers/parse-workbook.js';
import { generateMarkdownModel } from '../../src/generators/markdown-model.js';

const FIXTURE = './examples/finance-simple-gaap-revenue-forecast.twbx';

describe('integration: analyze finance-simple-gaap-revenue-forecast', () => {
  test('fixture is available locally', () => {
    expect(existsSync(FIXTURE), `Fixture missing at ${FIXTURE} — copy your .twbx into ./examples/`).toBe(true);
  });

  test('produces stable markdown (snapshot)', async () => {
    const workbook = await parseWorkbook(FIXTURE);
    const markdown = generateMarkdownModel(workbook);
    expect(stripVolatile(markdown)).toMatchSnapshot();
  });

  test('parses the expected high-level structure', async () => {
    const workbook = await parseWorkbook(FIXTURE);

    expect(workbook.metadata.name).toBe('finance-simple-gaap-revenue-forecast');
    expect(workbook.metadata.tableauVersion).toBe('18.1');

    expect(workbook.dataSources).toHaveLength(4);
    expect(workbook.dataSources.find((d) => d.name === 'Parameters')).toBeDefined();

    expect(workbook.worksheets).toHaveLength(8);
    const names = workbook.worksheets.map((w) => w.name);
    expect(names).toEqual([
      'Bookings-Consol',
      'GAAP Rev-Consol',
      'Lic-Consol',
      'Main-Consol',
      'Proj Rev-Consol',
      'Sheet 8',
      'Tot Rev-Consol',
      'YTD Rev-Consol',
    ]);

    expect(workbook.dashboards).toHaveLength(1);
    expect(workbook.parameters.length).toBeGreaterThan(0);
  });

  test('mark classifier returns enum values, not concatenated garbage', async () => {
    const workbook = await parseWorkbook(FIXTURE);

    const validMarks = /^(bar|line|area|pie|circle|square|shape|text|map|gantt|heatmap|automatic|unsupported)$/;
    for (const ws of workbook.worksheets) {
      for (const mark of ws.markTypes) {
        expect(mark, `worksheet "${ws.name}" has invalid mark "${mark}"`).toMatch(validMarks);
      }
    }

    const licConsol = workbook.worksheets.find((w) => w.name === 'Lic-Consol');
    expect(licConsol?.markTypes).toEqual(expect.arrayContaining(['bar', 'circle']));
  });

  test('captures calculated fields with their formulas', async () => {
    const workbook = await parseWorkbook(FIXTURE);
    expect(workbook.calculations.length).toBeGreaterThan(0);
    for (const calc of workbook.calculations) {
      expect(calc.formula).toBeTruthy();
      expect(calc.name).toBeTruthy();
    }
  });
});

/**
 * Replace timestamps with a stable placeholder so the snapshot
 * doesn't churn every run.
 */
function stripVolatile(markdown: string): string {
  return markdown
    .replace(/exported_at: \S+/g, 'exported_at: <STRIPPED>')
    .replace(/on \d{4}-\d{2}-\d{2}T[\d:.]+Z\./g, 'on <STRIPPED>.');
}
