// Theme compiler (spec 002, US-3): tokens.json (Olivier format) -> CSS + a theme descriptor.
// Pure functions only; the CLI (cli.ts) does the file I/O. Erasable TypeScript only, so that
// Node 24 runs it directly.

export class TokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenError';
  }
}

export type ThemeId = 'light' | 'dark';
export const THEME_IDS: readonly ThemeId[] = ['light', 'dark'];

export interface ColorValue {
  light: string;
  dark: string;
}

export interface DefaultToken {
  name: string;
  value: string;
}

export interface Contract {
  required: { color: string[]; font: string[] };
  defaults: DefaultToken[];
}

export interface ThemeDescriptor {
  name: string;
  accents: string[];
  defaultAccent: string | null;
}

export interface CompiledTheme {
  slug: string;
  css: string;
  ts: string;
  descriptor: ThemeDescriptor;
  /** Colour tokens by name, values as written (hex or `{alias}`). */
  colors: Record<string, ColorValue>;
}

const HEADER_THEME = '/* Generated from tokens.json by the theme compiler. Do not edit. */';
const HEADER_DEFAULTS = '/* Generated from contract.json by the theme compiler. Do not edit. */';

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const ALIAS = /^\{([a-z0-9-]+)\}$/;
const LENGTH = /^(?:0|-?\d*\.?\d+(?:px|rem|em|%))$/;
const UNITLESS = /^\d*\.?\d+$/;
const DURATION = /^\d*\.?\d+(?:ms|s)$/;
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UNSAFE = /[;{}<>\\\n\r]/;

// ---------- small parsing helpers ----------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function obj(v: unknown, where: string): Record<string, unknown> {
  if (!isObject(v)) throw new TokenError(`${where} must be an object`);
  return v;
}

function arr(v: unknown, where: string): unknown[] {
  if (!Array.isArray(v)) throw new TokenError(`${where} must be an array`);
  return v;
}

function str(v: unknown, where: string): string {
  if (typeof v !== 'string' || v.trim() === '') throw new TokenError(`${where} must be a non-empty string`);
  return v;
}

function tokenName(v: unknown, where: string): string {
  const name = str(v, where);
  if (!NAME.test(name)) throw new TokenError(`Token "${name}": invalid name (lowercase letters, digits and dashes)`);
  return name;
}

function safe(value: string, token: string): string {
  if (UNSAFE.test(value)) throw new TokenError(`Token "${token}": value "${value}" is not allowed`);
  return value;
}

function checkLength(value: unknown, token: string, allowUnitless = false): string {
  const v = str(value, `Token "${token}"`);
  if (!(LENGTH.test(v) || (allowUnitless && UNITLESS.test(v)))) {
    throw new TokenError(`Token "${token}": value "${v}" is not allowed (expected a length)`);
  }
  return v;
}

function checkDefaultValue(name: string, value: unknown): string {
  const v = str(value, `Token "${name}"`);
  if (name.startsWith('duration-')) {
    if (!DURATION.test(v)) throw new TokenError(`Token "${name}": value "${v}" is not allowed (expected a duration)`);
    return v;
  }
  if (name.startsWith('easing-')) return safe(v, name);
  return checkLength(v, name);
}

export function toRgbTriplet(hex: string): string {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
  return `${n(0)}, ${n(2)}, ${n(4)}`;
}

function slugOf(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug) throw new TokenError('The theme "name" must contain letters or digits');
  return slug;
}

function camel(slug: string): string {
  return slug.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

function block(selector: string, lines: string[], indent = '  '): string {
  return `${indent}${selector} {\n${lines.map((l) => `${indent}  ${l}`).join('\n')}\n${indent}}`;
}

// ---------- contract ----------

export function parseContract(json: unknown): Contract {
  const root = obj(json, 'contract.json');
  const required = obj(root['required'], 'contract.required');
  const color = arr(required['color'], 'contract.required.color').map((n, i) => tokenName(n, `required.color[${i}]`));
  const font = arr(required['font'], 'contract.required.font').map((n, i) => tokenName(n, `required.font[${i}]`));
  const seen = new Set<string>();
  const defaults = arr(root['defaults'], 'contract.defaults').map((d, i) => {
    const o = obj(d, `contract.defaults[${i}]`);
    const name = tokenName(o['name'], `contract.defaults[${i}].name`);
    if (seen.has(name)) throw new TokenError(`Token "${name}" is defined twice`);
    seen.add(name);
    return { name, value: checkDefaultValue(name, o['value']) };
  });
  return { required: { color, font }, defaults };
}

function reducedMotion(lines: string[]): string {
  return `  @media (prefers-reduced-motion: reduce) {\n${block(':root', lines, '    ')}\n  }`;
}

/** The brand-free defaults (REQ-1.2) and their reduced-motion values (REQ-1.3). */
export function compileDefaults(contract: Contract): string {
  const root = contract.defaults.map((d) => `--ui-${d.name}: ${d.value};`);
  const motion = contract.defaults.filter((d) => d.name.startsWith('duration-')).map((d) => `--ui-${d.name}: 0ms;`);
  const parts = [block(':root', root)];
  if (motion.length) parts.push(reducedMotion(motion));
  return `${HEADER_DEFAULTS}\n@layer tokens {\n${parts.join('\n\n')}\n}\n`;
}

// ---------- theme ----------

export function compileTheme(json: unknown, contract: Contract): CompiledTheme {
  const root = obj(json, 'tokens.json');
  const name = str(root['name'], 'tokens.json "name"');
  const slug = slugOf(name);

  // Themes: exactly light and dark.
  const colorSection = obj(root['color'], 'tokens.json "color"');
  const themeIds = arr(colorSection['themes'], 'color.themes').map((t, i) => str(obj(t, `color.themes[${i}]`)['id'], `color.themes[${i}].id`));
  if (themeIds.length !== 2 || !THEME_IDS.every((id) => themeIds.includes(id))) {
    throw new TokenError(`color.themes must be exactly "light" and "dark" (found: ${themeIds.join(', ') || 'none'})`);
  }

  const emitted = new Set<string>();
  const claim = (cssVar: string, token: string) => {
    if (emitted.has(cssVar)) throw new TokenError(`Token "${token}" is defined twice`);
    emitted.add(cssVar);
  };

  // Colours.
  const colors: Record<string, ColorValue> = {};
  for (const [i, raw] of arr(colorSection['tokens'], 'color.tokens').entries()) {
    const t = obj(raw, `color.tokens[${i}]`);
    const tName = tokenName(t['name'], `color.tokens[${i}].name`);
    claim(`--ui-color-${tName}`, tName);
    const value = obj(t['value'], `Token "${tName}" value`);
    const entry = {} as ColorValue;
    for (const id of THEME_IDS) {
      const v = value[id];
      if (v === undefined) throw new TokenError(`Token "${tName}" has no value for theme "${id}"`);
      const s = str(v, `Token "${tName}" (${id})`);
      if (!HEX.test(s) && !ALIAS.test(s)) throw new TokenError(`Token "${tName}": value "${s}" is not allowed (expected #rrggbb or {alias})`);
      entry[id] = s;
    }
    colors[tName] = entry;
  }
  for (const [tName, v] of Object.entries(colors)) {
    for (const id of THEME_IDS) resolveAlias(colors, tName, id, v[id]);
  }

  // Families and type styles.
  const families: Record<string, string> = {};
  const textLines: string[] = [];
  if (root['type'] !== undefined) {
    const type = obj(root['type'], 'tokens.json "type"');
    for (const [fName, fValue] of Object.entries(obj(type['families'] ?? {}, 'type.families'))) {
      tokenName(fName, 'type.families');
      claim(`--ui-font-${fName}`, fName);
      families[fName] = safe(str(fValue, `Font family "${fName}"`), fName);
    }
    for (const [gi, g] of arr(type['groups'] ?? [], 'type.groups').entries()) {
      const group = obj(g, `type.groups[${gi}]`);
      const family = str(group['family'], `type.groups[${gi}].family`);
      if (!(family in families)) throw new TokenError(`Type group "${String(group['name'])}": unknown family "${family}"`);
      for (const [si, s] of arr(group['styles'], `type.groups[${gi}].styles`).entries()) {
        const style = obj(s, `type.groups[${gi}].styles[${si}]`);
        const sName = tokenName(style['name'], `type style name`);
        claim(`--ui-text-${sName}-size`, sName);
        const weight = style['fontWeight'];
        if (typeof weight !== 'number' || !Number.isInteger(weight) || weight < 1 || weight > 1000) {
          throw new TokenError(`Token "${sName}": fontWeight must be an integer from 1 to 1000`);
        }
        textLines.push(`--ui-text-${sName}-size: ${checkLength(style['fontSize'], sName)};`);
        textLines.push(`--ui-text-${sName}-line-height: ${checkLength(style['lineHeight'], sName, true)};`);
        textLines.push(`--ui-text-${sName}-weight: ${weight};`);
        if (style['letterSpacing'] !== undefined) {
          textLines.push(`--ui-text-${sName}-tracking: ${checkLength(style['letterSpacing'], sName)};`);
        }
      }
    }
  }

  // Required tokens (REQ-1.1, REQ-3.3).
  for (const req of contract.required.color) {
    if (!(req in colors)) throw new TokenError(`Token "${req}" is required by the contract and missing`);
  }
  for (const req of contract.required.font) {
    if (!(req in families)) throw new TokenError(`Font family "${req}" is required by the contract and missing`);
  }

  // Spacing, radius, shadow: simple lists.
  const simpleLines: string[] = [];
  for (const section of ['spacing', 'radius', 'shadow'] as const) {
    if (root[section] === undefined) continue;
    for (const [i, raw] of arr(obj(root[section], section)['tokens'], `${section}.tokens`).entries()) {
      const t = obj(raw, `${section}.tokens[${i}]`);
      const tName = tokenName(t['name'], `${section}.tokens[${i}].name`);
      claim(`--ui-${tName}`, tName);
      const v = section === 'shadow' ? safe(str(t['value'], `Token "${tName}"`), tName) : checkLength(t['value'], tName);
      simpleLines.push(`--ui-${tName}: ${v};`);
    }
  }

  // Overrides of the contract defaults (theme may override).
  const known = new Set(contract.defaults.map((d) => d.name));
  const overrideLines: string[] = [];
  const motionLines: string[] = [];
  if (root['overrides'] !== undefined) {
    for (const [i, raw] of arr(obj(root['overrides'], 'overrides')['tokens'], 'overrides.tokens').entries()) {
      const t = obj(raw, `overrides.tokens[${i}]`);
      const tName = tokenName(t['name'], `overrides.tokens[${i}].name`);
      if (!known.has(tName)) throw new TokenError(`Token "${tName}": not a default of the contract, so it cannot be overridden`);
      claim(`--ui-${tName}`, tName);
      overrideLines.push(`--ui-${tName}: ${checkDefaultValue(tName, t['value'])};`);
      if (tName.startsWith('duration-')) motionLines.push(`--ui-${tName}: 0ms;`);
    }
  }

  // Accents (REQ-2.3, REQ-5.7).
  const accents = Object.keys(colors)
    .filter((n) => n.startsWith('accent-') && !n.endsWith('-soft'))
    .map((n) => n.slice('accent-'.length));
  const accentAlias = colors['accent'] ? ALIAS.exec(colors['accent'].light) : null;
  const defaultAccent =
    accentAlias && accentAlias[1].startsWith('accent-') && accents.includes(accentAlias[1].slice(7)) ? accentAlias[1].slice(7) : null;

  // CSS.
  const colorLines = (id: ThemeId) =>
    Object.entries(colors).flatMap(([n, v]) => {
      const alias = ALIAS.exec(v[id]);
      return alias
        ? [`--ui-color-${n}: var(--ui-color-${alias[1]});`, `--ui-color-${n}-rgb: var(--ui-color-${alias[1]}-rgb);`]
        : [`--ui-color-${n}: ${v[id]};`, `--ui-color-${n}-rgb: ${toRgbTriplet(v[id])};`];
    });
  const fontLines = Object.entries(families).map(([n, v]) => `--ui-font-${n}: ${v};`);

  const parts = [
    block(":root,\n  [data-theme='light']", [...colorLines('light'), ...fontLines, ...textLines, ...simpleLines, ...overrideLines]),
    block("[data-theme='dark']", colorLines('dark')),
  ];
  for (const a of accents) {
    const lines = [`--ui-color-accent: var(--ui-color-accent-${a});`, `--ui-color-accent-rgb: var(--ui-color-accent-${a}-rgb);`];
    if (colors[`accent-${a}-soft`]) {
      lines.push(`--ui-color-accent-soft: var(--ui-color-accent-${a}-soft);`, `--ui-color-accent-soft-rgb: var(--ui-color-accent-${a}-soft-rgb);`);
    }
    parts.push(block(`[data-accent='${a}']`, lines));
  }
  if (motionLines.length) parts.push(reducedMotion(motionLines));
  if (families['arabic']) parts.push(block(':lang(ar)', ['font-family: var(--ui-font-arabic);']));
  const css = `${HEADER_THEME}\n@layer tokens {\n${parts.join('\n\n')}\n}\n`;

  const descriptor: ThemeDescriptor = { name: slug, accents, defaultAccent };
  const ts =
    `// Generated from tokens.json by the theme compiler. Do not edit.\n` +
    `export const ${camel(slug)}Theme = {\n` +
    `  name: '${slug}',\n` +
    `  accents: [${accents.map((a) => `'${a}'`).join(', ')}],\n` +
    `  defaultAccent: ${defaultAccent === null ? 'null' : `'${defaultAccent}'`},\n` +
    `} as const;\n`;

  return { slug, css, ts, descriptor, colors };
}

/** Follows `{alias}` chains to a hex value; throws on an unknown alias or a cycle. */
export function resolveAlias(colors: Record<string, ColorValue>, token: string, theme: ThemeId, value?: string): string {
  const seen = [token];
  let current = value ?? colors[token]?.[theme];
  if (current === undefined) throw new TokenError(`Token "${token}" does not exist`);
  for (;;) {
    const alias = ALIAS.exec(current);
    if (!alias) return current;
    const target = alias[1];
    if (!(target in colors)) throw new TokenError(`Token "${seen[seen.length - 1]}": unknown alias "{${target}}"`);
    if (seen.includes(target)) throw new TokenError(`Token "${token}": alias cycle ${[...seen, target].join(' -> ')}`);
    seen.push(target);
    current = colors[target][theme];
  }
}
