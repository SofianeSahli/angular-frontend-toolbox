import { TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { ParseFailure } from '@shared/util-format';
import { retryText } from '../../households/support/retry-text';

export type BudgetReaction = 'fields' | 'bookGone' | 'throttled' | 'offline' | 'notEmpty' | 'nothingToCopy' | 'presenter';

export interface LineErrors {
  readonly category?: string;
  readonly planned?: string;
}

export interface BudgetFieldErrors {
  readonly lines: Readonly<Record<string, LineErrors>>;
  readonly income: string | null;
  readonly saving: string | null;
  readonly alerts: readonly string[];
}

const REACTIONS: Readonly<Record<string, BudgetReaction>> = {
  'validation.failed': 'fields',
  'book.not_found': 'bookGone',
  'request.throttled': 'throttled',
  'http.offline': 'offline',
  'budget.not_empty': 'notEmpty',
  'budget.nothing_to_copy': 'nothingToCopy',
};

const LINE_FIELD = /^lines\.(\d+)\.(category|planned)$/;

export function budgetReaction(error: ApiError): BudgetReaction {
  return REACTIONS[error.code] ?? 'presenter';
}

export function codeMessage(translate: TranslateService, code: string): string {
  const key = `budget.fields.${code}`;
  return translate.instant(translate.instant(key) === key ? 'budget.fields.generic' : key);
}

export function parseMessage(translate: TranslateService, reason: ParseFailure): string {
  return translate.instant(`budget.amount.${reason}`);
}

export function budgetFieldErrors(error: ApiError, sentCategories: readonly string[], translate: TranslateService): BudgetFieldErrors {
  const lines: Record<string, { category?: string; planned?: string }> = {};
  const alerts: string[] = [];
  let income: string | null = null;
  let saving: string | null = null;
  for (const [field, codes] of Object.entries(error.fields)) {
    const code = codes[0];
    if (code === undefined) continue;
    const message = codeMessage(translate, code);
    const line = LINE_FIELD.exec(field);
    const category = line === null ? undefined : sentCategories[Number(line[1])];
    if (line !== null && category !== undefined) lines[category] = { ...lines[category], [line[2]]: message };
    else if (field === 'expected_income') income = message;
    else if (field === 'planned_saving') saving = message;
    else alerts.push(message);
  }
  return { lines, income, saving, alerts };
}

export function throttledMessage(translate: TranslateService, error: ApiError): string {
  return translate.instant('budget.errors.throttled', { retry: retryText(translate, error.retryAfterSeconds) });
}
