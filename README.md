<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/migrare-logo-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/assets/migrare-logo-light.png">
    <img alt="Migrare" src="assets/migrare-logo-light.png">
  </picture>
</p>
<p align="center" style="margin-top: -40px">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/logo-word-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/assets/logo-word-light.png">
    <img alt="Migrare" src="assets/logo-word-light.png" width="120">
  </picture>
</p>

---

<p align="center">
  Migrate Tableau reports to modern ReactJS dashboards — fast.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/migrare">
    <img src="https://img.shields.io/npm/v/migrare.svg" alt="npm version">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen" alt="Node.js">
  </a>
  <a href="https://github.com/RaguvindTharanitharan/migrare/issues">
    <img src="https://img.shields.io/badge/contributions-welcome-brightgreen.svg" alt="Contributions Welcome">
  </a>
</p>

---

**migrare** is an open-source Node.js CLI that turns Tableau workbooks (`.twb` / `.twbx`) into clean, AI-readable metadata files today — and runnable React dashboard apps in v0.2.

Stop paying per-user Tableau licenses for internal dashboards. Own your code, own your metadata.

> **v0.1 (current):** `migrare analyze` produces a canonical metadata file (markdown + YAML) describing the workbook. Human-readable, agent-readable, paste-into-ChatGPT-able.
> **v0.2 (next):** `migrare migrate` reads that metadata and emits a Vite + React app, deployable anywhere.

---

## How It Works

```
Tableau Workbook (.twb / .twbx)
        │
        ▼
   migrare analyze
        │
        ▼
  .model.md  (metadata — markdown + YAML)
        │
        ▼
   migrare migrate  [v0.2]
        │
        ▼
   React App (Vite)
        │
        ▼
  Deploy anywhere
```

---

## ✨ Features

- **Deep Tableau Analysis** — Understand worksheets, dashboards, data sources, fields, and calculations
- **AI-Ready Metadata** — `.model.md` output is human-readable, LLM-friendly, and paste-into-ChatGPT-able
- **High-Fidelity Migration** — Map common mark types (bar, line, pie, scatter, tables, etc.) to beautiful React components
- **Smart Layouts** — Convert Tableau dashboard zones into responsive React grids
- **Multiple Targets** — Generate Vite + React apps or embeddable components for Next.js
- **Flexible Data** — Static JSON, API adapters, or live connections
- **Great Developer Experience** — TypeScript, modern tooling, easy to customize generated code

> **Current status**: v0.1 metadata pipeline ships. `migrare analyze` runs end-to-end on real workbooks. React generation lands in v0.2. Contributions welcome!

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- A Tableau workbook (`.twb` or `.twbx`)

### Installation

```bash
# Run instantly with npx (recommended while in development)
npx migrare@latest --help

# Or install globally
npm install -g migrare
```

### Basic Usage

```bash
# Generate the metadata file for a workbook
migrare analyze ./examples/giving-renewal-summary.twbx

# Output lands next to the input as <name>.model.md
cat ./examples/giving-renewal-summary.model.md
```

The generated `.model.md` is a single self-contained file: markdown narrative + fenced YAML blocks. Paste it into any LLM and ask questions about your dashboard, or feed it into `migrare migrate` (v0.2) to generate a React app.

---

## 📋 Commands

| Command | Description |
|---|---|
| `migrare analyze <file>` | Parse a Tableau workbook and write a canonical metadata file (`<name>.model.md`) |
| `migrare analyze <file> -o <path>` | Custom output path |
| `migrare migrate <file>` | **[v0.2]** Read the metadata file and generate a Vite + React app. Stub for now — prints a friendly redirect to `analyze`. |
| `migrare --debug` | Enable debug logging (stack traces on errors) |
| `migrare --help` | Show all options and examples |
| `migrare --version` | Print the migrare version |

---

## 🗺️ Roadmap

migrare is a **generic** Tableau-to-React migrator. We get there by shipping working specific cases first and letting real workbooks shape the architecture — not by designing for everything on day one.

| Phase | Goal |
|-------|------|
| ✅ **v0.1 — The Metadata Wedge** *(shipped)* | `migrare analyze` → a complete, human+agent-readable metadata file (markdown + YAML) describing the workbook. No React yet. |
| **v0.2 — React Generator + First Real Users** *(next)* | `migrare migrate` reads the metadata file → Vite + React app. 3 outside users surface real-world schema gaps. |
| **v0.3 — Multi-Sheet & Layout** | Whole dashboard, not one sheet. Layout zones → responsive React grid. Read-only parameter display. |
| **v1.0 — Production-Ready Generic** | Confident defaults across the long tail. Calculated fields, live parameters, filters, action links. Stable CLI surface. |
| **post-v1 — Data Agents & Commercial Layer** *(conditional)* | Data-agent CLI (e.g. `migrare query`) using the metadata layer for conversational Q&A. Plus possible hosted runs / cloud deploy. CLI stays free forever. |

**Anti-roadmap (explicit no):** Tableau parity, two-way sync, visual editor, multi-chart-library support before v1.0, SaaS before users.

---

## 🛠️ Development

```bash
git clone https://github.com/raguvindtharanitharan/migrare.git
cd migrare
npm install

# Run the CLI in dev mode (TypeScript, no build step)
npm run dev -- analyze ./examples/giving-renewal-summary.twbx

# Build
npm run build

# Run the test suite
npm test

# Link for local global testing
npm run link
migrare --version
```

**Tech decisions we made early**:
- ESM-only TypeScript (no CJS shims, no `__dirname` hacks)
- `commander` for the CLI surface
- `fast-xml-parser` for `.twb` parsing; `adm-zip` for `.twbx` unzip
- `yaml` (Eemeli Aro) for canonical YAML emission
- Vitest + real-fixture integration tests (no mocked `.twb` XML)
- Markdown + YAML as the v0.1 output format — friendly to humans, LLMs, and downstream tooling. Same shape as dbt's docs.

---

## 🤝 Contributing

We're just getting started — this is a fantastic time to shape the project!

- Read [CONTRIBUTING.md](./CONTRIBUTING.md)
- Look for issues labeled `good first issue` or `parser`
- The hardest (and most valuable) work is in the Tableau XML parser

Before submitting a pull request, open an issue so we can discuss the approach:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Open a pull request

All contributions are welcome: code, docs, example workbooks, design feedback, or real-world migration stories.

---

## 📄 License

MIT © [Raguvind Tharanitharan](https://github.com/raguvindtharanitharan)

---

## 🙏 Acknowledgements

- Inspired by the pain of expensive BI tools and the joy of building in React
- Tableau's public workbooks and documentation (reverse-engineered with respect)
- The amazing open-source React visualization community (Recharts, ECharts, Nivo, etc.)

---

**Made with ❤️ for teams tired of vendor lock-in.**

If migrare saves your company money or helps you ship faster, star the repo and tell your friends!
