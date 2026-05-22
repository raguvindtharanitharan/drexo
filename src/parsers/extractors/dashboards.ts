import type {
  Dashboard,
  DashboardSize,
  Zone,
  ZoneType,
} from '../model.js';
import { toArray, extractFormattedTitle } from './_helpers.js';

/**
 * Extract dashboards and their nested zone tree.
 *
 * Tableau dashboards are built from a hierarchical layout of zones.
 * Each zone is either a layout container (`layout-basic`,
 * `layout-flow`) or a content zone (worksheet, parameter control,
 * text). We preserve the full tree so the generator can later
 * reconstruct it as a responsive React grid (v0.3 work).
 */
export function extractDashboards(workbook: any): Dashboard[] {
  const dashboardsRaw = workbook?.dashboards?.dashboard;
  if (!dashboardsRaw) return [];

  return toArray(dashboardsRaw).map((db: any) => mapDashboard(db));
}

function mapDashboard(db: any): Dashboard {
  const name: string = db['@_name'] ?? 'Unnamed Dashboard';
  const title = extractFormattedTitle(db);
  const size = extractSize(db);

  const zones = db?.zones?.zone ? toArray(db.zones.zone).map((z: any) => mapZone(z)) : [];

  return {
    name,
    title,
    size,
    layoutType: 'tiled',           // v0.2+: detect floating layouts
    zones,
    worksheetsUsed: collectWorksheetsUsed(zones),
    floatingObjects: [],           // v0.2+
  };
}

function extractSize(db: any): DashboardSize {
  const size = db?.size ?? {};
  return {
    width: parseInt(size['@_maxwidth'] ?? size['@_minwidth'] ?? '0', 10),
    height: parseInt(size['@_maxheight'] ?? size['@_minheight'] ?? '0', 10),
  };
}

function mapZone(zone: any): Zone {
  const typeV2: string | undefined = zone['@_type-v2'];
  const name: string | undefined = zone['@_name'];
  const isLayoutZone = typeV2?.startsWith('layout') ?? false;
  const isWorksheetZone = name !== undefined && !isLayoutZone && typeV2 !== 'paramctrl' && typeV2 !== 'text';

  const type: ZoneType = isWorksheetZone ? 'worksheet' : normalizeZoneType(typeV2);

  const children = zone.zone ? toArray(zone.zone).map((z: any) => mapZone(z)) : [];

  return {
    id: String(zone['@_id'] ?? ''),
    name,
    worksheet: isWorksheetZone ? name : undefined,
    type,
    x: parseFloat(zone['@_x'] ?? '0'),
    y: parseFloat(zone['@_y'] ?? '0'),
    w: parseFloat(zone['@_w'] ?? '0'),
    h: parseFloat(zone['@_h'] ?? '0'),
    isFixed: zone['@_is-fixed'] === 'true',
    children,
  };
}

function normalizeZoneType(raw: string | undefined): ZoneType {
  if (!raw) return 'unknown';
  if (raw.startsWith('layout-basic')) return 'layout-basic';
  if (raw.startsWith('layout-flow')) return 'layout-flow';
  if (raw === 'paramctrl') return 'paramctrl';
  if (raw === 'text') return 'text';
  if (raw === 'empty') return 'empty';
  return 'unknown';
}

function collectWorksheetsUsed(zones: Zone[]): string[] {
  const result = new Set<string>();
  function walk(list: Zone[]): void {
    for (const z of list) {
      if (z.worksheet) result.add(z.worksheet);
      if (z.children.length > 0) walk(z.children);
    }
  }
  walk(zones);
  return Array.from(result);
}
