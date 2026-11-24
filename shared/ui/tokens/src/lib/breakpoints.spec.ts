import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BREAKPOINTS, mediaQueryDown, mediaQueryUp } from './breakpoints';

const scss = readFileSync(resolve(import.meta.dirname, '../styles/_breakpoints.scss'), 'utf8');

function scssPixels(name: string): number {
  const match = new RegExp(`\\$breakpoints-${name}:\\s*(\\d+)px;`).exec(scss);
  if (!match) throw new Error(`$breakpoints-${name} not found`);
  return Number(match[1]);
}

describe('breakpoints', () => {
  it.each(Object.keys(BREAKPOINTS) as (keyof typeof BREAKPOINTS)[])('keeps %s identical in TypeScript and SCSS', (name) => {
    expect(BREAKPOINTS[name]).toBe(scssPixels(name));
  });

  it('builds the same media queries as the SCSS mixins', () => {
    expect(mediaQueryDown('medium')).toBe('(max-width: 819.98px)');
    expect(mediaQueryUp('wide')).toBe('(min-width: 1100px)');
  });
});
