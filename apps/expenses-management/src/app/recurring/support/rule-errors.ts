import { TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { CATEGORY_REFUSALS } from '../../operations/support/entry-errors';

export type RuleErrorReaction = 'fields' | 'bookGone' | 'ruleGone' | 'limit' | 'throttled' | 'offline' | 'presenter';

export type RuleField = 'amount' | 'category' | 'otherName' | 'comment' | 'frequency' | 'interval' | 'startsOn' | 'endsOn';

const FIELD_BY_API_NAME: Readonly<Record<string, RuleField>> = {
  amount: 'amount',
  category: 'category',
  other_name: 'otherName',
  comment: 'comment',
  frequency: 'frequency',
  interval: 'interval',
  starts_on: 'startsOn',
  ends_on: 'endsOn',
};

const REACTIONS: Readonly<Record<string, RuleErrorReaction>> = {
  'validation.failed': 'fields',
  'book.not_found': 'bookGone',
  'recurring_rule.not_found': 'ruleGone',
  'recurring_rule.limit_reached': 'limit',
  'request.throttled': 'throttled',
  'http.offline': 'offline',
};

export function ruleReaction(error: ApiError): RuleErrorReaction {
  return REACTIONS[error.code] ?? 'presenter';
}

export function refusesRuleCategory(error: ApiError): boolean {
  return (error.fields['category'] ?? []).some((code) => CATEGORY_REFUSALS.has(code));
}

export function ruleCodeMessage(translate: TranslateService, code: string): string {
  for (const key of [`recurring.fields.${code}`, `operations.fields.${code}`]) {
    if (translate.instant(key) !== key) return translate.instant(key);
  }
  return translate.instant('operations.fields.generic');
}

export function ruleFieldMessages(error: ApiError, translate: TranslateService): Partial<Record<RuleField, string>> {
  const messages: Partial<Record<RuleField, string>> = {};
  for (const [apiName, codes] of Object.entries(error.fields)) {
    const field = FIELD_BY_API_NAME[apiName];
    const code = codes[0];
    if (field !== undefined && code !== undefined) messages[field] = ruleCodeMessage(translate, code);
  }
  return messages;
}
