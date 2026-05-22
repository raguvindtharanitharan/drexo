import type { Filter, FieldRole } from '../model.js';
import { toArray } from './_helpers.js';

/**
 * Extract filters from each worksheet.
 *
 * v0.1 reports filters at worksheet scope only; v0.2+ will detect
 * dashboard-scoped filters via Tableau's `<filter-classes>` and
 * dashboard `<action>` graph.
 */
export function extractFilters(workbook: any): Filter[] {
  const worksheetsRaw = workbook?.worksheets?.worksheet;
  if (!worksheetsRaw) return [];

  const collected: Filter[] = [];

  for (const ws of toArray(worksheetsRaw)) {
    const worksheetName: string = ws['@_name'] ?? 'Unnamed';
    for (const f of collectFilters(ws)) {
      collected.push({
        ...f,
        appliedTo: [worksheetName],
        scope: 'worksheet',
      });
    }
  }

  return mergeAcrossWorksheets(collected);
}

function collectFilters(ws: any): Omit<Filter, 'appliedTo' | 'scope'>[] {
  const result: Omit<Filter, 'appliedTo' | 'scope'>[] = [];

  function walk(node: any): void {
    if (!node || typeof node !== 'object') return;
    if (node.filter) {
      for (const f of toArray(node.filter)) {
        const item = mapFilter(f);
        if (item) result.push(item);
      }
    }
    for (const child of Object.values(node)) {
      if (child && typeof child === 'object') walk(child);
    }
  }
  walk(ws);
  return result;
}

function mapFilter(f: any): Omit<Filter, 'appliedTo' | 'scope'> | undefined {
  const fieldRaw: string | undefined = f['@_column'] ?? f['@_field'];
  if (!fieldRaw) return undefined;

  const field = fieldRaw.replace(/^\[|\]$/g, '');
  const filterClass: string | undefined = f['@_class'];
  const type: FieldRole = filterClass === 'quantitative' ? 'measure' : 'dimension';

  return {
    name: field, // v0.2+: extract human-readable name
    field,
    type,
  };
}

function mergeAcrossWorksheets(filters: Filter[]): Filter[] {
  const byKey = new Map<string, Filter>();
  for (const f of filters) {
    const key = f.field ?? f.name;
    const existing = byKey.get(key);
    if (existing) {
      existing.appliedTo = Array.from(new Set([...existing.appliedTo, ...f.appliedTo]));
    } else {
      byKey.set(key, { ...f });
    }
  }
  return Array.from(byKey.values());
}
