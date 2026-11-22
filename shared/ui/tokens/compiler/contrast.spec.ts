import { checkContrast, contrastRatio, describeFailure, parsePairs } from './contrast';

describe('contrast checker (REQ-7.3, REQ-7.4)', () => {
  it('computes WCAG ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
  });

  it('refuses colours with alpha', () => {
    expect(() => contrastRatio('#00000080', '#FFFFFF')).toThrow('not an opaque');
  });

  const colors = {
    bg: { light: '#FFFFFF', dark: '#000000' },
    ink: { light: '#000000', dark: '#FFFFFF' },
    grey: { light: '#777777', dark: '#888888' },
    accent: { light: '{grey}', dark: '{grey}' },
  };

  it('passes pairs above their threshold in both themes', () => {
    expect(checkContrast(colors, [{ fg: 'ink', bg: 'bg', kind: 'text' }])).toEqual([]);
  });

  it('applies 4.5:1 to text and 3:1 to large text and controls, resolving aliases', () => {
    const failures = checkContrast(colors, [
      { fg: 'accent', bg: 'bg', kind: 'text' },
      { fg: 'accent', bg: 'bg', kind: 'ui' },
      { fg: 'accent', bg: 'bg', kind: 'large' },
    ]);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({ fg: 'accent', bg: 'bg', kind: 'text', theme: 'light', required: 4.5 });
    expect(describeFailure(failures[0])).toBe('accent on bg (text, light): 4.48:1, needs 4.5:1');
  });

  it('fails on an unknown token in a pair', () => {
    expect(() => checkContrast(colors, [{ fg: 'nope', bg: 'bg', kind: 'text' }])).toThrow('unknown token "nope"');
  });

  it('validates the pairs file', () => {
    expect(parsePairs({ pairs: [{ fg: 'ink', bg: 'bg', kind: 'ui' }] })).toEqual([{ fg: 'ink', bg: 'bg', kind: 'ui' }]);
    expect(() => parsePairs({ pairs: [{ fg: 'ink', bg: 'bg', kind: 'huge' }] })).toThrow('pairs[0]');
    expect(() => parsePairs([])).toThrow('"pairs" array');
  });
});
