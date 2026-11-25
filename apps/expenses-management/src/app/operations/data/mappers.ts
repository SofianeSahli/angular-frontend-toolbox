import { HttpParams } from '@angular/common/http';
import { Entry, EntryDto, EntryFilters, EntryInput, EntryPatch } from './models';

export function toEntry(dto: EntryDto): Entry {
  return {
    id: dto.id,
    amount: dto.amount,
    currency: dto.currency,
    date: dto.date,
    type: dto.type,
    category: dto.category,
    otherName: dto.other_name,
    comment: dto.comment,
    recurringRuleId: dto.recurring_rule_id,
    createdBy: { id: dto.created_by.id, name: dto.created_by.name },
    updatedBy: { id: dto.updated_by.id, name: dto.updated_by.name },
    createdAt: new Date(dto.created_at),
    updatedAt: new Date(dto.updated_at),
  };
}

export function toEntryBody(input: EntryInput): Record<string, string | number> {
  const body: Record<string, string | number> = {
    id: input.id,
    amount: input.amount,
    date: input.date,
    category: input.category,
  };
  if (input.otherName !== null) body['other_name'] = input.otherName;
  if (input.comment !== null) body['comment'] = input.comment;
  return body;
}

export function toPatchBody(patch: EntryPatch): Record<string, string | number | null> {
  const body: Record<string, string | number | null> = {};
  if (patch.amount !== undefined) body['amount'] = patch.amount;
  if (patch.date !== undefined) body['date'] = patch.date;
  if (patch.category !== undefined) body['category'] = patch.category;
  if (patch.otherName !== undefined) body['other_name'] = patch.otherName;
  if (patch.comment !== undefined) body['comment'] = patch.comment;
  return body;
}

export function toFilterParams(filters: EntryFilters, cursor: string | null): HttpParams {
  let params = new HttpParams().set('from', filters.from).set('to', filters.to);
  if (filters.type !== null) params = params.set('type', filters.type);
  if (filters.category !== null) params = params.set('category', filters.category);
  if (filters.author !== null) params = params.set('author', filters.author);
  if (cursor !== null) params = params.set('cursor', cursor);
  return params;
}
