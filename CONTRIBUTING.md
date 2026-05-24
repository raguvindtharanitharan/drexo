# Contributing to ingi

Thank you for your interest in contributing to ingi! 🎉

ingi is an open-source CLI that helps people migrate away from expensive Tableau licenses into beautiful, maintainable React dashboards.

## How to Contribute

### Reporting Bugs

- Use the [GitHub Issues](https://github.com/raguvindtharanitharan/ingi/issues) page
- Include:
  - ingi version (`ingi --version`)
  - Node.js version
  - Tableau version + sample .twbx (if possible and safe to share)
  - Exact command + full error output

### Suggesting Features

We love ideas! Please open an issue with:
- The problem you're trying to solve
- Your proposed solution
- Example Tableau features you want supported

### Development Setup

```bash
git clone https://github.com/raguvindtharanitharan/ingi.git
cd ingi
npm install
npm run dev -- --help
```

Useful commands:

```bash
npm run dev analyze ./path/to/file.twbx
npm run build
npm run start
```

### Adding a New Mark Type to the Parser (v0.1)

1. Extend the model in `src/parsers/model.ts`
2. Add classification logic in `src/parsers/extractors/marks.ts`
3. Update the markdown generator if the new mark type needs a dedicated YAML field
4. Add unit tests in `src/parsers/extractors/marks.test.ts`
5. Add integration coverage in `tests/integration/`

> See `docs/schema/workbook-model.md` for the canonical metadata schema
> and `docs/dev/` for stage-specific developer docs.

### Code Style

- TypeScript strict mode
- Prefer small, focused functions
- Good error messages are critical for a CLI

### Pull Request Process

1. Fork the repo and create a feature branch
2. Make your changes + add tests when possible
3. Run `npm run build` successfully
4. Open a PR with a clear description (link any related issues)

We will review as quickly as possible.

## Project Structure

```
src/
├── cli.ts                 # Commander entrypoint + all commands
├── parsers/               # Tableau format understanding
├── generators/            # React code emission
└── utils/                 # Shared helpers (logger, fs, etc.)
```

## Code of Conduct

Be respectful and inclusive. We follow the standard Contributor Covenant.

---

Questions? Reach out by opening an issue or discussion.
