import { CategoryType } from '../../categories/data/models';
import { Person } from '../../operations/data/models';

export type Frequency = 'weekly' | 'monthly' | 'yearly';

export const FREQUENCIES: readonly Frequency[] = ['weekly', 'monthly', 'yearly'];

export interface RecurringRule {
  readonly id: string;
  readonly amount: number;
  readonly currency: string;
  readonly type: CategoryType;
  readonly category: string;
  readonly otherName: string | null;
  readonly comment: string | null;
  readonly frequency: Frequency;
  readonly interval: number;
  readonly startsOn: string;
  readonly endsOn: string | null;
  readonly nextDate: string | null;
  readonly createdBy: Person;
  readonly updatedBy: Person;
}

export interface RuleInput {
  readonly amount: number;
  readonly category: string;
  readonly otherName: string | null;
  readonly comment: string | null;
  readonly frequency: Frequency;
  readonly interval: number;
  readonly startsOn: string;
  readonly endsOn: string | null;
}

export type RulePatch = { -readonly [K in keyof RuleInput]?: RuleInput[K] };

export interface RecurringRuleDto {
  readonly id: string;
  readonly amount: number;
  readonly currency: string;
  readonly type: CategoryType;
  readonly category: string;
  readonly other_name: string | null;
  readonly comment: string | null;
  readonly frequency: Frequency;
  readonly interval: number;
  readonly starts_on: string;
  readonly ends_on: string | null;
  readonly next_date: string | null;
  readonly created_by: Person;
  readonly updated_by: Person;
  readonly created_at?: string;
  readonly updated_at?: string;
}
