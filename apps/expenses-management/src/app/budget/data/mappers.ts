import { Budget, BudgetDto, BudgetInput } from './models';

export function toBudget(dto: BudgetDto): Budget {
  return {
    month: dto.month,
    from: dto.from,
    to: dto.to,
    currency: dto.currency,
    hasPlan: dto.has_plan,
    daysLeft: dto.days_left,
    income: { expected: dto.income.expected, actual: dto.income.actual },
    saving: { planned: dto.saving.planned, actual: dto.saving.actual },
    expenses: {
      planned: dto.expenses.planned,
      actual: dto.expenses.actual,
      offPlan: dto.expenses.off_plan,
      remaining: dto.expenses.remaining,
    },
    lines: dto.lines.map((line) => ({
      category: line.category,
      planned: line.planned,
      actual: line.actual,
      percent: line.percent,
      status: line.status,
      retired: line.retired,
    })),
  };
}

export function toBudgetBody(input: BudgetInput): Record<string, unknown> {
  return {
    expected_income: input.expectedIncome,
    planned_saving: input.plannedSaving,
    lines: input.lines.map((line) => ({ category: line.category, planned: line.planned })),
  };
}
