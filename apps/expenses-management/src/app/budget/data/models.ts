export type LineStatus = 'ok' | 'warning' | 'over';

export interface BudgetLine {
  readonly category: string;
  readonly planned: number;
  readonly actual: number;
  readonly percent: number | null;
  readonly status: LineStatus;
  readonly retired: boolean;
}

export interface Budget {
  readonly month: string;
  readonly from: string;
  readonly to: string;
  readonly currency: string;
  readonly hasPlan: boolean;
  readonly daysLeft: number | null;
  readonly income: { readonly expected: number | null; readonly actual: number };
  readonly saving: { readonly planned: number | null; readonly actual: number };
  readonly expenses: {
    readonly planned: number | null;
    readonly actual: number;
    readonly offPlan: number | null;
    readonly remaining: number | null;
  };
  readonly lines: readonly BudgetLine[];
}

export interface BudgetLineInput {
  readonly category: string;
  readonly planned: number;
}

export interface BudgetInput {
  readonly expectedIncome: number | null;
  readonly plannedSaving: number | null;
  readonly lines: readonly BudgetLineInput[];
}

export type BudgetLineDto = BudgetLine;

export interface BudgetDto {
  readonly month: string;
  readonly from: string;
  readonly to: string;
  readonly currency: string;
  readonly has_plan: boolean;
  readonly days_left: number | null;
  readonly income: { readonly expected: number | null; readonly actual: number };
  readonly saving: { readonly planned: number | null; readonly actual: number };
  readonly expenses: {
    readonly planned: number | null;
    readonly actual: number;
    readonly off_plan: number | null;
    readonly remaining: number | null;
  };
  readonly lines: readonly BudgetLineDto[];
}
