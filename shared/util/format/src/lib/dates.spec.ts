import { addDays, addYears, fromLocalIsoDate, toLocalIsoDate, todayIn } from './dates';

describe('local ISO dates (REQ-6.6)', () => {
  it('runs in a UTC+1/+2 time zone, where toISOString shifts the day', () => {
    expect(new Date(2026, 2, 29, 0, 30).getTimezoneOffset()).toBe(-60);
    expect(new Date(2026, 6, 1).getTimezoneOffset()).toBe(-120);
  });

  it('keeps the local day just after midnight', () => {
    const march29At0030Local = new Date(2026, 2, 29, 0, 30);
    const utcDayThatToIsoStringWouldGive = march29At0030Local.toISOString().slice(0, 10);
    expect(utcDayThatToIsoStringWouldGive).toBe('2026-03-28');
    expect(toLocalIsoDate(march29At0030Local)).toBe('2026-03-29');
  });

  it('round-trips through local midnight on a DST change day', () => {
    const dstChangeDay = fromLocalIsoDate('2026-10-25');
    expect([dstChangeDay.getFullYear(), dstChangeDay.getMonth(), dstChangeDay.getDate(), dstChangeDay.getHours()]).toEqual([2026, 9, 25, 0]);
    expect(toLocalIsoDate(dstChangeDay)).toBe('2026-10-25');
  });

  it('pads years, months and days', () => {
    expect(toLocalIsoDate(fromLocalIsoDate('0099-01-05'))).toBe('0099-01-05');
  });

  it.each(['2026-02-30', '2026-13-01', '26-01-01', '2026-1-1', ''])('refuses "%s"', (value) => {
    expect(() => fromLocalIsoDate(value)).toThrow(RangeError);
  });

  it('refuses an invalid Date', () => {
    expect(() => toLocalIsoDate(new Date('nope'))).toThrow(RangeError);
  });
});

describe('todayIn (spec 007 REQ-1.3)', () => {
  it('gives the day in the book timezone, not the device one', () => {
    const lateUtc = new Date(Date.UTC(2026, 10, 24, 23, 30));
    expect(todayIn('Africa/Tunis', lateUtc)).toBe('2026-11-25');
    expect(todayIn('America/New_York', lateUtc)).toBe('2026-11-24');
    expect(todayIn('UTC', lateUtc)).toBe('2026-11-24');
  });

  it('turns the day exactly at local midnight', () => {
    expect(todayIn('Africa/Tunis', new Date(Date.UTC(2026, 10, 24, 22, 59, 59)))).toBe('2026-11-24');
    expect(todayIn('Africa/Tunis', new Date(Date.UTC(2026, 10, 24, 23, 0, 0)))).toBe('2026-11-25');
  });

  it('uses the clock when no date is given', () => {
    expect(todayIn('UTC')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('addDays and addYears (spec 007 REQ-1.3)', () => {
  it.each([
    ['2026-11-25', -1, '2026-11-24'],
    ['2026-03-01', -1, '2026-02-28'],
    ['2028-03-01', -1, '2028-02-29'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2026-03-29', 1, '2026-03-30'],
    ['2026-10-25', 1, '2026-10-26'],
  ])('%s + %d days → %s', (iso, n, expected) => {
    expect(addDays(iso, n)).toBe(expected);
  });

  it.each([
    ['2026-11-25', 1, '2027-11-25'],
    ['2028-02-29', 1, '2029-02-28'],
    ['2028-02-29', 4, '2032-02-29'],
    ['2026-01-31', -1, '2025-01-31'],
  ])('%s + %d years → %s', (iso, n, expected) => {
    expect(addYears(iso, n)).toBe(expected);
  });

  it('refuses a malformed date', () => {
    expect(() => addDays('2026-02-30', 1)).toThrow(RangeError);
    expect(() => addYears('25/11/2026', 1)).toThrow(RangeError);
  });
});
