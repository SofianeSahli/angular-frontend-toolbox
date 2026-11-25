import { toBudget } from './data/mappers';
import { Budget, BudgetDto, BudgetLineDto } from './data/models';

export function lineDto(category: string, overrides: Partial<BudgetLineDto> = {}): BudgetLineDto {
  return { category, planned: 600000, actual: 540000, percent: 90, status: 'warning', retired: false, ...overrides };
}

export function budgetDto(overrides: Partial<BudgetDto> = {}): BudgetDto {
  return {
    month: '2026-11',
    from: '2026-11-01',
    to: '2026-11-30',
    currency: 'TND',
    has_plan: true,
    days_left: 6,
    income: { expected: 2500000, actual: 2500000 },
    saving: { planned: 300000, actual: 100000 },
    expenses: { planned: 1100000, actual: 1212500, off_plan: 12500, remaining: 47500 },
    lines: [
      lineDto('food'),
      lineDto('home.housing', { planned: 400000, actual: 400000, percent: 100 }),
      lineDto('transport', { planned: 100000, actual: 160000, percent: 160, status: 'over' }),
      lineDto('entertainment.outings', { planned: 0, actual: 100000, percent: null, status: 'over' }),
    ],
    ...overrides,
  };
}

export const NO_PLAN_DTO: BudgetDto = budgetDto({
  has_plan: false,
  income: { expected: null, actual: 0 },
  saving: { planned: null, actual: 0 },
  expenses: { planned: null, actual: 912500, off_plan: null, remaining: null },
  lines: [],
});

export function budget(overrides: Partial<BudgetDto> = {}): Budget {
  return toBudget(budgetDto(overrides));
}

export const NO_PLAN: Budget = toBudget(NO_PLAN_DTO);
