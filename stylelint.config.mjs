// Stylelint for every style file in the repo (spec 002, REQ-7.1; ARCHITECTURE §5).
// No raw colours, font families or lengths: styles read var(--ui-*) tokens.
// The only files with raw values are the compiler's output (*.generated.css).

const RAW_LENGTH = '/(?<![\\w.-])-?\\d*\\.?\\d+(px|rem|em|pt|vh|vw|vmin|vmax|ch|ex)\\b/';
// Border and outline widths: only the documented 1px hairline.
const NOT_HAIRLINE = '/(?<![\\w.-])(?!1px\\b)-?\\d*\\.?\\d+(px|rem|em|pt)\\b/';

/** @type {import('stylelint').Config} */
export default {
  ignoreFiles: ['**/*.generated.css', '**/node_modules/**', 'dist/**', 'coverage/**', 'tmp/**'],
  overrides: [{ files: ['**/*.scss'], customSyntax: 'postcss-scss' }],
  rules: {
    // Colours.
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'],

    // Fonts.
    'declaration-property-value-allowed-list': {
      'font-family': ['/^var\\(--ui-[a-z0-9-]+\\)$/', 'inherit'],
      font: ['/^var\\(--ui-[a-z0-9-]+\\)$/', 'inherit'],
    },

    // Spacing, sizing, radius and type: tokens only (unitless 0 and % are allowed).
    'declaration-property-unit-allowed-list': {
      '/^(margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left)/': ['%'],
      '/^(width|height|min-width|min-height|max-width|max-height|flex-basis|block-size|inline-size)$/': ['%'],
      '/radius/': ['%'],
      'font-size': ['%'],
      'line-height': [],
      'letter-spacing': [],
    },

    'declaration-property-value-disallowed-list': {
      '/^(border|outline)(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-width)?$/': [NOT_HAIRLINE],
      // Custom properties outside generated theme CSS hold no raw colour or length.
      '/^--/': ['/#[0-9a-fA-F]{3,8}\\b/', RAW_LENGTH],
    },
  },
};
