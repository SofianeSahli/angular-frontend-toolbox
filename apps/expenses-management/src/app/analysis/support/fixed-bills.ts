import { UiPacePoint } from '@shared/ui-molecules';
import { Entry } from '../../operations/data/models';

export interface FixedBills {
  readonly byDay: ReadonlyMap<number, number>;
  readonly total: number;
}

export function fixedBills(entries: readonly Entry[], month: string): FixedBills {
  const byDay = new Map<number, number>();
  let total = 0;
  for (const entry of entries) {
    if (entry.recurringRuleId === null || entry.type !== 'expense' || !entry.date.startsWith(month)) continue;
    const day = Number(entry.date.slice(8, 10));
    byDay.set(day, (byDay.get(day) ?? 0) + entry.amount);
    total += entry.amount;
  }
  return { byDay, total };
}

export function withoutFixed(points: readonly UiPacePoint[], fixed: FixedBills): UiPacePoint[] {
  let removed = 0;
  return points.map((point) => {
    removed += fixed.byDay.get(point.day) ?? 0;
    return { day: point.day, value: Math.max(0, point.value - removed) };
  });
}
