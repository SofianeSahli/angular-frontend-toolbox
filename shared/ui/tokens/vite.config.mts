/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/shared/ui/tokens',
  resolve: {
    tsconfigPaths: true,
  },
  // Vitest runs once here (no watch); without a watcher, Analog never drops its compiled
  // output mid-run (spec 002, T7 deviation).
  server: { watch: null },
  plugins: [angular({ tsconfig: `${import.meta.dirname}/tsconfig.spec.json` })],
  test: {
    name: 'ui-tokens',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,compiler}/**/*.spec.ts'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/shared/ui/tokens',
      provider: 'v8' as const,
    },
  },
}));
