import { MIN_MONTH, addMonths, lastDayOf } from '../../ledger/month-context';
import { Summary } from '../../dashboard/data/models';
import { DayRange } from '../../dashboard/support/same-day';

export const TREND_MONTHS = 6;

export interface TrendMonth {
  readonly month: string;
  readonly expense: number;
  readonly entries: number;
}

export function trendMonths(month: string): string[] {
  return Array.from({ length: TREND_MONTHS }, (_, index) => addMonths(month, index - (TREND_MONTHS - 1)));
}

export function trendRange(month: string): DayRange {
  const first = `${trendMonths(month)[0]}-01`;
  const earliest = `${MIN_MONTH}-01`;
  return { from: first < earliest ? earliest : first, to: lastDayOf(month) };
}

export function trendItems(summary: Summary, month: string): TrendMonth[] {
  const byMonth = new Map(summary.months.map((line) => [line.month, line]));
  return trendMonths(month).map((id) => ({ month: id, expense: byMonth.get(id)?.expense ?? 0, entries: byMonth.get(id)?.entries ?? 0 }));
}

export function averageOf(items: readonly TrendMonth[]): number | null {
  const used = items.filter((item) => item.entries > 0);
  return used.length === 0 ? null : Math.round(used.reduce((sum, item) => sum + item.expense, 0) / used.length);
}
