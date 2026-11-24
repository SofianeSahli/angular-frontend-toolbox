import { basename } from 'node:path';
import stylelint from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages },
} = stylelint;

export const LENGTHS_RULE = 'ui/lengths-only-in-component-tokens';
export const COLOR_MIX_RULE = 'ui/color-mix-tokens-only';

const RAW_LENGTH = /(?<![\w.#-])-?\d*\.?\d+(px|rem|em|pt|vh|vw|dvh|svh|lvh|dvw|svw|lvw|vmin|vmax|ch|ex)\b/;
const COLOR_MIX_START = /color-mix\(/gi;
const ALLOWED_COLOR = /^(var\(--ui-[a-z0-9-]+\)|currentcolor|transparent)$/i;
const PERCENTAGE = /^\d*\.?\d+%$/;

const lengthMessages = ruleMessages(LENGTHS_RULE, {
  rejected: (property, component) =>
    component
      ? `Raw length in "${property}": only --ui-${component}-* tokens in this file may hold one; read a var(--ui-*) token instead`
      : `Raw length in "${property}": read a var(--ui-*) token instead`,
});

const colorMixMessages = ruleMessages(COLOR_MIX_RULE, {
  rejected: (argument) => `color-mix() argument "${argument}" must be a var(--ui-*) token, currentColor or transparent`,
});

function componentOfFile(file) {
  if (!file) return null;
  return basename(file).replace(/\.(s?css)$/, '').replace(/^_/, '');
}

function splitTopLevelArguments(text) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const character of text) {
    if (character === '(') depth++;
    if (character === ')') depth--;
    if (character === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += character;
    }
  }
  parts.push(current.trim());
  return parts;
}

function balancedContentAfter(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === '(') depth++;
    if (text[i] === ')' && --depth === 0) return text.slice(openIndex + 1, i);
  }
  return text.slice(openIndex + 1);
}

function invalidColorMixArguments(value) {
  const invalid = [];
  for (const match of value.matchAll(COLOR_MIX_START)) {
    const content = balancedContentAfter(value, match.index + match[0].length - 1);
    const [, ...colors] = splitTopLevelArguments(content);
    for (const argument of colors) {
      if (/^color-mix\(/i.test(argument)) continue;
      const pieces = argument.split(/\s+/);
      if (!pieces.every((piece) => ALLOWED_COLOR.test(piece) || PERCENTAGE.test(piece))) invalid.push(argument);
    }
  }
  return invalid;
}

const lengthsOnlyInComponentTokens = createPlugin(LENGTHS_RULE, (enabled) => (root, result) => {
  if (!enabled) return;
  const component = componentOfFile(root.source?.input.file);
  root.walkDecls((declaration) => {
    if (!RAW_LENGTH.test(declaration.value)) return;
    if (component && declaration.prop.startsWith(`--ui-${component}-`)) return;
    if (component && declaration.prop.startsWith(`$${component}-`)) return;
    report({ ruleName: LENGTHS_RULE, result, node: declaration, message: lengthMessages.rejected(declaration.prop, component) });
  });
});

const colorMixTokensOnly = createPlugin(COLOR_MIX_RULE, (enabled) => (root, result) => {
  if (!enabled) return;
  root.walkDecls((declaration) => {
    for (const argument of invalidColorMixArguments(declaration.value)) {
      report({ ruleName: COLOR_MIX_RULE, result, node: declaration, message: colorMixMessages.rejected(argument) });
    }
  });
});

export default [lengthsOnlyInComponentTokens, colorMixTokensOnly];
