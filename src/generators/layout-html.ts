import type { TableauWorkbook, Dashboard, Zone, MarkType } from '../parsers/model.js';

export function generateLayoutHtml(workbook: TableauWorkbook): string {
  // Pick the most relevant dashboard — prefer the one matching the workbook name,
  // otherwise take the last one (typically the main dashboard)
  const dashboard =
    workbook.dashboards.find((d) =>
      d.name.toLowerCase().includes(workbook.metadata.name.toLowerCase())
    ) ?? workbook.dashboards[workbook.dashboards.length - 1];

  if (!dashboard) return errorHtml('No dashboards found in workbook.');

  const leaves = collectLeafZones(dashboard.zones);
  if (leaves.length === 0) return errorHtml('No layout zones found in dashboard.');

  // Compute bounding box and convert to percentages
  const minX = Math.min(...leaves.map((z) => z.x));
  const minY = Math.min(...leaves.map((z) => z.y));
  const maxX = Math.max(...leaves.map((z) => z.x + z.w));
  const maxY = Math.max(...leaves.map((z) => z.y + z.h));
  const totalW = maxX - minX || 1;
  const totalH = maxY - minY || 1;
  const totalArea = totalW * totalH;

  // Identify control zones: zones that share a worksheet name with a larger zone
  const areaByName = new Map<string, number>();
  for (const z of leaves) {
    const area = z.w * z.h;
    if (!areaByName.has(z.worksheet) || area > areaByName.get(z.worksheet)!) {
      areaByName.set(z.worksheet, area);
    }
  }

  // Build quick-filter label map: worksheet → filter field names (non-action filters)
  const filtersByWorksheet = new Map<string, string[]>();
  for (const f of workbook.filters) {
    if (f.name.includes('Action (')) continue; // skip action filters
    const raw = f.name.split('].').pop() ?? '';
    const field = raw
      .replace(/^\[/, '')          // strip leading [
      .replace(/\]$/, '')          // strip trailing ]
      .replace(/^none:/, '')       // strip none: prefix
      .replace(/^usr:/, '')        // strip usr: prefix
      .replace(/^sum:/, '')        // strip sum: prefix
      .replace(/:[a-z]+$/, '');    // strip :nk / :qk / :ok suffix
    if (!field || field.includes('Latitude') || field.includes('Longitude') || field.includes('Measure Names')) continue;
    for (const ws of f.appliedTo) {
      const arr = filtersByWorksheet.get(ws) ?? [];
      if (!arr.includes(field)) arr.push(field);
      filtersByWorksheet.set(ws, arr);
    }
  }

  const zones = leaves.map((z) => {
    const encoding = workbook.visualEncodings.find((e) => e.worksheet === z.worksheet);
    const markType = encoding?.effectiveMarkType ?? 'unsupported';
    const area = z.w * z.h;
    const maxArea = areaByName.get(z.worksheet) ?? area;
    const hasEncodings = encoding
      ? encoding.rows.length > 0 || encoding.columns.length > 0
      : false;

    // A zone is a "control" if it's non-worksheet (paramctrl/text),
    // OR a duplicate-named worksheet that's smaller than the main view (quick filter),
    // OR a small worksheet with NO field encodings (text label / button).
    // A small worksheet WITH real encodings is still a data view — leave it as-is.
    const isTextButton = z.kind === 'worksheet' && !hasEncodings && area < maxArea * 0.5;
    const isControl = z.kind !== 'worksheet' ||
      (area < maxArea && hasEncodings) ||   // smaller duplicate with data = quick filter
      isTextButton;                          // no encoding = text/button
    const filterFields = filtersByWorksheet.get(z.worksheet) ?? [];

    // Resolve row/column field names for worksheet panels
    const rowFields = encoding
      ? encoding.rows
          .map((r) => r.caption ?? cleanRef(r.field))
          .filter((n) => n && !n.includes('Latitude') && !n.includes('Longitude'))
      : [];
    const colFields = encoding
      ? encoding.columns
          .map((c) => c.caption ?? cleanRef(c.field))
          .filter((n) => n && n !== ':Measure Names')
          .slice(0, 3)
      : [];
    const hasMeasureNames = encoding?.columns.some((c) => c.field.includes(':Measure Names')) ?? false;

    return {
      name: z.displayLabel || z.worksheet,
      internalName: z.worksheet,
      kind: z.kind,
      markType,
      isControl,
      isTextButton,
      filterFields,
      rowFields,
      colFields,
      hasMeasureNames,
      controlMode: z.controlMode,
      paramRef: z.paramRef,
      left:   pct((z.x - minX) / totalW),
      top:    pct((z.y - minY) / totalH),
      width:  pct(z.w / totalW),
      height: pct(z.h / totalH),
    };
  });

  const zoneBlocks = zones.map((z) => {
    if (z.isControl) {
      // paramctrl → parameter control (slider, dropdown, etc.)
      if (z.kind === 'paramctrl') {
        const ctrlType = z.controlMode ?? 'dropdown';
        const ctrlIcon = ctrlType === 'slider' ? '⟼' : ctrlType === 'radio' ? '◉' : ctrlType === 'checkbox' ? '☑' : '▾';
        const paramLine = z.paramRef
          ? `<span style="font-size:9px;color:#92400e;opacity:0.7;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;">${escHtml(z.paramRef)}</span>`
          : '';
        return `
    <div style="
      position: absolute;
      left: ${z.left}; top: ${z.top};
      width: ${z.width}; height: ${z.height};
      box-sizing: border-box;
      background: #fffbeb;
      border: 2px dashed #f59e0b;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding: 6px 10px;
      overflow: hidden;
    ">
      <span style="font-size:9px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#b45309;">Parameter Control</span>
      <span style="font-size:12px;font-weight:600;color:#78350f;text-align:center;line-height:1.3;">${escHtml(z.name)}</span>
      ${paramLine}
      <span style="font-size:9px;color:#92400e;background:#fef3c7;padding:1px 6px;border-radius:4px;">${ctrlIcon} ${ctrlType}</span>
    </div>`;
      }

      // text → title / label zone
      if (z.kind === 'text') {
        return `
    <div style="
      position: absolute;
      left: ${z.left}; top: ${z.top};
      width: ${z.width}; height: ${z.height};
      box-sizing: border-box;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      overflow: hidden;
    ">
      <span style="font-size:10px;font-weight:500;color:#94a3b8;letter-spacing:0.04em;text-transform:uppercase;">Title / Text Zone</span>
    </div>`;
      }

      // text/button zone — worksheet with no field encodings
      if (z.isTextButton) {
        return `
    <div style="
      position: absolute;
      left: ${z.left}; top: ${z.top};
      width: ${z.width}; height: ${z.height};
      box-sizing: border-box;
      background: #f0fdf4;
      border: 1px dashed #86efac;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px 10px;
      overflow: hidden;
    ">
      <span style="font-size:9px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#16a34a;">Text / Button</span>
      <span style="font-size:10px;color:#15803d;margin-left:6px;">${escHtml(z.name)}</span>
    </div>`;
      }

      // small worksheet → quick filter — show field names + filter type
      const filterLabel = z.filterFields.length > 0 ? z.filterFields : [z.name];
      const filterType = z.filterFields.some(f => f.toLowerCase().includes('status') || f.toLowerCase().includes('type')) ? 'single-value list' : 'dropdown';
      return `
    <div style="
      position: absolute;
      left: ${z.left}; top: ${z.top};
      width: ${z.width}; height: ${z.height};
      box-sizing: border-box;
      background: #fffbeb;
      border: 2px dashed #f59e0b;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding: 6px 10px;
      overflow: hidden;
    ">
      <span style="font-size:9px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#b45309;">Quick Filter</span>
      ${filterLabel.map(f => `<span style="font-size:11px;font-weight:500;color:#78350f;text-align:center;line-height:1.3;">${escHtml(f)}</span>`).join('')}
      <span style="font-size:9px;color:#92400e;background:#fef3c7;padding:1px 6px;border-radius:4px;">type: ${filterType}</span>
    </div>`;
    }

    const { bg, border, badge, badgeBg } = zoneStyle(z.markType);

    const rowLine = z.rowFields.length > 0
      ? `<div style="font-size:10px;color:#64748b;margin-top:6px;text-align:center;">
          <span style="color:#94a3b8;font-weight:500;">ROWS&nbsp;</span>${z.rowFields.map(escHtml).join(' · ')}
         </div>`
      : '';

    const colLine = z.colFields.length > 0 || z.hasMeasureNames
      ? `<div style="font-size:10px;color:#64748b;text-align:center;">
          <span style="color:#94a3b8;font-weight:500;">COLS&nbsp;</span>${
            z.hasMeasureNames
              ? 'Measure Names' + (z.colFields.length ? ' · ' + z.colFields.map(escHtml).join(' · ') : '')
              : z.colFields.map(escHtml).join(' · ')
          }
         </div>`
      : '';

    return `
    <div style="
      position: absolute;
      left: ${z.left}; top: ${z.top};
      width: ${z.width}; height: ${z.height};
      box-sizing: border-box;
      background: ${bg};
      border: 2px solid ${border};
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 10px;
      overflow: hidden;
    ">
      <span style="font-size:14px;font-weight:600;color:#1e293b;text-align:center;line-height:1.3;">${escHtml(z.name)}</span>
      <span style="font-size:10px;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;background:${badgeBg};color:${badge};padding:2px 8px;border-radius:999px;">${markTypeLabel(z.markType)}</span>
      ${rowLine}
      ${colLine}
    </div>`;
  }).join('\n');

  const legend = [
    { label: 'Text Table', bg: '#dbeafe', border: '#3b82f6', badge: '#1d4ed8', badgeBg: '#eff6ff' },
    { label: 'Map', bg: '#f1f5f9', border: '#94a3b8', badge: '#475569', badgeBg: '#e2e8f0' },
    { label: 'Bar / Line / Other', bg: '#dcfce7', border: '#22c55e', badge: '#15803d', badgeBg: '#f0fdf4' },
    { label: 'Quick Filter', bg: '#fffbeb', border: '#f59e0b', badge: '#b45309', badgeBg: '#fef3c7' },
    { label: 'Unsupported', bg: '#f8fafc', border: '#cbd5e1', badge: '#64748b', badgeBg: '#f1f5f9' },
  ].map((l) => `
    <span style="display:inline-flex;align-items:center;gap:6px;margin-right:16px;">
      <span style="width:14px;height:14px;border-radius:3px;background:${l.bg};border:1.5px solid ${l.border};display:inline-block;"></span>
      <span style="font-size:12px;color:#475569;">${l.label}</span>
    </span>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escHtml(workbook.metadata.name)} — Layout Preview</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Poppins', sans-serif;
      background: #f8fafc;
      min-height: 100vh;
      padding: 24px;
    }
    .header {
      margin-bottom: 16px;
    }
    .header h1 {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
    }
    .header p {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .meta {
      display: flex;
      gap: 20px;
      margin-bottom: 16px;
      font-size: 12px;
      color: #64748b;
    }
    .meta span strong { color: #334155; }
    .legend {
      margin-bottom: 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
    }
    .canvas-wrap {
      width: 100%;
      aspect-ratio: ${Math.round(totalW / totalH * 100) / 100};
      position: relative;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      overflow: hidden;
    }
    .footer {
      margin-top: 12px;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escHtml(workbook.metadata.name)}</h1>
    <p>Dashboard layout preview — generated by <a href="https://github.com/raguvindtharanitharan/drexo" style="color:#3b82f6;text-decoration:none;">drexo</a></p>
  </div>
  <div class="meta">
    <span><strong>Dashboard:</strong> ${escHtml(dashboard.name)}</span>
    <span><strong>Canvas:</strong> ${dashboard.size.width} × ${dashboard.size.height}</span>
    <span><strong>Zones:</strong> ${zones.length}</span>
    <span><strong>Workbook:</strong> ${escHtml(workbook.metadata.originalFilename)}</span>
  </div>
  <div class="legend">${legend}</div>
  <div class="canvas-wrap">
${zoneBlocks}
  </div>
  <div class="footer">Each zone represents one Tableau worksheet. Layout proportions are derived from dashboard zone coordinates.</div>
</body>
</html>`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type LeafKind = 'worksheet' | 'paramctrl' | 'text';
interface LeafZone {
  worksheet: string;
  kind: LeafKind;
  displayLabel?: string;
  controlMode?: string;
  paramRef?: string;
  showTitle?: boolean;
  x: number; y: number; w: number; h: number;
}

function collectLeafZones(zones: Zone[]): LeafZone[] {
  const leaves: LeafZone[] = [];
  function walk(z: Zone) {
    if (z.children.length === 0) {
      if (z.worksheet) {
        leaves.push({
          worksheet: z.worksheet, kind: 'worksheet',
          displayLabel: z.displayLabel, showTitle: z.showTitle,
          x: z.x, y: z.y, w: z.w, h: z.h,
        });
      } else if (z.type === 'paramctrl') {
        leaves.push({
          worksheet: z.name ?? '',  kind: 'paramctrl',
          displayLabel: z.displayLabel,
          controlMode: z.controlMode,
          paramRef: z.paramRef,
          x: z.x, y: z.y, w: z.w, h: z.h,
        });
      } else if (z.type === 'text') {
        leaves.push({
          worksheet: z.name ?? 'Title', kind: 'text',
          displayLabel: z.displayLabel,
          x: z.x, y: z.y, w: z.w, h: z.h,
        });
      }
      return;
    }
    for (const c of z.children) walk(c);
  }
  for (const z of zones) walk(z);
  return leaves;
}

function zoneStyle(mark: MarkType): { bg: string; border: string; badge: string; badgeBg: string } {
  switch (mark) {
    case 'automatic':
    case 'text':
      return { bg: '#dbeafe', border: '#3b82f6', badge: '#1d4ed8', badgeBg: '#eff6ff' };
    case 'map':
      return { bg: '#f1f5f9', border: '#94a3b8', badge: '#475569', badgeBg: '#e2e8f0' };
    case 'bar':
    case 'line':
    case 'area':
    case 'pie':
      return { bg: '#dcfce7', border: '#22c55e', badge: '#15803d', badgeBg: '#f0fdf4' };
    default:
      return { bg: '#f8fafc', border: '#cbd5e1', badge: '#64748b', badgeBg: '#f1f5f9' };
  }
}

function markTypeLabel(mark: MarkType): string {
  const labels: Partial<Record<MarkType, string>> = {
    automatic: 'Text Table',
    text: 'Text Table',
    bar: 'Bar Chart',
    line: 'Line Chart',
    area: 'Area Chart',
    pie: 'Pie Chart',
    map: 'Map',
    heatmap: 'Heat Map',
    circle: 'Scatter',
    unsupported: 'Unsupported',
  };
  return labels[mark] ?? mark;
}

function cleanRef(field: string): string {
  const parts = field.split(':');
  const mid = parts.length >= 3 ? parts.slice(1, -1).join(':') : field;
  return mid.replace(/^\[|\]$/g, '').replace(/^_+\s*/, '').replace(/^\./, '');
}

function pct(n: number): string {
  return `${Math.round(n * 10000) / 100}%`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function errorHtml(msg: string): string {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;color:#ef4444;">${msg}</body></html>`;
}
