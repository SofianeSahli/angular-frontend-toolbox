import { toSummary } from '../data/mappers';
import { summaryDto } from '../testing';
import { averageOf, trendItems, trendMonths, trendRange } from './trend-series';

const line = (month: string, expense: number, entries = 1) => ({ month, income: 0, expense, saving: 0, balance: -expense, entries });

describe('trend series (spec 008 REQ-9.8)', () => {
  it('lists the selected month and the five before it, across the year', () => {
    expect(trendMonths('2026-11')).toEqual(['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']);
    expect(trendMonths('2027-02')).toEqual(['2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02']);
  });

  it('asks for the first day of the oldest month up to the last day of the selected one', () => {
    expect(trendRange('2026-11')).toEqual({ from: '2026-06-01', to: '2026-11-30' });
    expect(trendRange('2028-02')).toEqual({ from: '2027-09-01', to: '2028-02-29' });
  });

  it('never asks before the first day the API accepts', () => {
    expect(trendRange('2000-03')).toEqual({ from: '2000-01-01', to: '2000-03-31' });
    expect(trendRange('2000-06').from).toBe('2000-01-01');
  });

  it('always gives six months, with zero for the months without entries', () => {
    const summary = toSummary({ ...summaryDto(), months: [line('2026-09', 400), line('2026-11', 800)] });
    const items = trendItems(summary, '2026-11');
    expect(items.map((item) => item.expense)).toEqual([0, 0, 0, 400, 0, 800]);
    expect(items.map((item) => item.entries)).toEqual([0, 0, 0, 1, 0, 1]);
  });

  it('gives six zero months for an empty answer', () => {
    expect(trendItems(toSummary(summaryDto()), '2026-11')).toHaveLength(6);
  });

  it('averages only the months that have entries, rounded to a whole minor unit', () => {
    const summary = toSummary({ ...summaryDto(), months: [line('2026-09', 400), line('2026-10', 401), line('2026-11', 800)] });
    expect(averageOf(trendItems(summary, '2026-11'))).toBe(534);
  });

  it('counts a month with entries but no expense, and has no average without entries', () => {
    const summary = toSummary({ ...summaryDto(), months: [line('2026-10', 0), line('2026-11', 600)] });
    expect(averageOf(trendItems(summary, '2026-11'))).toBe(300);
    expect(averageOf(trendItems(toSummary(summaryDto()), '2026-11'))).toBeNull();
  });
});
