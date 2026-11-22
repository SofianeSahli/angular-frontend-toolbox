// WCAG 2.1 contrast checker for themes (spec 002, REQ-7.3 – REQ-7.5).
// Self-contained (no relative imports) so that Node 24 and Vitest both load it as is.

export type PairKind = 'text' | 'large' | 'ui';
export type Theme = 'light' | 'dark';

/** WCAG AA: 4.5:1 for text; 3:1 for large text (24px+), control borders, focus rings and icons. */
export const THRESHOLDS: Readonly<Record<PairKind, number>> = { text: 4.5, large: 3, ui: 3 };

export interface ContrastPair {
  fg: string;
  bg: string;
  kind: PairKind;
}

export interface ContrastFailure extends ContrastPair {
  theme: Theme;
  ratio: number;
  required: number;
}

type Colors = Record<string, { light: string; dark: string }>;

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const ALIAS = /^\{([a-z0-9-]+)\}$/;

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  if (!HEX.test(hex)) throw new Error(`"${hex}" is not an opaque #rgb or #rrggbb colour`);
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(h.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function resolve(colors: Colors, token: string, theme: Theme): string {
  const seen: string[] = [];
  let name = token;
  for (;;) {
    const entry = colors[name];
    if (!entry) throw new Error(`Contrast pair: unknown token "${name}"`);
    if (seen.includes(name)) throw new Error(`Contrast pair: alias cycle at "${name}"`);
    seen.push(name);
    const alias = ALIAS.exec(entry[theme]);
    if (!alias) return entry[theme];
    name = alias[1];
  }
}

export function parsePairs(json: unknown): ContrastPair[] {
  const root = json as { pairs?: unknown };
  if (typeof json !== 'object' || json === null || !Array.isArray(root.pairs)) {
    throw new Error('contrast-pairs.json must be an object with a "pairs" array');
  }
  return root.pairs.map((p: unknown, i: number) => {
    const o = p as Partial<ContrastPair>;
    if (typeof o?.fg !== 'string' || typeof o?.bg !== 'string' || !(o.kind === 'text' || o.kind === 'large' || o.kind === 'ui')) {
      throw new Error(`contrast-pairs.json pairs[${i}] must be { fg, bg, kind: "text" | "large" | "ui" }`);
    }
    return { fg: o.fg, bg: o.bg, kind: o.kind };
  });
}

/** Every declared pair, in both themes; returns the pairs below their threshold. */
export function checkContrast(colors: Colors, pairs: ContrastPair[]): ContrastFailure[] {
  const failures: ContrastFailure[] = [];
  for (const pair of pairs) {
    for (const theme of ['light', 'dark'] as const) {
      const ratio = contrastRatio(resolve(colors, pair.fg, theme), resolve(colors, pair.bg, theme));
      const required = THRESHOLDS[pair.kind];
      if (ratio < required) failures.push({ ...pair, theme, ratio, required });
    }
  }
  return failures;
}

export function describeFailure(f: ContrastFailure): string {
  return `${f.fg} on ${f.bg} (${f.kind}, ${f.theme}): ${f.ratio.toFixed(2)}:1, needs ${f.required}:1`;
}
