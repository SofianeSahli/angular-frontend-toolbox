import { TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';

export type EntryErrorReaction = 'fields' | 'bookGone' | 'entryGone' | 'idConflict' | 'throttled' | 'offline' | 'presenter';

export type EntryField = 'amount' | 'date' | 'category' | 'otherName' | 'comment' | 'id';

const FIELD_BY_API_NAME: Readonly<Record<string, EntryField>> = {
  amount: 'amount',
  date: 'date',
  category: 'category',
  other_name: 'otherName',
  comment: 'comment',
  id: 'id',
};

const REACTIONS: Readonly<Record<string, EntryErrorReaction>> = {
  'validation.failed': 'fields',
  'book.not_found': 'bookGone',
  'transaction.not_found': 'entryGone',
  'transaction.id_conflict': 'idConflict',
  'request.throttled': 'throttled',
  'http.offline': 'offline',
};

export const CATEGORY_REFUSALS: ReadonlySet<string> = new Set(['category.not_found', 'category.not_leaf', 'category.retired']);

export function reactionTo(error: ApiError): EntryErrorReaction {
  return REACTIONS[error.code] ?? 'presenter';
}

export function refusesCategory(error: ApiError): boolean {
  return (error.fields['category'] ?? []).some((code) => CATEGORY_REFUSALS.has(code));
}

export function entryFieldMessages(error: ApiError, translate: TranslateService): Partial<Record<EntryField, string>> {
  const messages: Partial<Record<EntryField, string>> = {};
  for (const [apiName, codes] of Object.entries(error.fields)) {
    const field = FIELD_BY_API_NAME[apiName];
    const code = codes[0];
    if (field === undefined || code === undefined) continue;
    const key = `operations.fields.${code}`;
    messages[field] = translate.instant(translate.instant(key) === key ? 'operations.fields.generic' : key);
  }
  return messages;
}
