import { describe, expect, test } from 'vitest';
import { extractVisualEncodings, parsePills } from './encodings.js';

describe('extractVisualEncodings', () => {
  test('returns [] when workbook has no worksheets', () => {
    expect(extractVisualEncodings({})).toEqual([]);
  });

  test('returns one encoding per worksheet', () => {
    const wb = {
      worksheets: {
        worksheet: [
          worksheet('Sheet 1', 'Bar'),
          worksheet('Sheet 2', 'Line'),
        ],
      },
    };
    const result = extractVisualEncodings(wb);
    expect(result).toHaveLength(2);
    expect(result[0]?.worksheet).toBe('Sheet 1');
    expect(result[0]?.markType).toBe('bar');
    expect(result[1]?.markType).toBe('line');
  });

  test('resolves field captions and roles from column metadata', () => {
    const wb = {
      worksheets: {
        worksheet: {
          '@_name': 'Sheet',
          column: {
            '@_name': 'foo',
            '@_caption': 'Foo (resolved)',
            '@_role': 'dimension',
            '@_datatype': 'string',
          },
          table: {
            panes: { pane: { mark: { '@_class': 'Bar' } } },
            rows: '[foo]',
          },
        },
      },
    };
    const result = extractVisualEncodings(wb);
    expect(result[0]?.rows[0]?.field).toBe('foo');
    expect(result[0]?.rows[0]?.caption).toBe('Foo (resolved)');
    expect(result[0]?.rows[0]?.role).toBe('dimension');
  });

  test('qualified expression `[ds].[field]` parses to one FieldRef with datasource set', () => {
    const wb = {
      worksheets: {
        worksheet: {
          '@_name': 'Sheet',
          column: {
            '@_name': 'bar',
            '@_caption': 'Bar',
            '@_role': 'dimension',
            '@_datatype': 'string',
          },
          table: {
            panes: { pane: { mark: { '@_class': 'Bar' } } },
            rows: '[federated.foo].[bar]',
          },
        },
      },
    };
    const result = extractVisualEncodings(wb);
    expect(result[0]?.rows).toHaveLength(1);
    expect(result[0]?.rows[0]).toMatchObject({
      datasource: 'federated.foo',
      field: 'bar',
      caption: 'Bar',
      role: 'dimension',
    });
  });

  test('dedupes shelf entries that repeat across panes', () => {
    const wb = {
      worksheets: {
        worksheet: {
          '@_name': 'Sheet',
          column: {
            '@_name': 'foo',
            '@_caption': 'Foo',
            '@_role': 'dimension',
            '@_datatype': 'string',
          },
          table: {
            panes: {
              pane: [
                { mark: { '@_class': 'Bar' }, rows: '[foo]' },
                { mark: { '@_class': 'Bar' }, rows: '[foo]' },
              ],
            },
          },
        },
      },
    };
    const result = extractVisualEncodings(wb);
    expect(result[0]?.rows).toHaveLength(1);
    expect(result[0]?.rows[0]?.field).toBe('foo');
  });

  test('resolves captions from datasource-level <column> nodes (not just worksheet-local)', () => {
    const wb = {
      datasources: {
        datasource: {
          '@_name': 'ds',
          column: {
            '@_name': '[avg:Sales:qk]',
            '@_caption': 'Average Sales',
            '@_role': 'measure',
            '@_datatype': 'real',
          },
        },
      },
      worksheets: {
        worksheet: {
          '@_name': 'Sheet',
          table: {
            panes: { pane: { mark: { '@_class': 'Bar' } } },
            rows: '[ds].[avg:Sales:qk]',
          },
        },
      },
    };
    const result = extractVisualEncodings(wb);
    expect(result[0]?.rows[0]?.caption).toBe('Average Sales');
    expect(result[0]?.rows[0]?.role).toBe('measure');
    expect(result[0]?.rows[0]?.datasource).toBe('ds');
  });

  test('normalizes optional encodings: null when missing, single object when 1 found', () => {
    const wb = {
      worksheets: {
        worksheet: {
          '@_name': 'Sheet',
          table: { panes: { pane: { mark: { '@_class': 'Bar' } } } },
        },
      },
    };
    const result = extractVisualEncodings(wb);
    expect(result[0]?.color).toBeNull();
    expect(result[0]?.size).toBeNull();
    expect(result[0]?.shape).toBeNull();
    expect(result[0]?.detail).toEqual([]);
    expect(result[0]?.tooltip).toEqual([]);
    expect(result[0]?.label).toEqual([]);
  });
});

function worksheet(name: string, markClass: string): unknown {
  return {
    '@_name': name,
    table: { panes: { pane: { mark: { '@_class': markClass } } } },
  };
}

describe('parsePills', () => {
  test('single unqualified pill', () => {
    expect(parsePills('[foo]')).toEqual([{ field: 'foo' }]);
  });

  test('qualified pill ds.field is one pill', () => {
    expect(parsePills('[ds].[foo]')).toEqual([
      { datasource: 'ds', field: 'foo' },
    ]);
  });

  test('multiple qualified pills joined by +', () => {
    expect(parsePills('[ds].[a]+[ds].[b]')).toEqual([
      { datasource: 'ds', field: 'a' },
      { datasource: 'ds', field: 'b' },
    ]);
  });

  test('mixed qualified and unqualified', () => {
    expect(parsePills('[ds].[a]+[b]')).toEqual([
      { datasource: 'ds', field: 'a' },
      { field: 'b' },
    ]);
  });

  test('empty expression returns []', () => {
    expect(parsePills('')).toEqual([]);
  });
});
