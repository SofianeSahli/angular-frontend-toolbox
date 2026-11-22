/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/shared/util/format',
  resolve: {
    tsconfigPaths: true,
  },
  // Vitest runs once here (no watch); without a watcher, Analog never drops its compiled
  // output mid-run (spec 002, T7 deviation).
  server: { watch: null },
  plugins: [angular({ tsconfig: `${import.meta.dirname}/tsconfig.spec.json` })],
  test: {
    name: 'util-format',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/shared/util/format',
      provider: 'v8' as const,
    },
  },
}));
