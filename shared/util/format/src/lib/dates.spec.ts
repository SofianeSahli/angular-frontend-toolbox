import { fromLocalIsoDate, toLocalIsoDate } from './dates';

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
