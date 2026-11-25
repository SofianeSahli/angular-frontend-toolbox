import { CategoryType } from '../../categories/data/models';
import { Person } from '../../operations/data/models';

export interface SummaryNode {
  readonly category: string;
  readonly type: CategoryType;
  readonly total: number;
  readonly entries: number;
  readonly children: readonly SummaryNode[];
}

export interface Totals {
  readonly income: number;
  readonly expense: number;
  readonly saving: number;
  readonly balance: number;
  readonly entries: number;
}

export interface MemberTotals extends Totals {
  readonly account: Person;
}

export interface DayTotals extends Totals {
  readonly date: string;
}

export interface MonthTotals extends Totals {
  readonly month: string;
}

export interface Summary {
  readonly from: string;
  readonly to: string;
  readonly currency: string;
  readonly totals: Totals;
  readonly categories: readonly SummaryNode[];
  readonly members: readonly MemberTotals[];
  readonly days: readonly DayTotals[];
  readonly months: readonly MonthTotals[];
}

export type SummaryPeriod = { readonly month: string } | { readonly from: string; readonly to: string };

export interface SummaryNodeDto {
  readonly category: string;
  readonly type: CategoryType;
  readonly total: number;
  readonly entries: number;
  readonly children: readonly SummaryNodeDto[];
}

export interface MemberTotalsDto extends Totals {
  readonly account: Person;
}

export interface DayTotalsDto extends Totals {
  readonly date: string;
}

export interface MonthTotalsDto extends Totals {
  readonly month: string;
}

export interface SummaryDto {
  readonly from: string;
  readonly to: string;
  readonly currency: string;
  readonly totals: Totals;
  readonly categories: readonly SummaryNodeDto[];
  readonly members: readonly MemberTotalsDto[];
  readonly days?: readonly DayTotalsDto[];
  readonly months?: readonly MonthTotalsDto[];
}
