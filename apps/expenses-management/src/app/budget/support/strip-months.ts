import { UiMonthStatus } from '@shared/ui-molecules';
import { addMonths, currentMonth, positionOf } from '../../ledger/month-context';

export const STRIP_MONTHS_BACK = 12;
export const STRIP_MONTHS_AHEAD = 12;

export function stripMonths(today: string, selected: string): string[] {
  const current = currentMonth(today);
  const months = Array.from({ length: STRIP_MONTHS_BACK + STRIP_MONTHS_AHEAD + 1 }, (_, index) => addMonths(current, index - STRIP_MONTHS_BACK));
  return selected < months[0] ? [selected, ...months] : months;
}

export function futureMonths(today: string): string[] {
  return Array.from({ length: STRIP_MONTHS_AHEAD }, (_, index) => addMonths(currentMonth(today), index + 1));
}

export function stripStatus(month: string, today: string, plans: Readonly<Record<string, boolean>>): UiMonthStatus | undefined {
  const position = positionOf(month, today);
  if (position === 'past') return 'closed';
  if (position === 'current') return 'current';
  const planned = plans[month];
  return planned === undefined ? undefined : planned ? 'planned' : 'todo';
}
