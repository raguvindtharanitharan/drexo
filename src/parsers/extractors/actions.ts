import type { Action } from '../model.js';

/**
 * Extract dashboard actions (filter / highlight / URL).
 *
 * Tableau stores actions under `<actions>` (workbook-level) and
 * dashboard `<action>` children. The GAAP workbook used for v0.1
 * has no actions, so this returns `[]` and the parser is correct
 * by construction.
 *
 * v0.2+: implement when a real user's workbook surfaces actions.
 */
export function extractActions(_workbook: any): Action[] {
  return [];
}
