import { fromLocalIsoDate, toLocalIsoDate } from './dates';

describe('local ISO dates (REQ-6.6)', () => {
  const originalTz = process.env['TZ'];
  afterEach(() => {
    process.env['TZ'] = originalTz;
  });

  it.each(['Africa/Tunis', 'Europe/Paris'])('keeps the local day just after midnight in %s', (tz) => {
    process.env['TZ'] = tz;
    const justAfterMidnight = new Date(2026, 2, 29, 0, 30); // 29 March, 00:30 local (UTC+1/+2)
    expect(justAfterMidnight.toISOString().slice(0, 10)).toBe('2026-03-28'); // the bug this avoids
    expect(toLocalIsoDate(justAfterMidnight)).toBe('2026-03-29');
  });

  it('round-trips through local midnight', () => {
    process.env['TZ'] = 'Europe/Paris';
    const d = fromLocalIsoDate('2026-10-25'); // DST change day
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 9, 25, 0]);
    expect(toLocalIsoDate(d)).toBe('2026-10-25');
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
