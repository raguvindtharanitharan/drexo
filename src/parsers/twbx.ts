/**
 * Foundational utility: unzip a .twbx file and parse the .twb XML
 * exactly once. All extractors receive the already-parsed `workbook`
 * root node from here.
 *
 * `.twbx` = ZIP archive containing a `.twb` (XML) plus optional
 * `.hyper` data extracts in a `Data/` subfolder. We extract only the
 * `.twb` in v0.1; `.hyper` data extraction is v0.2.
 */

import { openSync, readSync, closeSync } from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';

function looksLikeRawTwbXml(absolutePath: string): boolean {
  const fd = openSync(absolutePath, 'r');
  try {
    const buf = Buffer.alloc(5);
    readSync(fd, buf, 0, 5, 0);
    return buf.toString('utf8').startsWith('<?xml');
  } catch {
    return false;
  } finally {
    closeSync(fd);
  }
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
});

export interface ParsedTwbx {
  /**
   * Parsed `.twb` XML root (the `<workbook>` element).
   *
   * Typed as `any` because the Tableau XML schema is enormous,
   * irregular, and partially undocumented. Extractors narrow types
   * as they pull values; the produced model is fully typed.
   */
  workbook: any;
  twbxPath: string;
  filename: string;
}

export function loadTwbx(twbxPath: string): ParsedTwbx {
  const absolute = path.resolve(twbxPath);

  let zip: AdmZip;
  try {
    zip = new AdmZip(absolute);
  } catch (err) {
    // Common failure mode: someone renamed a raw `.twb` XML file
    // to `.twbx`. The file isn't a ZIP archive at all. Detect by
    // sniffing the first bytes for an XML prolog.
    if (looksLikeRawTwbXml(absolute)) {
      throw new Error(
        `${twbxPath} looks like raw .twb XML, not a packaged .twbx archive. Rename it to .twb (or repackage with its data extract) and run drexo analyze again.`
      );
    }
    throw err;
  }

  const entries = zip.getEntries();

  const twbEntry = entries.find((entry) => {
    const name = entry.entryName.toLowerCase();
    return name.endsWith('.twb') && !name.includes('data/');
  });

  if (!twbEntry) {
    throw new Error(`No .twb file found inside: ${twbxPath}`);
  }

  const xml = twbEntry.getData().toString('utf8');
  const parsed = xmlParser.parse(xml);
  const workbook = parsed?.workbook;

  if (!workbook) {
    throw new Error(`Could not parse <workbook> root in: ${twbxPath}`);
  }

  return {
    workbook,
    twbxPath: absolute,
    filename: path.basename(absolute),
  };
}
