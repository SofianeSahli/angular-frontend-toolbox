import { toEntry } from './data/mappers';
import { Entry, EntryDto, EntryFilters } from './data/models';

export function entryDto(id: string, overrides: Partial<EntryDto> = {}): EntryDto {
  return {
    id,
    amount: 12500,
    currency: 'TND',
    date: '2026-11-20',
    type: 'expense',
    category: 'food.groceries.supermarket',
    other_name: null,
    comment: null,
    recurring_rule_id: null,
    created_by: { id: 'u1', name: 'Moi' },
    updated_by: { id: 'u1', name: 'Moi' },
    created_at: '2026-11-20T18:04:11Z',
    updated_at: '2026-11-20T18:04:11Z',
    ...overrides,
  };
}

export function entry(id: string, overrides: Partial<EntryDto> = {}): Entry {
  return toEntry(entryDto(id, overrides));
}

export const NOVEMBER: EntryFilters = {
  from: '2026-11-01',
  to: '2026-11-30',
  type: null,
  category: null,
  author: null,
};
