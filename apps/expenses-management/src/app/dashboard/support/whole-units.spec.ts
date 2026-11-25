import { formatMinor } from '@shared/util-format';
import { formatWhole, perDayUnits, wholeUnits } from './whole-units';

describe('whole units (spec 008 REQ-2.1, 2.2, 8.7)', () => {
  it.each([
    [47999, 3, 47],
    [1999, 2, 19],
    [1500, 0, 1500],
    [999, 3, 0],
  ])('floors %d with exponent %d to %d units', (minor, exponent, units) => {
    expect(wholeUnits(minor, exponent)).toBe(units);
  });

  it('formats rounded down, never up', () => {
    const tnd = { code: 'TND', exponent: 3 };
    expect(formatWhole(47999, tnd)).toBe(formatMinor(47000, tnd, { display: 'rounded' }));
    const eur = { code: 'EUR', exponent: 2 };
    expect(formatWhole(1999, eur)).toBe(formatMinor(1900, eur, { display: 'rounded' }));
    const jpy = { code: 'JPY', exponent: 0 };
    expect(formatWhole(1500, jpy)).toBe(formatMinor(1500, jpy, { display: 'rounded' }));
  });

  it('divides the remainder by the days left and floors to units', () => {
    expect(perDayUnits(47500, 6, 3)).toBe(7);
    expect(perDayUnits(5000, 6, 3)).toBe(0);
  });

  it('has no per-day amount without days left or remainder', () => {
    expect(perDayUnits(47500, null, 3)).toBeNull();
    expect(perDayUnits(0, 6, 3)).toBeNull();
    expect(perDayUnits(null, 6, 3)).toBeNull();
  });
});
