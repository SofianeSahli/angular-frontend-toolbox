import { UiPacePoint } from '@shared/ui-molecules';
import { positionOf } from '../../ledger/month-context';
import { monthRange } from '../../operations/data/filters';
import { Summary } from '../../dashboard/data/models';

export function daysInMonthOf(month: string): number {
  return Number(monthRange(month).to.slice(8, 10));
}

export function lastShownDay(month: string, today: string): number {
  const position = positionOf(month, today);
  if (position === 'future') return 0;
  return position === 'current' ? Number(today.slice(8, 10)) : daysInMonthOf(month);
}

function expenseByDay(summary: Summary, month: string): Map<number, number> {
  const byDay = new Map<number, number>();
  for (const day of summary.days) {
    if (day.date.startsWith(month)) byDay.set(Number(day.date.slice(8, 10)), day.expense);
  }
  return byDay;
}

export function cumulativeByDay(summary: Summary, month: string, through: number): UiPacePoint[] {
  const byDay = expenseByDay(summary, month);
  const points: UiPacePoint[] = [];
  let total = 0;
  for (let day = 1; day <= through; day++) {
    total += byDay.get(day) ?? 0;
    points.push({ day, value: total });
  }
  return points;
}

export function cumulativeValues(summary: Summary, month: string): number[] {
  return cumulativeByDay(summary, month, daysInMonthOf(month)).map((point) => point.value);
}
