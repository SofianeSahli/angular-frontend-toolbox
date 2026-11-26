import { CategoryType } from '../../categories/data/models';

export interface Person {
  readonly id: string;
  readonly name: string;
}

export interface Entry {
  readonly id: string;
  readonly amount: number;
  readonly currency: string;
  readonly date: string;
  readonly type: CategoryType;
  readonly category: string;
  readonly otherName: string | null;
  readonly comment: string | null;
  readonly recurringRuleId: string | null;
  readonly createdBy: Person;
  readonly updatedBy: Person;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface EntryInput {
  readonly id: string;
  readonly amount: number;
  readonly date: string;
  readonly category: string;
  readonly otherName: string | null;
  readonly comment: string | null;
}

export interface EntryPatch {
  readonly amount?: number;
  readonly date?: string;
  readonly category?: string;
  readonly otherName?: string;
  readonly comment?: string | null;
}

export interface EntryFilters {
  readonly from: string;
  readonly to: string;
  readonly type: CategoryType | null;
  readonly category: string | null;
  readonly author: string | null;
}

export interface EntryPage {
  readonly items: readonly Entry[];
  readonly nextCursor: string | null;
}

export interface EntryCollection {
  readonly items: readonly Entry[];
  readonly complete: boolean;
}

export interface EntryDto {
  readonly id: string;
  readonly amount: number;
  readonly currency: string;
  readonly date: string;
  readonly type: CategoryType;
  readonly category: string;
  readonly other_name: string | null;
  readonly comment: string | null;
  readonly recurring_rule_id: string | null;
  readonly created_by: Person;
  readonly updated_by: Person;
  readonly created_at: string;
  readonly updated_at: string;
}
