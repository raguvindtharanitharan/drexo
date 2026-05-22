import { describe, expect, test } from 'vitest';
import { classifyMarks, resolveEffectiveMarkType } from './marks.js';
import type { FieldRef } from '../model.js';

describe('classifyMarks', () => {
  test('classifies a single Bar pane', () => {
    expect(classifyMarks(paneClasses(['Bar']))).toEqual(['bar']);
  });

  test('classifies multi-pane dual-axis (Line + Bar)', () => {
    expect(classifyMarks(paneClasses(['Line', 'Bar']))).toEqual(['line', 'bar']);
  });

  test('returns automatic when worksheet has no panes', () => {
    expect(classifyMarks({})).toEqual(['automatic']);
  });

  test('returns automatic for an explicit Automatic class', () => {
    expect(classifyMarks(paneClasses(['Automatic']))).toEqual(['automatic']);
  });

  test('is case-insensitive (BAR → bar)', () => {
    expect(classifyMarks(paneClasses(['BAR']))).toEqual(['bar']);
  });

  test('deduplicates same mark type across panes', () => {
    expect(classifyMarks(paneClasses(['Bar', 'Bar']))).toEqual(['bar']);
  });

  test('normalizes Gantt-Bar and GanttBar to gantt (its own type, not bar)', () => {
    expect(classifyMarks(paneClasses(['Gantt-Bar']))).toEqual(['gantt']);
    expect(classifyMarks(paneClasses(['GanttBar']))).toEqual(['gantt']);
  });

  test('normalizes Polygon / Multipolygon / FilledMap to map', () => {
    expect(classifyMarks(paneClasses(['Polygon']))).toEqual(['map']);
    expect(classifyMarks(paneClasses(['Multipolygon']))).toEqual(['map']);
    expect(classifyMarks(paneClasses(['FilledMap']))).toEqual(['map']);
  });

  test('normalizes Heatmap to heatmap', () => {
    expect(classifyMarks(paneClasses(['Heatmap']))).toEqual(['heatmap']);
  });

  test('unknown mark classes become unsupported', () => {
    expect(classifyMarks(paneClasses(['UnknownThing']))).toEqual(['unsupported']);
  });

  test('regression: does NOT collect @_class from non-mark elements', () => {
    // The old parser walked every node looking for @_class and joined
    // the results, producing strings like "tableau + categorical + Bar".
    // The new classifier looks ONLY inside <pane><mark class="...">.
    const ws = {
      '@_class': 'tableau',
      'layout-options': { '@_class': 'categorical-bin' },
      table: {
        '@_class': 'someTableClass',
        panes: {
          pane: { mark: { '@_class': 'Bar' } },
        },
      },
    };
    expect(classifyMarks(ws)).toEqual(['bar']);
  });
});

describe('resolveEffectiveMarkType', () => {
  test('non-automatic mark types pass through unchanged', () => {
    expect(resolveEffectiveMarkType('bar', [], [])).toBe('bar');
    expect(resolveEffectiveMarkType('line', [], [])).toBe('line');
    expect(resolveEffectiveMarkType('pie', [], [])).toBe('pie');
  });

  test('empty shelves stay automatic', () => {
    expect(resolveEffectiveMarkType('automatic', [], [])).toBe('automatic');
  });

  test('only dimensions, no measures → stays automatic', () => {
    const cols = [dim('Region'), dim('Category')];
    expect(resolveEffectiveMarkType('automatic', [], cols)).toBe('automatic');
  });

  test('date dimension on columns + measure on rows → line', () => {
    const cols = [dim('Order Date', 'yr:Order Date:ok')];
    const rows = [measure('Sales')];
    expect(resolveEffectiveMarkType('automatic', rows, cols)).toBe('line');
  });

  test('date detected via caption keyword → line', () => {
    const cols = [dim('Year of Order Date')];
    const rows = [measure('Revenue')];
    expect(resolveEffectiveMarkType('automatic', rows, cols)).toBe('line');
  });

  test('date detected via Tableau colon-grammar prefix → line', () => {
    const cols = [{ field: 'mn:Order Date:ok', role: 'dimension' as const }];
    const rows = [measure('Profit')];
    expect(resolveEffectiveMarkType('automatic', rows, cols)).toBe('line');
  });

  test('categorical dimension + measure → bar', () => {
    const cols = [dim('Category')];
    const rows = [measure('Sales')];
    expect(resolveEffectiveMarkType('automatic', rows, cols)).toBe('bar');
  });

  test('measure on rows only (no columns) → bar', () => {
    const rows = [measure('Sales')];
    expect(resolveEffectiveMarkType('automatic', rows, [])).toBe('bar');
  });

  test('measures on both axes → circle (scatter)', () => {
    const cols = [measure('Profit')];
    const rows = [measure('Sales')];
    expect(resolveEffectiveMarkType('automatic', rows, cols)).toBe('circle');
  });

  test('aggregation field without explicit role counts as measure → bar', () => {
    const cols = [dim('Sub-Category')];
    const rows = [{ field: 'Sales', aggregation: 'SUM' }];
    expect(resolveEffectiveMarkType('automatic', rows as FieldRef[], cols)).toBe('bar');
  });
});

function dim(caption: string, field?: string): FieldRef {
  return { field: field ?? caption, caption, role: 'dimension' };
}

function measure(caption: string, field?: string): FieldRef {
  return { field: field ?? caption, caption, role: 'measure' };
}

function paneClasses(classes: string[]): unknown {
  const pane =
    classes.length === 1
      ? { mark: { '@_class': classes[0] } }
      : classes.map((c) => ({ mark: { '@_class': c } }));
  return { table: { panes: { pane } } };
}
