import { monthRange } from '../../operations/data/filters';
import { addMonths, currentMonth } from '../../ledger/month-context';

export interface DayRange {
  readonly from: string;
  readonly to: string;
}

export interface ComparisonRanges {
  readonly current: DayRange;
  readonly previous: DayRange;
}

export function comparisonRanges(month: string, today: string): ComparisonRanges {
  const previousMonth = addMonths(month, -1);
  const previousWhole = monthRange(previousMonth);
  if (month !== currentMonth(today)) return { current: monthRange(month), previous: previousWhole };
  const day = today.slice(8, 10);
  const sameDay = `${previousMonth}-${day}`;
  return {
    current: { from: `${month}-01`, to: today },
    previous: { from: previousWhole.from, to: sameDay < previousWhole.to ? sameDay : previousWhole.to },
  };
}
