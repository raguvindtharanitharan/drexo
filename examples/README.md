# Examples

Real Tableau workbooks (`.twbx`) used to develop and test **ingi**.

## What this folder is for

- Test the parser (`.twb` XML extraction → typed model)
- Verify the markdown generator (typed model → canonical `.model.md`)
- Anchor the v0.1 integration test (snapshot the generated metadata
  file against the workbook)

## Included fixtures

| Name | File | Source | Notes |
|------|------|--------|-------|
| Superstore Analysis | `superstore-analysis.model.md` | Tableau public sample dataset | 30 worksheets, 0 dashboards, 7 calculated fields. Generated reference output — source `.twbx` not included (available from Tableau's sample workbooks). |

## Local-only fixtures

The primary integration fixture (`giving-renewal-summary.twbx`) is
not included in this repo. To run the integration tests, place a
`.twbx` file at `examples/giving-renewal-summary.twbx` and update
`tests/integration/analyze-workbook.test.ts` to match its structure.

`.twbx` files are gitignored — they live locally per developer.

## How to use

```bash
# Generate the metadata file from a workbook
npm run dev -- analyze ./examples/<your-workbook>.twbx
```

The generator writes `<workbook-name>.model.md` next to the input
by default. Pass `--output <path>` to override.

## Adding a new fixture

1. Drop the `.twbx` file in this folder.
2. Run `npm run dev -- analyze ./examples/<file>.twbx`.
3. Skim the generated `.model.md` — does it look right?
4. If yes, add a row to the table above and (if it surfaces new
   parser cases) extend the unit tests in
   `src/parsers/extractors/*.test.ts`.

Workbooks should ideally be safe to discuss publicly. Sensitive
internal dashboards stay local — anonymize before sharing.

---

**Last updated**: 2026-05-20
