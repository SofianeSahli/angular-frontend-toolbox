/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

const TIME_ZONE_WITH_UTC_PLUS_1_AND_PLUS_2 = 'Europe/Paris';
process.env['TZ'] = TIME_ZONE_WITH_UTC_PLUS_1_AND_PLUS_2;

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/shared/util/format',
  resolve: {
    tsconfigPaths: true,
  },
  // With the watcher on, Analog drops its compiled output mid-run and tests fail at random.
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
