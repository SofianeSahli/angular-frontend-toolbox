const RAW_LENGTH = '/(?<![\\w.-])-?\\d*\\.?\\d+(px|rem|em|pt|vh|vw|vmin|vmax|ch|ex)\\b/';
const LENGTH_OTHER_THAN_1PX_HAIRLINE = '/(?<![\\w.-])(?!1px\\b)-?\\d*\\.?\\d+(px|rem|em|pt)\\b/';

/** @type {import('stylelint').Config} */
export default {
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

    'declaration-property-unit-allowed-list': {
      '/^(margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left)/': ['%'],
      '/^(width|height|min-width|min-height|max-width|max-height|flex-basis|block-size|inline-size)$/': ['%'],
      '/radius/': ['%'],
      'font-size': ['%'],
      'line-height': [],
      'letter-spacing': [],
    },

    'declaration-property-value-disallowed-list': {
      '/^(border|outline)(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-width)?$/': [LENGTH_OTHER_THAN_1PX_HAIRLINE],
      '/^--/': ['/#[0-9a-fA-F]{3,8}\\b/', RAW_LENGTH],
    },
  },
};
