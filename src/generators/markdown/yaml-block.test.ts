import { describe, expect, test } from 'vitest';
import { toYamlReady, yamlBlock } from './yaml-block.js';

describe('toYamlReady', () => {
  test('converts camelCase keys to snake_case', () => {
    expect(toYamlReady({ originalFilename: 'foo.twbx' })).toEqual({
      original_filename: 'foo.twbx',
    });
  });

  test('handles multi-word camelCase keys', () => {
    expect(
      toYamlReady({ visualEncodings: [], referenceLines: [], tableCalculations: [] })
    ).toEqual({
      visual_encodings: [],
      reference_lines: [],
      table_calculations: [],
    });
  });

  test('converts undefined to null', () => {
    expect(toYamlReady({ foo: undefined })).toEqual({ foo: null });
  });

  test('preserves explicit null', () => {
    expect(toYamlReady({ foo: null })).toEqual({ foo: null });
  });

  test('recurses into nested objects', () => {
    expect(toYamlReady({ outerKey: { innerKey: 'value' } })).toEqual({
      outer_key: { inner_key: 'value' },
    });
  });

  test('recurses into arrays', () => {
    expect(toYamlReady({ myArray: [{ camelKey: 1 }, { camelKey: 2 }] })).toEqual({
      my_array: [{ camel_key: 1 }, { camel_key: 2 }],
    });
  });

  test('passes through primitives unchanged', () => {
    expect(toYamlReady('hello')).toBe('hello');
    expect(toYamlReady(42)).toBe(42);
    expect(toYamlReady(true)).toBe(true);
    expect(toYamlReady(false)).toBe(false);
    expect(toYamlReady(null)).toBeNull();
    expect(toYamlReady(undefined)).toBeNull();
  });
});

describe('yamlBlock', () => {
  test('wraps content in fenced yaml block', () => {
    const result = yamlBlock({ name: 'foo' });
    expect(result.startsWith('```yaml\n')).toBe(true);
    expect(result.endsWith('\n```')).toBe(true);
  });

  test('uses 2-space indent for nested objects', () => {
    const result = yamlBlock({ outer: { inner: 'value' } });
    expect(result).toContain('outer:\n  inner: value');
  });

  test('renders arrays with `- ` prefix', () => {
    const result = yamlBlock({ items: [1, 2, 3] });
    expect(result).toContain('items:\n  - 1\n  - 2\n  - 3');
  });

  test('renders empty arrays as []', () => {
    const result = yamlBlock({ items: [] });
    expect(result).toContain('items: []');
  });

  test('renders null as null (not omitted)', () => {
    const result = yamlBlock({ foo: null });
    expect(result).toContain('foo: null');
  });
});
