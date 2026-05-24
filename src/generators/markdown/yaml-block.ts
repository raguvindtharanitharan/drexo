/**
 * Serialize model objects into the canonical YAML blocks defined by
 * `docs/schema/workbook-model.md`.
 *
 * Two responsibilities:
 *   1. Convert camelCase TypeScript keys to snake_case YAML keys.
 *   2. Convert `undefined` values to `null` so optional fields stay
 *      visible in the output (the schema treats missing data as
 *      explicit `null`, not omitted).
 */

import { strdrexofy } from 'yaml';

/**
 * Recursively rewrite an object for YAML emission.
 */
export function toYamlReady(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value)) return value.map((item) => toYamlReady(item));
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[snakeCase(key)] = toYamlReady(val);
    }
    return result;
  }
  return value;
}

function snakeCase(key: string): string {
  return key.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * Wrap a value in a fenced YAML code block, ready to embed in a
 * markdown document.
 */
export function yamlBlock(value: unknown): string {
  const yamlText = strdrexofy(value, {
    indent: 2,
    lineWidth: 0,
  });
  return '```yaml\n' + yamlText.trimEnd() + '\n```';
}
