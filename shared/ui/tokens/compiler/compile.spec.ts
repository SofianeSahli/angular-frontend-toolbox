import { compileDefaults, compileTheme, parseContract, resolveAlias, toRgbTriplet, type Contract } from './compile';
import contractJson from '../contract.json';

const contract: Contract = {
  required: { color: ['bg', 'ink', 'accent'], font: ['sans'] },
  defaults: [
    { name: 'control-height-md', value: '44px' },
    { name: 'duration-fast', value: '120ms' },
    { name: 'easing-standard', value: 'cubic-bezier(0.2, 0, 0, 1)' },
  ],
};

function theme(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Test Theme',
    color: {
      themes: [{ id: 'light' }, { id: 'dark' }],
      tokens: [
        { name: 'bg', value: { light: '#FFFFFF', dark: '#000' } },
        { name: 'ink', value: { light: '#1C1A17', dark: '#F2EDE5' } },
        { name: 'accent', value: { light: '{accent-olive}', dark: '{accent-olive}' } },
        { name: 'accent-olive', value: { light: '#4E6B1F', dark: '#B3CC7A' } },
        { name: 'accent-olive-soft', value: { light: '#EDF2DF', dark: '#263018' } },
        { name: 'accent-figue', value: { light: '#7A3E6E', dark: '#E3A6D6' } },
      ],
    },
    type: {
      families: { sans: '"Inter", system-ui, sans-serif', arabic: '"IBM Plex Sans Arabic", sans-serif' },
      groups: [{ name: 'Text', family: 'sans', styles: [{ name: 'body', fontSize: '15px', lineHeight: '22px', fontWeight: 400, letterSpacing: '0.02em' }] }],
    },
    spacing: { tokens: [{ name: 'space-4', value: '16px' }] },
    radius: { tokens: [{ name: 'radius-md', value: '12px' }] },
    shadow: { tokens: [{ name: 'shadow-sheet', value: '0 8px 24px rgba(28,26,23,0.10)' }] },
    ...overrides,
  };
}

function withColors(tokens: unknown[]) {
  const t = theme();
  return { ...t, color: { ...t.color, tokens: [...t.color.tokens, ...tokens] } };
}

describe('compileDefaults (REQ-1.2, REQ-1.3)', () => {
  it('emits the defaults in the tokens layer and zero durations under reduced motion', () => {
    const css = compileDefaults(contract);
    expect(css).toContain('@layer tokens {');
    expect(css).toContain('--ui-control-height-md: 44px;');
    expect(css).toContain('--ui-easing-standard: cubic-bezier(0.2, 0, 0, 1);');
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s+:root \{\s+--ui-duration-fast: 0ms;/);
  });

  it('accepts the real contract with the documented defaults', () => {
    const real = parseContract(contractJson);
    expect(real.required.color).toHaveLength(31);
    expect(real.defaults.map((d) => `${d.name}=${d.value}`)).toEqual([
      'control-height-sm=36px',
      'control-height-md=44px',
      'control-height-lg=52px',
      'focus-ring-width=2px',
      'focus-ring-offset=2px',
      'duration-fast=120ms',
      'duration-base=200ms',
      'duration-slow=320ms',
      'easing-standard=cubic-bezier(0.2, 0, 0, 1)',
    ]);
  });

  it('holds no brand value (REQ-1.7): no colour and no font in the contract defaults', () => {
    const css = compileDefaults(parseContract(contractJson));
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|rgb|font/i);
  });

  it('refuses an invalid default value', () => {
    expect(() => parseContract({ required: { color: [], font: [] }, defaults: [{ name: 'duration-fast', value: 'fast' }] })).toThrow(
      'Token "duration-fast": value "fast" is not allowed',
    );
  });
});

describe('compileTheme (REQ-3.1, REQ-3.2)', () => {
  const out = compileTheme(theme(), contract);

  it('sets light values on :root and dark values under [data-theme=dark], in the tokens layer', () => {
    expect(out.css.startsWith('/* Generated from tokens.json')).toBe(true);
    expect(out.css).toContain('@layer tokens {');
    expect(out.css).toMatch(/:root,\n {2}\[data-theme='light'\] \{[^}]*--ui-color-bg: #FFFFFF;/);
    expect(out.css).toMatch(/\[data-theme='dark'\] \{[^}]*--ui-color-bg: #000;/);
  });

  it('resolves aliases to the referenced variable, with an rgb twin', () => {
    expect(out.css).toContain('--ui-color-accent: var(--ui-color-accent-olive);');
    expect(out.css).toContain('--ui-color-accent-rgb: var(--ui-color-accent-olive-rgb);');
    expect(out.css).toContain('--ui-color-ink-rgb: 28, 26, 23;');
    expect(toRgbTriplet('#000')).toBe('0, 0, 0');
  });

  it('emits one block per accent, with the soft tint when the theme defines one', () => {
    expect(out.css).toMatch(/\[data-accent='olive'\] \{[^}]*--ui-color-accent-soft: var\(--ui-color-accent-olive-soft\);/);
    expect(out.css).toMatch(/\[data-accent='figue'\] \{[^}]*--ui-color-accent: var\(--ui-color-accent-figue\);/);
    expect(out.css).not.toMatch(/\[data-accent='figue'\] \{[^}]*accent-soft/);
    expect(out.descriptor).toEqual({ name: 'test-theme', accents: ['olive', 'figue'], defaultAccent: 'olive' });
  });

  it('emits fonts, text styles, spacing, radius and shadow; Arabic text uses the Arabic family (REQ-2.7)', () => {
    expect(out.css).toContain('--ui-font-sans: "Inter", system-ui, sans-serif;');
    expect(out.css).toContain('--ui-text-body-size: 15px;');
    expect(out.css).toContain('--ui-text-body-line-height: 22px;');
    expect(out.css).toContain('--ui-text-body-weight: 400;');
    expect(out.css).toContain('--ui-text-body-tracking: 0.02em;');
    expect(out.css).toContain('--ui-space-4: 16px;');
    expect(out.css).toContain('--ui-radius-md: 12px;');
    expect(out.css).toContain('--ui-shadow-sheet: 0 8px 24px rgba(28,26,23,0.10);');
    expect(out.css).toMatch(/:lang\(ar\) \{\s+font-family: var\(--ui-font-arabic\);/);
  });

  it('writes a typed descriptor module', () => {
    expect(out.ts).toContain("export const testThemeTheme = {\n  name: 'test-theme',\n  accents: ['olive', 'figue'],\n  defaultAccent: 'olive',\n} as const;");
  });

  it('lets a theme override a default, and keeps reduced motion for an overridden duration', () => {
    const css = compileTheme(theme({ overrides: { tokens: [{ name: 'control-height-md', value: '48px' }, { name: 'duration-fast', value: '90ms' }] } }), contract).css;
    expect(css).toContain('--ui-control-height-md: 48px;');
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\s+:root \{\s+--ui-duration-fast: 0ms;/);
  });

  it('is deterministic (REQ-3.4)', () => {
    const a = compileTheme(theme(), contract);
    const b = compileTheme(theme(), contract);
    expect(a.css).toBe(b.css);
    expect(a.ts).toBe(b.ts);
    expect(compileDefaults(contract)).toBe(compileDefaults(contract));
  });
});

describe('compileTheme errors (REQ-3.3)', () => {
  const cases: Array<[string, unknown, string]> = [
    ['an unknown alias', withColors([{ name: 'link', value: { light: '{nope}', dark: '#000000' } }]), 'Token "link": unknown alias "{nope}"'],
    [
      'an alias cycle',
      withColors([
        { name: 'a', value: { light: '{b}', dark: '#000000' } },
        { name: 'b', value: { light: '{a}', dark: '#000000' } },
      ]),
      'alias cycle',
    ],
    ['a name used twice', withColors([{ name: 'bg', value: { light: '#000000', dark: '#000000' } }]), 'Token "bg" is defined twice'],
    ['a colour that is not hex or alias', withColors([{ name: 'x', value: { light: 'red', dark: '#000000' } }]), 'Token "x": value "red" is not allowed'],
    ['a length that is not a length', theme({ spacing: { tokens: [{ name: 'space-1', value: 'big' }] } }), 'Token "space-1": value "big" is not allowed'],
    ['a value that could inject CSS', theme({ shadow: { tokens: [{ name: 'shadow-x', value: '0 0 1px red; } body { color: red' }] } }), 'Token "shadow-x"'],
    ['a missing dark value', withColors([{ name: 'x', value: { light: '#000000' } }]), 'Token "x" has no value for theme "dark"'],
    ['a theme set other than light and dark', theme({ color: { themes: [{ id: 'light' }], tokens: [] } }), 'color.themes must be exactly "light" and "dark"'],
    ['an override of an unknown default', theme({ overrides: { tokens: [{ name: 'banana', value: '1px' }] } }), 'Token "banana": not a default of the contract'],
  ];

  it.each(cases)('fails on %s, naming the token', (_label, input, message) => {
    expect(() => compileTheme(input, contract)).toThrow(message);
  });

  it('fails when a "must provide" colour is missing', () => {
    const t = theme();
    const input = { ...t, color: { ...t.color, tokens: t.color.tokens.filter((x) => x.name !== 'ink') } };
    expect(() => compileTheme(input, contract)).toThrow('Token "ink" is required by the contract and missing');
  });

  it('fails when a "must provide" font family is missing', () => {
    const t = theme();
    const input = { ...t, type: { families: { arabic: 'serif' }, groups: [] } };
    expect(() => compileTheme(input, contract)).toThrow('Font family "sans" is required by the contract and missing');
  });

  it('resolves alias chains to the final hex', () => {
    const colors = { a: { light: '{b}', dark: '{b}' }, b: { light: '{c}', dark: '#111111' }, c: { light: '#222222', dark: '#333333' } };
    expect(resolveAlias(colors, 'a', 'light')).toBe('#222222');
    expect(resolveAlias(colors, 'a', 'dark')).toBe('#111111');
  });
});
