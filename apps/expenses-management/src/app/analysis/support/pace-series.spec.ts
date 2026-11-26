import { toSummary } from '../../dashboard/data/mappers';
import { summaryDto } from '../../dashboard/testing';
import { cumulativeByDay, cumulativeValues, daysInMonthOf, lastShownDay } from './pace-series';

const day = (date: string, expense: number) => ({ date, income: 0, expense, saving: 0, balance: -expense, entries: 1 });
const november = toSummary({ ...summaryDto(), days: [day('2026-11-02', 100), day('2026-11-04', 50), day('2026-11-05', 0), day('2026-11-20', 400)] });

describe('pace series (spec 008 REQ-9.7)', () => {
  it('counts the days of the month, leap years included', () => {
    expect(daysInMonthOf('2026-11')).toBe(30);
    expect(daysInMonthOf('2026-12')).toBe(31);
    expect(daysInMonthOf('2028-02')).toBe(29);
    expect(daysInMonthOf('2027-02')).toBe(28);
  });

  it('shows the line up to today, the whole month when past and nothing when future', () => {
    expect(lastShownDay('2026-11', '2026-11-12')).toBe(12);
    expect(lastShownDay('2026-10', '2026-11-12')).toBe(31);
    expect(lastShownDay('2026-12', '2026-11-12')).toBe(0);
  });

  it('adds up the expense day by day and carries it over days without entries', () => {
    const points = cumulativeByDay(november, '2026-11', 5);
    expect(points).toEqual([
      { day: 1, value: 0 },
      { day: 2, value: 100 },
      { day: 3, value: 100 },
      { day: 4, value: 150 },
      { day: 5, value: 150 },
    ]);
  });

  it('stops at the last shown day and ignores later entries', () => {
    expect(cumulativeByDay(november, '2026-11', 10).at(-1)).toEqual({ day: 10, value: 150 });
    expect(cumulativeByDay(november, '2026-11', 0)).toEqual([]);
  });

  it('gives an all-zero series for a month without entries', () => {
    const empty = toSummary(summaryDto());
    expect(cumulativeByDay(empty, '2026-11', 3).map((point) => point.value)).toEqual([0, 0, 0]);
  });

  it('ignores a day outside the month', () => {
    const other = toSummary({ ...summaryDto(), days: [day('2026-10-31', 999)] });
    expect(cumulativeByDay(other, '2026-11', 2).map((point) => point.value)).toEqual([0, 0]);
  });

  it('returns one number per day of the month for a reference', () => {
    const values = cumulativeValues(november, '2026-11');
    expect(values).toHaveLength(30);
    expect(values[19]).toBe(550);
    expect(values[29]).toBe(550);
  });
});
