import { BudgetLine, LineStatus } from '../data/models';

export const WARNING_FROM = 0.85;

export function percentRank(line: BudgetLine): number {
  return line.percent ?? (line.status === 'over' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
}

export function overviewLines(lines: readonly BudgetLine[]): BudgetLine[] {
  return lines
    .map((line, index) => ({ line, index }))
    .sort((a, b) => percentRank(b.line) - percentRank(a.line) || a.index - b.index)
    .map(({ line }) => line);
}

export function overallState(actual: number, planned: number): LineStatus {
  if (!(planned > 0)) return actual > 0 ? 'over' : 'ok';
  const ratio = actual / planned;
  return ratio > 1 ? 'over' : ratio >= WARNING_FROM ? 'warning' : 'ok';
}

export function overallPercent(actual: number, planned: number): number | null {
  return planned > 0 ? Math.round((actual / planned) * 100) : null;
}
