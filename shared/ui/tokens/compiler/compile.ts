// Node runs the compiler directly, so this file uses erasable TypeScript only.

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
  colorsAsWritten: Record<string, ColorValue>;
}

type Json = Record<string, unknown>;

const THEME_HEADER = '/* Generated from tokens.json by the theme compiler. Do not edit. */';
const DEFAULTS_HEADER = '/* Generated from contract.json by the theme compiler. Do not edit. */';

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const ALIAS = /^\{([a-z0-9-]+)\}$/;
const LENGTH = /^(?:0|-?\d*\.?\d+(?:px|rem|em|%))$/;
const UNITLESS_NUMBER = /^\d*\.?\d+$/;
const DURATION = /^\d*\.?\d+(?:ms|s)$/;
const TOKEN_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CSS_INJECTION_CHARACTERS = /[;{}<>\\\n\r]/;
const ACCENT_PREFIX = 'accent-';
const SOFT_SUFFIX = '-soft';
const SIMPLE_SECTIONS = ['spacing', 'radius', 'shadow'] as const;

function isJsonObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asObject(value: unknown, where: string): Json {
  if (!isJsonObject(value)) throw new TokenError(`${where} must be an object`);
  return value;
}

function asArray(value: unknown, where: string): unknown[] {
  if (!Array.isArray(value)) throw new TokenError(`${where} must be an array`);
  return value;
}

function asString(value: unknown, where: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new TokenError(`${where} must be a non-empty string`);
  return value;
}

function asTokenName(value: unknown, where: string): string {
  const name = asString(value, where);
  if (!TOKEN_NAME.test(name)) throw new TokenError(`Token "${name}": invalid name (lowercase letters, digits and dashes)`);
  return name;
}

function refuseCssInjection(value: string, token: string): string {
  if (CSS_INJECTION_CHARACTERS.test(value)) throw new TokenError(`Token "${token}": value "${value}" is not allowed`);
  return value;
}

function asLength(value: unknown, token: string, allowUnitless = false): string {
  const length = asString(value, `Token "${token}"`);
  if (!(LENGTH.test(length) || (allowUnitless && UNITLESS_NUMBER.test(length)))) {
    throw new TokenError(`Token "${token}": value "${length}" is not allowed (expected a length)`);
  }
  return length;
}

function isDuration(name: string): boolean {
  return name.startsWith('duration-');
}

function asDefaultValue(name: string, value: unknown): string {
  const text = asString(value, `Token "${name}"`);
  if (isDuration(name)) {
    if (!DURATION.test(text)) throw new TokenError(`Token "${name}": value "${text}" is not allowed (expected a duration)`);
    return text;
  }
  if (name.startsWith('easing-')) return refuseCssInjection(text, name);
  return asLength(text, name);
}

export function toRgbTriplet(hex: string): string {
  let digits = hex.slice(1);
  if (digits.length === 3) digits = digits.split('').map((c) => c + c).join('');
  const channel = (offset: number) => parseInt(digits.slice(offset, offset + 2), 16);
  return `${channel(0)}, ${channel(2)}, ${channel(4)}`;
}

function toSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug) throw new TokenError('The theme "name" must contain letters or digits');
  return slug;
}

function toCamelCase(slug: string): string {
  return slug.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

function cssRule(selector: string, declarations: string[], indent = '  '): string {
  return `${indent}${selector} {\n${declarations.map((d) => `${indent}  ${d}`).join('\n')}\n${indent}}`;
}

function reducedMotionRule(declarations: string[]): string {
  return `  @media (prefers-reduced-motion: reduce) {\n${cssRule(':root', declarations, '    ')}\n  }`;
}

function inTokensLayer(header: string, rules: string[]): string {
  return `${header}\n@layer tokens {\n${rules.join('\n\n')}\n}\n`;
}

const zeroDuration = (name: string) => `--ui-${name}: 0ms;`;

export function parseContract(json: unknown): Contract {
  const root = asObject(json, 'contract.json');
  const required = asObject(root['required'], 'contract.required');
  const color = asArray(required['color'], 'contract.required.color').map((n, i) => asTokenName(n, `required.color[${i}]`));
  const font = asArray(required['font'], 'contract.required.font').map((n, i) => asTokenName(n, `required.font[${i}]`));
  const seen = new Set<string>();
  const defaults = asArray(root['defaults'], 'contract.defaults').map((entry, i) => {
    const token = asObject(entry, `contract.defaults[${i}]`);
    const name = asTokenName(token['name'], `contract.defaults[${i}].name`);
    if (seen.has(name)) throw new TokenError(`Token "${name}" is defined twice`);
    seen.add(name);
    return { name, value: asDefaultValue(name, token['value']) };
  });
  return { required: { color, font }, defaults };
}

export function compileDefaults(contract: Contract): string {
  const rules = [cssRule(':root', contract.defaults.map((d) => `--ui-${d.name}: ${d.value};`))];
  const durations = contract.defaults.filter((d) => isDuration(d.name));
  if (durations.length) rules.push(reducedMotionRule(durations.map((d) => zeroDuration(d.name))));
  return inTokensLayer(DEFAULTS_HEADER, rules);
}

class CssVariableRegistry {
  private readonly names = new Set<string>();

  claim(cssVariable: string, token: string): void {
    if (this.names.has(cssVariable)) throw new TokenError(`Token "${token}" is defined twice`);
    this.names.add(cssVariable);
  }
}

function assertLightAndDarkThemes(colorSection: Json): void {
  const ids = asArray(colorSection['themes'], 'color.themes').map((t, i) => asString(asObject(t, `color.themes[${i}]`)['id'], `color.themes[${i}].id`));
  if (ids.length !== THEME_IDS.length || !THEME_IDS.every((id) => ids.includes(id))) {
    throw new TokenError(`color.themes must be exactly "light" and "dark" (found: ${ids.join(', ') || 'none'})`);
  }
}

function parseColors(colorSection: Json, registry: CssVariableRegistry): Record<string, ColorValue> {
  const colors: Record<string, ColorValue> = {};
  for (const [i, entry] of asArray(colorSection['tokens'], 'color.tokens').entries()) {
    const token = asObject(entry, `color.tokens[${i}]`);
    const name = asTokenName(token['name'], `color.tokens[${i}].name`);
    registry.claim(`--ui-color-${name}`, name);
    const valuesByTheme = asObject(token['value'], `Token "${name}" value`);
    const color = {} as ColorValue;
    for (const id of THEME_IDS) {
      if (valuesByTheme[id] === undefined) throw new TokenError(`Token "${name}" has no value for theme "${id}"`);
      const value = asString(valuesByTheme[id], `Token "${name}" (${id})`);
      if (!HEX_COLOR.test(value) && !ALIAS.test(value)) {
        throw new TokenError(`Token "${name}": value "${value}" is not allowed (expected #rrggbb or {alias})`);
      }
      color[id] = value;
    }
    colors[name] = color;
  }
  for (const [name, color] of Object.entries(colors)) {
    for (const id of THEME_IDS) resolveAlias(colors, name, id, color[id]);
  }
  return colors;
}

function parseFamilies(type: Json, registry: CssVariableRegistry): Record<string, string> {
  const families: Record<string, string> = {};
  for (const [name, stack] of Object.entries(asObject(type['families'] ?? {}, 'type.families'))) {
    asTokenName(name, 'type.families');
    registry.claim(`--ui-font-${name}`, name);
    families[name] = refuseCssInjection(asString(stack, `Font family "${name}"`), name);
  }
  return families;
}

function asFontWeight(value: unknown, token: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 1000) {
    throw new TokenError(`Token "${token}": fontWeight must be an integer from 1 to 1000`);
  }
  return value;
}

function textStyleDeclarations(type: Json, families: Record<string, string>, registry: CssVariableRegistry): string[] {
  const declarations: string[] = [];
  for (const [gi, entry] of asArray(type['groups'] ?? [], 'type.groups').entries()) {
    const group = asObject(entry, `type.groups[${gi}]`);
    const family = asString(group['family'], `type.groups[${gi}].family`);
    if (!(family in families)) throw new TokenError(`Type group "${String(group['name'])}": unknown family "${family}"`);
    for (const [si, styleEntry] of asArray(group['styles'], `type.groups[${gi}].styles`).entries()) {
      const style = asObject(styleEntry, `type.groups[${gi}].styles[${si}]`);
      const name = asTokenName(style['name'], 'type style name');
      const prefix = `--ui-text-${name}`;
      registry.claim(`${prefix}-size`, name);
      declarations.push(
        `${prefix}-size: ${asLength(style['fontSize'], name)};`,
        `${prefix}-line-height: ${asLength(style['lineHeight'], name, true)};`,
        `${prefix}-weight: ${asFontWeight(style['fontWeight'], name)};`,
      );
      if (style['letterSpacing'] !== undefined) declarations.push(`${prefix}-tracking: ${asLength(style['letterSpacing'], name)};`);
    }
  }
  return declarations;
}

function assertContractSatisfied(contract: Contract, colors: Record<string, ColorValue>, families: Record<string, string>): void {
  for (const name of contract.required.color) {
    if (!(name in colors)) throw new TokenError(`Token "${name}" is required by the contract and missing`);
  }
  for (const name of contract.required.font) {
    if (!(name in families)) throw new TokenError(`Font family "${name}" is required by the contract and missing`);
  }
}

function simpleSectionDeclarations(root: Json, registry: CssVariableRegistry): string[] {
  const declarations: string[] = [];
  for (const section of SIMPLE_SECTIONS) {
    if (root[section] === undefined) continue;
    for (const [i, entry] of asArray(asObject(root[section], section)['tokens'], `${section}.tokens`).entries()) {
      const token = asObject(entry, `${section}.tokens[${i}]`);
      const name = asTokenName(token['name'], `${section}.tokens[${i}].name`);
      registry.claim(`--ui-${name}`, name);
      const value = section === 'shadow' ? refuseCssInjection(asString(token['value'], `Token "${name}"`), name) : asLength(token['value'], name);
      declarations.push(`--ui-${name}: ${value};`);
    }
  }
  return declarations;
}

function parseDefaultOverrides(root: Json, contract: Contract, registry: CssVariableRegistry): DefaultToken[] {
  if (root['overrides'] === undefined) return [];
  const defaultNames = new Set(contract.defaults.map((d) => d.name));
  return asArray(asObject(root['overrides'], 'overrides')['tokens'], 'overrides.tokens').map((entry, i) => {
    const token = asObject(entry, `overrides.tokens[${i}]`);
    const name = asTokenName(token['name'], `overrides.tokens[${i}].name`);
    if (!defaultNames.has(name)) throw new TokenError(`Token "${name}": not a default of the contract, so it cannot be overridden`);
    registry.claim(`--ui-${name}`, name);
    return { name, value: asDefaultValue(name, token['value']) };
  });
}

function findAccents(colors: Record<string, ColorValue>): string[] {
  return Object.keys(colors)
    .filter((name) => name.startsWith(ACCENT_PREFIX) && !name.endsWith(SOFT_SUFFIX))
    .map((name) => name.slice(ACCENT_PREFIX.length));
}

function findDefaultAccent(colors: Record<string, ColorValue>, accents: string[]): string | null {
  const alias = colors['accent'] ? ALIAS.exec(colors['accent'].light) : null;
  if (!alias || !alias[1].startsWith(ACCENT_PREFIX)) return null;
  const accent = alias[1].slice(ACCENT_PREFIX.length);
  return accents.includes(accent) ? accent : null;
}

function colorDeclarations(colors: Record<string, ColorValue>, theme: ThemeId): string[] {
  return Object.entries(colors).flatMap(([name, color]) => {
    const alias = ALIAS.exec(color[theme]);
    return alias
      ? [`--ui-color-${name}: var(--ui-color-${alias[1]});`, `--ui-color-${name}-rgb: var(--ui-color-${alias[1]}-rgb);`]
      : [`--ui-color-${name}: ${color[theme]};`, `--ui-color-${name}-rgb: ${toRgbTriplet(color[theme])};`];
  });
}

function accentRule(accent: string, colors: Record<string, ColorValue>): string {
  const source = `--ui-color-${ACCENT_PREFIX}${accent}`;
  const declarations = [`--ui-color-accent: var(${source});`, `--ui-color-accent-rgb: var(${source}-rgb);`];
  if (colors[`${ACCENT_PREFIX}${accent}${SOFT_SUFFIX}`]) {
    declarations.push(`--ui-color-accent-soft: var(${source}${SOFT_SUFFIX});`, `--ui-color-accent-soft-rgb: var(${source}${SOFT_SUFFIX}-rgb);`);
  }
  return cssRule(`[data-accent='${accent}']`, declarations);
}

function descriptorModule(slug: string, descriptor: ThemeDescriptor): string {
  const defaultAccent = descriptor.defaultAccent === null ? 'null' : `'${descriptor.defaultAccent}'`;
  return (
    `// Generated from tokens.json by the theme compiler. Do not edit.\n` +
    `export const ${toCamelCase(slug)}Theme = {\n` +
    `  name: '${slug}',\n` +
    `  accents: [${descriptor.accents.map((a) => `'${a}'`).join(', ')}],\n` +
    `  defaultAccent: ${defaultAccent},\n` +
    `} as const;\n`
  );
}

export function compileTheme(json: unknown, contract: Contract): CompiledTheme {
  const root = asObject(json, 'tokens.json');
  const slug = toSlug(asString(root['name'], 'tokens.json "name"'));
  const registry = new CssVariableRegistry();

  const colorSection = asObject(root['color'], 'tokens.json "color"');
  assertLightAndDarkThemes(colorSection);
  const colors = parseColors(colorSection, registry);

  const type = root['type'] === undefined ? {} : asObject(root['type'], 'tokens.json "type"');
  const families = parseFamilies(type, registry);
  const textStyles = textStyleDeclarations(type, families, registry);
  assertContractSatisfied(contract, colors, families);

  const simpleTokens = simpleSectionDeclarations(root, registry);
  const overrides = parseDefaultOverrides(root, contract, registry);
  const accents = findAccents(colors);
  const descriptor: ThemeDescriptor = { name: slug, accents, defaultAccent: findDefaultAccent(colors, accents) };

  const rules = [
    cssRule(":root,\n  [data-theme='light']", [
      ...colorDeclarations(colors, 'light'),
      ...Object.entries(families).map(([name, stack]) => `--ui-font-${name}: ${stack};`),
      ...textStyles,
      ...simpleTokens,
      ...overrides.map((o) => `--ui-${o.name}: ${o.value};`),
    ]),
    cssRule("[data-theme='dark']", colorDeclarations(colors, 'dark')),
    ...accents.map((accent) => accentRule(accent, colors)),
  ];
  const overriddenDurations = overrides.filter((o) => isDuration(o.name));
  if (overriddenDurations.length) rules.push(reducedMotionRule(overriddenDurations.map((o) => zeroDuration(o.name))));
  if (families['arabic']) rules.push(cssRule(':lang(ar)', ['font-family: var(--ui-font-arabic);']));

  return { slug, css: inTokensLayer(THEME_HEADER, rules), ts: descriptorModule(slug, descriptor), descriptor, colorsAsWritten: colors };
}

export function resolveAlias(colors: Record<string, ColorValue>, token: string, theme: ThemeId, value?: string): string {
  const chain = [token];
  let current = value ?? colors[token]?.[theme];
  if (current === undefined) throw new TokenError(`Token "${token}" does not exist`);
  for (;;) {
    const alias = ALIAS.exec(current);
    if (!alias) return current;
    const target = alias[1];
    if (!(target in colors)) throw new TokenError(`Token "${chain[chain.length - 1]}": unknown alias "{${target}}"`);
    if (chain.includes(target)) throw new TokenError(`Token "${token}": alias cycle ${[...chain, target].join(' -> ')}`);
    chain.push(target);
    current = colors[target][theme];
  }
}
