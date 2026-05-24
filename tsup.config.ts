import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
) as { version: string };

const sharedConfig = {
  format: ['esm'] as const,
  target: 'node20' as const,
  sourcemap: true,
  dts: false,
  outDir: 'dist',
  define: {
    __INGI_VERSION__: JSON.stringify(version),
  },
};

export default [
  // CLI binary — shebang required
  defineConfig({
    ...sharedConfig,
    entry: ['src/cli.ts'],
    clean: true,
    banner: { js: '#!/usr/bin/env node' },
  }),
  // Programmatic API — no shebang
  defineConfig({
    ...sharedConfig,
    entry: ['src/index.ts'],
    clean: false,
  }),
];
