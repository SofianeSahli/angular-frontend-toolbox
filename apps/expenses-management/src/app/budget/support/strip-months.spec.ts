import { futureMonths, stripMonths, stripStatus } from './strip-months';

describe('budget month strip (spec 009 REQ-9.1, 9.2)', () => {
  const today = '2026-11-25';

  it('covers the current month − 12 to + 12', () => {
    const months = stripMonths(today, '2026-11');
    expect(months).toHaveLength(25);
    expect([months[0], months[12], months[24]]).toEqual(['2025-11', '2026-11', '2027-11']);
  });

  it('adds an older selected month at the start', () => {
    expect(stripMonths(today, '2024-03').slice(0, 2)).toEqual(['2024-03', '2025-11']);
  });

  it('lists the twelve future months to check', () => {
    expect(futureMonths(today)).toEqual([
      '2026-12', '2027-01', '2027-02', '2027-03', '2027-04', '2027-05', '2027-06', '2027-07', '2027-08', '2027-09', '2027-10', '2027-11',
    ]);
  });

  it('labels past, current, planned, to-do and unknown months', () => {
    const plans = { '2026-12': true, '2027-01': false };
    expect(['2026-10', '2026-11', '2026-12', '2027-01', '2027-02'].map((month) => stripStatus(month, today, plans))).toEqual([
      'closed',
      'current',
      'planned',
      'todo',
      undefined,
    ]);
  });
});
