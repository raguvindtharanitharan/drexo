import type { Calculation } from '../model.js';
import { toArray } from './_helpers.js';

/**
 * Extract calculated fields from all data sources.
 *
 * A calculated field is a `<column>` with a `<calculation>` child
 * that has an `@_formula` attribute. We capture the formula string
 * verbatim. Dependency analysis (`dependsOn[]`) requires parsing
 * Tableau's formula syntax — deferred to v0.2+.
 */
export function extractCalculations(workbook: any): Calculation[] {
  const datasourcesRaw = workbook?.datasources?.datasource;
  if (!datasourcesRaw) return [];

  const result: Calculation[] = [];

  for (const ds of toArray(datasourcesRaw)) {
    const columnsRaw = ds.column;
    if (!columnsRaw) continue;

    for (const col of toArray(columnsRaw)) {
      const formula: string | undefined = col?.calculation?.['@_formula'];
      if (!formula) continue;

      result.push({
        name: col['@_caption'] ?? col['@_name'] ?? '',
        formula,
        dependsOn: [],     // v0.2+
        complexity: undefined,
        notes: undefined,
      });
    }
  }

  return result;
}
