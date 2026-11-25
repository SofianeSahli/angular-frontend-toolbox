import { todayIn } from '@shared/util-format';
import { Entry, EntryFilters } from './models';

export function monthRange(month: string): Pick<EntryFilters, 'from' | 'to'> {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function monthOf(filters: Pick<EntryFilters, 'from'>): string {
  return filters.from.slice(0, 7);
}

export function defaultFilters(timeZone: string, now: Date = new Date()): EntryFilters {
  return {
    ...monthRange(todayIn(timeZone, now).slice(0, 7)),
    type: null,
    category: null,
    author: null,
  };
}

export function hasNarrowingFilters(filters: EntryFilters): boolean {
  return filters.type !== null || filters.category !== null || filters.author !== null;
}

export function matches(entry: Entry, filters: EntryFilters): boolean {
  if (entry.date < filters.from || entry.date > filters.to) return false;
  if (filters.type !== null && entry.type !== filters.type) return false;
  if (filters.category !== null && entry.category !== filters.category && !entry.category.startsWith(`${filters.category}.`)) return false;
  return filters.author === null || entry.createdBy.id === filters.author;
}

export function insertInOrder(entries: readonly Entry[], added: Entry): Entry[] {
  const later = (a: Entry, b: Entry) => a.date > b.date || (a.date === b.date && a.createdAt.getTime() >= b.createdAt.getTime());
  const index = entries.findIndex((existing) => later(added, existing));
  return index < 0 ? [...entries, added] : [...entries.slice(0, index), added, ...entries.slice(index)];
}
