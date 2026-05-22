import path from 'node:path';
import type { WorkbookMetadata } from '../model.js';

/**
 * Workbook-level metadata: name, filename, Tableau version, export
 * timestamp. Domain and complexity are user-supplied (v0.2+).
 */
export function extractMetadata(workbook: any, twbxPath: string): WorkbookMetadata {
  const tableauVersion = workbook?.['@_version'] ?? workbook?.['@_original-version'];
  const filename = path.basename(twbxPath);
  const name = filename.replace(/\.twbx$/i, '');

  return {
    name,
    originalFilename: filename,
    tableauVersion,
    sourceUrl: undefined,
    domain: undefined,
    complexity: undefined,
    exportedAt: new Date().toISOString(),
  };
}
