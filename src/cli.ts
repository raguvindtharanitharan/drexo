import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import chalk from 'chalk';
import { Command } from 'commander';

import { parseWorkbook } from './parsers/index.js';
import { generateMarkdownModel } from './generators/index.js';
import { logger as log } from './utils/logger.js';

declare const __INGI_VERSION__: string;

const program = new Command();

program
  .name('ingi')
  .description(
    chalk.cyan(
      'Migrate Tableau workbooks (.twb / .twbx) into modern React dashboards.\n' +
        'v0.1 ships the metadata layer; React generation lands in v0.2.'
    )
  )
  .version(__INGI_VERSION__, '-v, --version', 'output the current version')
  .helpOption('-h, --help', 'display help for command')
  .option('-d, --debug', 'enable debug logging');

program.on('option:debug', () => {
  process.env.DEBUG = '1';
});

program.addHelpText(
  'after',
  `
${chalk.bold('Examples:')}
  $ ingi analyze ./examples/giving-renewal-summary.twbx
  $ ingi analyze ./report.twbx --output ./report.model.md

${chalk.bold('Learn more:')}
  https://github.com/raguvindtharanitharan/ingi
`
);

// ---------------------------------------------------------------------------
// NOTE: command logic is currently inline. If commands grow beyond analyze +
// migrate, extract each into its own module (e.g. src/commands/analyze.ts)
// so cli.ts stays a thin dispatcher.
// ---------------------------------------------------------------------------
// analyze
// ---------------------------------------------------------------------------

program
  .command('analyze <file>')
  .description(
    'Parse a Tableau workbook (.twbx) and write a canonical metadata file (markdown + YAML).'
  )
  .option('-o, --output <path>', 'output file path (default: <input>.model.md)')
  .action(async (file: string, options: { output?: string }) => {
    const start = performance.now();
    try {
      if (!existsSync(file)) {
        log.error(`File not found: ${file}`);
        process.exit(1);
      }

      log.info(`🔍 Analyzing ${chalk.bold(path.basename(file))}`);

      const workbook = await parseWorkbook(file);
      log.success(
        `Parsed ${workbook.dataSources.length} data sources, ` +
          `${workbook.worksheets.length} worksheets, ` +
          `${workbook.dashboards.length} dashboards`
      );

      const markdown = generateMarkdownModel(workbook);
      const outputPath = options.output ?? defaultOutputPath(file);
      await writeFile(outputPath, markdown, 'utf-8');

      const elapsed = ((performance.now() - start) / 1000).toFixed(2);
      const sizeKb = (markdown.length / 1024).toFixed(1);
      log.success(`Wrote ${chalk.cyan(outputPath)} (${sizeKb} KB) in ${elapsed}s`);
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      log.error(`Could not parse workbook: ${reason}`);
      if (process.env.DEBUG && e instanceof Error && e.stack) {
        console.error(chalk.gray(e.stack));
      }
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// migrate (v0.2 stub)
// ---------------------------------------------------------------------------

program
  .command('migrate <file>')
  .description(
    "[v0.2] Generate a React app from a workbook. Not yet implemented — try `ingi analyze` for v0.1's metadata output."
  )
  .action((file: string) => {
    log.warn(
      '`ingi migrate` is a v0.2 feature. It will read the metadata file produced by `ingi analyze` and generate a Vite + React app.'
    );
    log.info(`For v0.1, try:    ${chalk.cyan(`ingi analyze ${file}`)}`);
  });

// ---------------------------------------------------------------------------
// No-command → help
// ---------------------------------------------------------------------------

if (process.argv.length === 2) {
  program.help();
}

program.parse(process.argv);

function defaultOutputPath(inputFile: string): string {
  const parsed = path.parse(inputFile);
  return path.join(parsed.dir, `${parsed.name}.model.md`);
}
