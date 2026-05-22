/**
 * Public entry point for the parser stage.
 *
 * `parseWorkbook(twbxPath)` unzips the `.twbx`, parses its `.twb`
 * XML once, and dispatches to focused extractors. The result is a
 * fully-typed `TableauWorkbook` model matching the canonical
 * schema (`docs/schema/workbook-model.md`).
 */

import type { Field, TableauWorkbook } from './model.js';
import { loadTwbx } from './twbx.js';
import { extractActions } from './extractors/actions.js';
import { extractCalculations } from './extractors/calculations.js';
import { extractDashboards } from './extractors/dashboards.js';
import { extractDataSources } from './extractors/data-sources.js';
import { extractVisualEncodings } from './extractors/encodings.js';
import { extractFilters } from './extractors/filters.js';
import { extractMetadata } from './extractors/metadata.js';
import { extractParameters } from './extractors/parameters.js';
import { extractWorksheets } from './extractors/worksheets.js';

export async function parseWorkbook(twbxPath: string): Promise<TableauWorkbook> {
  const { workbook, twbxPath: absolutePath } = loadTwbx(twbxPath);

  const dataSources = extractDataSources(workbook);

  // Top-level fields[] is the schema's flat semantic layer view.
  // It mirrors the per-datasource fields and is computed here so
  // generators don't need to flatten themselves.
  const fields: Field[] = dataSources.flatMap((ds) => ds.fields);

  return {
    metadata: extractMetadata(workbook, absolutePath),
    executiveSummary: undefined,
    dataSources,
    fields,
    worksheets: extractWorksheets(workbook),
    visualEncodings: extractVisualEncodings(workbook),
    dashboards: extractDashboards(workbook),
    filters: extractFilters(workbook),
    parameters: extractParameters(workbook),
    actions: extractActions(workbook),
    calculations: extractCalculations(workbook),
    notes: [],
  };
}
