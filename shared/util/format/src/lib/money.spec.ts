import { formatMillimes, formatMillimesHeadline, formatMinor, formatSignedMillimes, formatSignedMillimesHeadline, parseMajor } from './money';

const THOUSANDS_SEPARATOR = String.fromCharCode(0x202f);
const SPACE_BEFORE_CURRENCY = String.fromCharCode(0x00a0);
const dt = (s: string) =>
  s.replaceAll(' ', THOUSANDS_SEPARATOR).replace(new RegExp(`${THOUSANDS_SEPARATOR}DT$`), `${SPACE_BEFORE_CURRENCY}DT`);

describe('formatMillimes (REQ-6.2)', () => {
  it.each([
    [1234500, '1 234,500 DT'],
    [0, '0,000 DT'],
    [5, '0,005 DT'],
    [-1234500, '-1 234,500 DT'],
    [987654321012, '987 654 321,012 DT'],
  ])('%d → %s', (value, expected) => {
    expect(formatMillimes(value)).toBe(dt(expected));
  });
});

describe('formatMillimesHeadline (REQ-6.3)', () => {
  it.each([
    [1234500, '1 235 DT'],
    [1234499, '1 234 DT'],
    [-1234500, '-1 235 DT'],
    [0, '0 DT'],
  ])('%d → %s', (value, expected) => {
    expect(formatMillimesHeadline(value)).toBe(dt(expected));
  });
});

describe('formatSignedMillimes (REQ-6.4)', () => {
  it.each([
    [1234500, '+1 234,500 DT'],
    [-2000, '-2,000 DT'],
    [0, '0,000 DT'],
  ])('%d → %s', (value, expected) => {
    expect(formatSignedMillimes(value)).toBe(dt(expected));
  });
});

describe('formatSignedMillimesHeadline', () => {
  it.each([
    [1234500, '+1 235 DT'],
    [-2000, '-2 DT'],
    [0, '0 DT'],
  ])('%d → %s', (value, expected) => {
    expect(formatSignedMillimesHeadline(value)).toBe(dt(expected));
  });
});

describe('non-integer millimes (REQ-6.5)', () => {
  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53])('refuses %s instead of rounding', (value) => {
    expect(() => formatMillimes(value)).toThrow(RangeError);
    expect(() => formatMillimesHeadline(value)).toThrow(RangeError);
    expect(() => formatSignedMillimes(value)).toThrow(RangeError);
    expect(() => formatSignedMillimesHeadline(value)).toThrow(RangeError);
  });
});

const plain = (s: string) => s.replace(/[\u202F\u00A0]/g, ' ');

describe('formatMinor (spec 007 REQ-1.1)', () => {
  const TND = { code: 'TND', exponent: 3 };
  const EUR = { code: 'EUR', exponent: 2 };
  const JPY = { code: 'JPY', exponent: 0 };

  it('gives the millimes output for TND', () => {
    for (const value of [0, 5, 48350, 1234500, -1234500, 987654321012]) expect(formatMinor(value, TND)).toBe(formatMillimes(value));
  });

  it('shows cents for EUR', () => {
    expect(plain(formatMinor(1250, EUR))).toMatch(/^12,50 /);
    expect(plain(formatMinor(150000, EUR))).toMatch(/^1 500,00 /);
  });

  it('shows no decimals for JPY', () => {
    expect(plain(formatMinor(1500, JPY))).toMatch(/^1 500 /);
    expect(formatMinor(1500, JPY)).not.toContain(',');
  });

  it('rounds and signs on request', () => {
    expect(formatMinor(1234500, TND, { display: 'rounded' })).toBe(formatMillimesHeadline(1234500));
    expect(formatMinor(2000, TND, { signed: true })).toBe(formatSignedMillimes(2000));
    expect(formatMinor(2800400, TND, { display: 'rounded', signed: true })).toBe(formatSignedMillimesHeadline(2800400));
  });

  it('refuses a non-integer value', () => {
    expect(() => formatMinor(1.5, EUR)).toThrow(RangeError);
  });
});

describe('parseMajor (spec 007 REQ-1.2)', () => {
  it.each([
    ['1500', 3, 1500000],
    ['1,5', 3, 1500],
    ['1.5', 3, 1500],
    ['12,345', 3, 12345],
    ['0,005', 3, 5],
    ['1 500', 3, 1500000],
    ['1 500,250', 3, 1500250],
    ['1 500', 2, 150000],
    ['  42  ', 2, 4200],
    ['12,50', 2, 1250],
    ['1500', 0, 1500],
    ['5,', 2, 500],
    [',5', 2, 50],
    ['999999999,999', 3, 999999999999],
  ])('"%s" with exponent %d → %d', (text, exponent, minor) => {
    expect(parseMajor(text, exponent)).toEqual({ ok: true, minor });
  });

  it.each([
    ['', 3, 'empty'],
    ['   ', 3, 'empty'],
    ['abc', 3, 'invalid'],
    ['1.500,5', 3, 'invalid'],
    ['1,5,0', 3, 'invalid'],
    ['-5', 3, 'invalid'],
    ['1e3', 3, 'invalid'],
    [',', 3, 'invalid'],
    ['1,2345', 3, 'too_many_decimals'],
    ['12,505', 2, 'too_many_decimals'],
    ['1,5', 0, 'too_many_decimals'],
    ['0', 3, 'zero'],
    ['0,000', 3, 'zero'],
    ['1000000000', 3, 'too_large'],
    ['1000000000000', 0, 'too_large'],
  ])('"%s" with exponent %d → %s', (text, exponent, reason) => {
    expect(parseMajor(text, exponent)).toEqual({ ok: false, reason });
  });
});
