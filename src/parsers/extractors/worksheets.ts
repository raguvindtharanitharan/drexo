import type { Worksheet } from '../model.js';
import { toArray, extractFormattedTitle } from './_helpers.js';
import { classifyMarks } from './marks.js';

/**
 * Extract worksheet-level metadata (name, title, mark types).
 *
 * Detailed visual configuration (shelves, encodings) lives in the
 * VisualEncoding extractor, not here. This is purely the "what
 * worksheets exist" view.
 */
export function extractWorksheets(workbook: any): Worksheet[] {
  const worksheetsRaw = workbook?.worksheets?.worksheet;
  if (!worksheetsRaw) return [];

  return toArray(worksheetsRaw).map((ws: any) => mapWorksheet(ws));
}

function mapWorksheet(ws: any): Worksheet {
  const name: string = ws['@_name'] ?? 'Unnamed Worksheet';
  const title = extractFormattedTitle(ws) ?? name;
  const markTypes = classifyMarks(ws);

  return {
    name,
    title,
    sheetType: 'worksheet',
    markTypes,
    description: undefined,
  };
}
