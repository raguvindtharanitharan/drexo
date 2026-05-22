import type { FieldRef, MarkType } from '../model.js';
import { toArray } from './_helpers.js';

/**
 * Classify a worksheet's mark types.
 *
 * Tableau structure: `worksheet > table > panes > pane > mark`.
 * The `<mark class="...">` attribute is the actual mark type.
 *
 * Critically, we do NOT walk the entire worksheet collecting every
 * `@_class` attribute — the previous parser did that and produced
 * garbage strings like `"tableau + categorical-bin + Bar + Circle"`.
 * That mixed mark classes with unrelated style classes.
 *
 * A worksheet may have multiple panes (e.g. dual-axis) with
 * different marks. We return the unique list of mark types found.
 */
export function classifyMarks(ws: any): MarkType[] {
  const panes = ws?.table?.panes?.pane;
  if (!panes) return ['automatic'];

  const marks = toArray(panes)
    .map((pane: any) => pane?.mark?.['@_class'])
    .filter((m): m is string => typeof m === 'string')
    .map(normalizeMarkClass);

  if (marks.length === 0) return ['automatic'];

  return Array.from(new Set(marks));
}

/**
 * Resolve 'automatic' to a concrete mark type by inspecting the
 * worksheet's row/column shelves.
 *
 * Tableau resolves 'automatic' at render time using shelf content:
 *   - date dimension + measure  → line
 *   - two measures (one per axis) → circle (scatter)
 *   - categorical dimension + measure → bar
 *   - no measures or empty shelves → stays automatic
 *
 * Non-automatic mark types are returned unchanged.
 */
export function resolveEffectiveMarkType(
  markType: MarkType,
  rows: FieldRef[],
  columns: FieldRef[]
): MarkType {
  if (markType !== 'automatic') return markType;

  const allRefs = [...rows, ...columns];
  if (allRefs.length === 0) return 'automatic';

  const rowMeasures = rows.filter(isMeasureRef);
  const colMeasures = columns.filter(isMeasureRef);
  const hasMeasure = rowMeasures.length > 0 || colMeasures.length > 0;

  if (!hasMeasure) return 'automatic';

  if (allRefs.some(isDateRef)) return 'line';

  // Both axes carry measures (no categorical grouping) → scatter
  if (rowMeasures.length > 0 && colMeasures.length > 0) return 'circle';

  // One axis has a dimension, the other a measure → bar
  return 'bar';
}

function isMeasureRef(ref: FieldRef): boolean {
  return ref.role === 'measure' || !!ref.aggregation;
}

function isDateRef(ref: FieldRef): boolean {
  // Tableau colon-grammar date aggregation prefixes (YEAR, QUARTER, MONTH, etc.)
  if (/^(yr|qr|mn|wk|dy|hr|mt|sc|trunc)[:-]/i.test(ref.field)) return true;
  const text = `${ref.field} ${ref.caption ?? ''}`.toLowerCase();
  return /\b(year|quarter|month|week|day|date|time)\b/.test(text);
}

function normalizeMarkClass(raw: string): MarkType {
  const lower = raw.toLowerCase();
  switch (lower) {
    case 'bar':
      return 'bar';
    case 'line':
      return 'line';
    case 'area':
      return 'area';
    case 'pie':
      return 'pie';
    case 'circle':
      return 'circle';
    case 'square':
      return 'square';
    case 'shape':
      return 'shape';
    case 'text':
      return 'text';
    case 'map':
    case 'polygon':
    case 'multipolygon':
    case 'filledmap':
      return 'map';
    case 'gantt-bar':
    case 'ganttbar':
      return 'gantt';
    case 'heatmap':
      return 'heatmap';
    case 'automatic':
      return 'automatic';
    default:
      return 'unsupported';
  }
}
