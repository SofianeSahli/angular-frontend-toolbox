import { Budget } from '../data/models';

export interface PlannedLine {
  readonly category: string;
  readonly planned: number;
}

export interface Forecast {
  readonly income: number | null;
  readonly lines: number;
  readonly saving: number;
  readonly spending: number;
  readonly remainder: number | null;
}

export interface Realised {
  readonly actual: number;
  readonly offPlan: number;
  readonly left: number;
}

export function forecast(income: number | null, lines: number, saving: number | null): Forecast {
  const spending = lines + (saving ?? 0);
  return { income, lines, saving: saving ?? 0, spending, remainder: income === null ? null : income - spending };
}

export function realised(budget: Budget, lines: readonly PlannedLine[], plannedSaving: number | null): Realised {
  const actuals = new Map(budget.lines.map((line) => [line.category, line.actual]));
  let onPlan = 0;
  let unspent = 0;
  for (const line of lines) {
    const actual = actuals.get(line.category) ?? 0;
    onPlan += actual;
    unspent += Math.max(line.planned - actual, 0);
  }
  const offPlan = budget.expenses.actual - onPlan;
  const toSave = Math.max((plannedSaving ?? 0) - budget.saving.actual, 0);
  return { actual: budget.expenses.actual + budget.saving.actual, offPlan, left: Math.max(unspent - offPlan, 0) + toSave };
}
