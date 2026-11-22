import { formatMillimes, formatMillimesHeadline, formatSignedMillimes } from './money';

// fr-TN output uses U+202F (narrow no-break space) between thousands and U+00A0 before "DT".
const NNBSP = String.fromCharCode(0x202f);
const NBSP = String.fromCharCode(0x00a0);
const dt = (s: string) => s.replaceAll(' ', NNBSP).replace(new RegExp(`${NNBSP}DT$`), `${NBSP}DT`);

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

describe('non-integer millimes (REQ-6.5)', () => {
  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53])('refuses %s instead of rounding', (value) => {
    expect(() => formatMillimes(value)).toThrow(RangeError);
    expect(() => formatMillimesHeadline(value)).toThrow(RangeError);
    expect(() => formatSignedMillimes(value)).toThrow(RangeError);
  });
});
