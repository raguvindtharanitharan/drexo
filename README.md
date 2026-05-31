<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/raguvindtharanitharan/drexo/main/docs/assets/logo-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/raguvindtharanitharan/drexo/main/docs/assets/logo-light.png">
    <img alt="drexo" src="https://raw.githubusercontent.com/raguvindtharanitharan/drexo/main/docs/assets/logo-light.png">
  </picture>
</p>
<p align="center" style="margin-top: -20px">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/raguvindtharanitharan/drexo/main/docs/assets/logo-word-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/raguvindtharanitharan/drexo/main/docs/assets/logo-word-light.png">
    <img alt="drexo" src="https://raw.githubusercontent.com/raguvindtharanitharan/drexo/main/docs/assets/logo-word-light.png" width="120">
  </picture>
</p>

---

<p align="center">
  The bridge from BI to AI — turn Tableau workbooks into structured, AI-ready knowledge.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/drexo">
    <img src="https://img.shields.io/npm/v/drexo.svg" alt="npm version">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen" alt="Node.js">
  </a>
  <a href="https://github.com/RaguvindTharanitharan/drexo/issues">
    <img src="https://img.shields.io/badge/contributions-welcome-brightgreen.svg" alt="Contributions Welcome">
  </a>
</p>

---

Tableau stores your business logic — field definitions, calculations, dashboard layouts, filter wiring — in formats that no AI system can read. **drexo** changes that.

Point `drexo analyze` at any `.twbx` file and get back two structured markdown files: a complete metadata model and a visual blueprint with SQL query specifications. Pass them to any LLM, feed them into a code generator, or use them to scaffold a React frontend backed by a real API.

---

## How It Works

```
Tableau Workbook (.twbx)
        │
        ▼
   drexo analyze [--enrich]
        │
        ├──▶  .model.md    — metadata: fields, calculations, data sources,
        │                    worksheets, dashboards, filters (markdown + YAML)
        │
        └──▶  .visual.md   — visual blueprint: dashboard layout, per-worksheet
                             SQL query specs, interactive filter wiring,
                             field dictionary, calculated field translations
```

With `--enrich`, both files pass through Claude for a second pass: AI-generated executive summary, worksheet descriptions, plain-English formula translations, and cleaned field names with business context added to every SQL block.

---

## What's in the Output

### `.model.md` — Structural Metadata

Everything drexo extracts from the Tableau XML:

- **Workbook metadata** — name, Tableau version, export timestamp
- **Data sources** — connection type, all fields with types and roles
- **Semantic layer** — every field: raw name, display caption, data type, role
- **Calculated fields** — Tableau formulas captured verbatim, with AI-simplified versions when `--enrich` is used
- **Worksheets** — mark types, AI-generated descriptions
- **Visual encodings** — rows shelf, columns shelf, color, size, filters per worksheet
- **Dashboard layout** — full zone tree with coordinates preserved for grid reconstruction
- **Filters & actions** — all cross-sheet action filter wiring
- **Executive summary** — AI-generated when `--enrich` is used

### `.visual.md` — Visual Blueprint

Designed for developers and AI agents building the frontend and backend:

- **Dashboard layout** — proportional ASCII layout + table (61%/39% column splits, etc.)
- **Per-worksheet query specs** — SQL equivalent of what Tableau executes, with filter parameters
- **Interactive wiring** — which fields connect which worksheets as action filters, and the URL param name for each
- **Calculated field translations** — Tableau `IF/THEN/ELSE` → SQL `CASE WHEN`
- **Field dictionary** — internal Tableau names → clean display names
- **Data source summary** — base columns with types and roles

---

## Quick Start

```bash
npm install -g drexo
```

### Analyze a single workbook

```bash
drexo analyze ./my-report.twbx
# Writes: my-report.model.md + my-report.visual.md
```

### AI-enriched output

```bash
export ANTHROPIC_API_KEY=sk-ant-...
drexo analyze ./my-report.twbx --enrich
# Claude enriches both files: summaries, descriptions, cleaned SQL
# Results are cached — repeat runs are free
```

### Analyze an entire folder

```bash
drexo analyze ./workbooks/ --output-dir ./reports
# Finds all .twbx files, runs 3 in parallel
# Writes organized subdirectories + index.md catalog
```

### Explicit batch

```bash
drexo analyze report-a.twbx report-b.twbx --output-dir ./reports --enrich
```

---

## Commands

| Command | Description |
|---|---|
| `drexo analyze <files...>` | Analyze one or more workbooks. Accepts files, a directory, or a mix. |
| `--output-dir <path>` | Write outputs into organized subdirectories. Generates an `index.md` catalog when multiple workbooks are processed. |
| `--enrich` | Enrich output with AI-generated summaries, descriptions, and cleaned SQL (requires `ANTHROPIC_API_KEY`). Results cached by content hash. |
| `--enrich-model <model>` | Claude model to use (default: `claude-haiku-4-5-20251001`) |
| `drexo --debug` | Enable debug logging (stack traces on errors) |
| `drexo --help` | Show all options and examples |
| `drexo --version` | Print the drexo version |

### Output structure with `--output-dir`

```
reports/
  index.md                              ← catalog: all workbooks, worksheet counts, summaries
  accounts-receivable-analysis/
    model.md
    visual.md
  superstore-analysis/
    model.md
    visual.md
```

---

## Why Two Files?

`.model.md` answers: *"what is in this workbook?"*
`.visual.md` answers: *"how do I rebuild it?"*

The visual blueprint is the document a developer or AI agent needs to generate both the React frontend components and the backend API routes. It maps directly to code:

- Dashboard layout → CSS grid percentages
- Query spec → API endpoint + SQL
- Filter wiring → shared URL query params or React context
- Field dictionary → TypeScript interface names

---

## Roadmap

| Phase | Status | Goal |
|-------|--------|------|
| **v0.1 — Metadata Wedge** | ✅ Shipped | `drexo analyze` → `.model.md` |
| **v0.2 — Visual Blueprint + AI Enrichment** | ✅ Shipped | `--enrich`, `.visual.md` with SQL specs, batch processing, organized output |
| **v0.3 — React Generator** | Next | `drexo migrate` → Vite + React app wired to real API endpoints |
| **v1.0 — Production-Ready** | Planned | Live data, interactive filters, calculated fields in generated code |
| **post-v1 — Data Agents** | Conditional | `drexo query` — conversational Q&A over your BI catalog |

Full roadmap: [`docs/ROADMAP.md`](./docs/ROADMAP.md)

---

## Development

```bash
git clone https://github.com/raguvindtharanitharan/drexo.git
cd drexo
npm install

# Run the CLI without a build step
npm run dev -- analyze ./examples/Accounts\ Receivable\ Analysis.twbx

# Build
npm run build

# Run tests
npm test
```

**Tech stack:**
- ESM-only TypeScript — no CJS shims, no `__dirname` hacks
- `commander` for the CLI surface
- `fast-xml-parser` for `.twb` parsing; `adm-zip` for `.twbx` unzip
- `@anthropic-ai/sdk` for the enrichment layer
- Vitest + real-fixture integration tests (no mocked XML)

---

## Contributing

The parser and visual blueprint generator are the highest-leverage areas right now. Every new workbook surfaces edge cases that make drexo more generic.

- Read [CONTRIBUTING.md](./CONTRIBUTING.md)
- Issues labeled `good first issue` and `parser` are great starting points
- Real workbooks (even anonymized) are the most valuable contribution

---

## License

MIT © [Raguvind Tharanitharan](https://github.com/raguvindtharanitharan)

---

**Made for teams tired of vendor lock-in.**
If drexo saves your company money, star the repo and tell your friends.
