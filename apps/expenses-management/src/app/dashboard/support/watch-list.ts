import { BudgetLine } from '../../budget/data/models';
import { percentRank } from '../../budget/support/overview';

export const WATCH_LIST_SIZE = 3;

export function watchList(lines: readonly BudgetLine[]): BudgetLine[] {
  return lines
    .filter((line) => line.status === 'warning' || line.status === 'over')
    .map((line, index) => ({ line, index }))
    .sort((a, b) => percentRank(b.line) - percentRank(a.line) || a.index - b.index)
    .slice(0, WATCH_LIST_SIZE)
    .map(({ line }) => line);
}
