// @vitest-environment node
import { resolve } from 'node:path';
import stylelint from 'stylelint';

const pluginPath = resolve(import.meta.dirname, 'ui-rules.mjs');

async function problems(code: string, file = 'shared/ui/atoms/src/lib/switch/switch.scss'): Promise<string[]> {
  const { results } = await stylelint.lint({
    code,
    codeFilename: resolve(file),
    config: {
      plugins: [pluginPath],
      customSyntax: 'postcss-scss',
      rules: { 'ui/lengths-only-in-component-tokens': true, 'ui/color-mix-tokens-only': true },
    },
  });
  return results[0].warnings.map((w) => w.text);
}

describe('ui/lengths-only-in-component-tokens', () => {
  it("allows a raw length in this component's own tokens, and 0, %, unitless numbers and @media widths", async () => {
    const css = `
      :host { --ui-switch-track-block-size: 26px; --ui-switch-thumb-inset: 0.1875rem; }
      :host { margin: 0; inline-size: 100%; line-height: 1.2; opacity: 0.45; }
      @media (max-width: 767.98px) { :host { display: none; } }`;
    expect(await problems(css)).toEqual([]);
  });

  it('refuses a raw length in a non-custom property', async () => {
    expect(await problems(':host { padding-inline: 12px; }')).toEqual([
      expect.stringContaining('Raw length in "padding-inline"'),
    ]);
  });

  it("refuses a raw length in another component's tokens", async () => {
    expect(await problems(':host { --ui-button-icon-size: 18px; }')).toEqual([
      expect.stringContaining('only --ui-switch-* tokens in this file'),
    ]);
  });

  it('refuses a raw length in a semantic token', async () => {
    expect(await problems(':root { --ui-space-5: 20px; }', 'apps/x/src/styles.scss')).toHaveLength(1);
  });

  it('refuses raw lengths inside functions and shorthands', async () => {
    expect(await problems(':host { transform: translateX(18px); box-shadow: 0 2px var(--ui-color-ink); }')).toHaveLength(2);
  });
});

describe('ui/color-mix-tokens-only', () => {
  it('allows tokens, currentColor and transparent, with percentages', async () => {
    const css = `:host {
      background: color-mix(in srgb, var(--ui-color-accent) 88%, var(--ui-color-ink));
      background: color-mix(in srgb, currentColor 13%, transparent);
    }`;
    expect(await problems(css)).toEqual([]);
  });

  it('refuses a raw colour inside color-mix()', async () => {
    const found = await problems(':host { background: color-mix(in srgb, #ff0000 50%, white); }');
    expect(found).toEqual([
      expect.stringContaining('"#ff0000 50%"'),
      expect.stringContaining('"white"'),
    ]);
  });
});
