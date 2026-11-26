import { formatMinor } from '@shared/util-format';
import { TND } from '../../testing/render-part';
import { unitOf, withoutUnit } from './amounts';

const EUR = { code: 'EUR', exponent: 2 };

describe('amounts without unit', () => {
  it.each([TND, EUR])('drops only the unit of $code', (currency) => {
    expect(`${withoutUnit(1234500, currency)}\xa0${unitOf(currency)}`).toBe(formatMinor(1234500, currency));
    expect(withoutUnit(1234500, currency)).not.toContain(unitOf(currency));
  });

  it('keeps the sign', () => {
    expect(withoutUnit(54000, TND, { signed: true })).toBe('+54,000');
    expect(withoutUnit(0, TND, { signed: true })).toBe('0,000');
    expect(unitOf(TND)).toBe('DT');
  });
});
