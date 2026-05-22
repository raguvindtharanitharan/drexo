/**
 * Internal helpers shared across extractors.
 *
 * Underscore prefix is a convention indicating this file is internal
 * to the extractors layer and not re-exported.
 */

/**
 * fast-xml-parser returns either a single object or an array
 * depending on cardinality. Normalize to an array.
 */
export function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Extract a `<layout-options><title><formatted-text>` block's text
 * content. Used by both worksheet and dashboard extractors.
 */
export function extractFormattedTitle(node: any): string | undefined {
  const run = node?.['layout-options']?.title?.['formatted-text']?.run;
  if (!run) return undefined;
  if (Array.isArray(run)) {
    return run.map((r: any) => r?.['#text'] ?? '').join('');
  }
  return run?.['#text'];
}
