/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/shared/ui/organisms',
  resolve: {
    tsconfigPaths: true,
  },
  // With the watcher on, Analog drops its compiled output mid-run and tests fail at random.
  server: { watch: null },
  css: { preprocessorOptions: { scss: { loadPaths: [`${import.meta.dirname}/../tokens/src/styles`] } } },
  plugins: [angular({ tsconfig: `${import.meta.dirname}/tsconfig.spec.json` })],
  test: {
    name: 'ui-organisms',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/shared/ui/organisms',
      provider: 'v8' as const,
    },
  },
}));
