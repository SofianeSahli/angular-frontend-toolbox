/** @type {import('stylelint').Config} */
export default {
  plugins: ['./shared/ui/tokens/stylelint/ui-rules.mjs'],
  ignoreFiles: ['**/*.generated.css', '**/node_modules/**', 'dist/**', 'coverage/**', 'tmp/**'],
  overrides: [{ files: ['**/*.scss'], customSyntax: 'postcss-scss' }],
  rules: {
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'],

    'declaration-property-value-allowed-list': {
      'font-family': ['/^var\\(--ui-[a-z0-9-]+\\)$/', 'inherit'],
      font: ['/^var\\(--ui-[a-z0-9-]+\\)$/', 'inherit'],
    },

    'ui/lengths-only-in-component-tokens': true,
    'ui/color-mix-tokens-only': true,
  },
};
