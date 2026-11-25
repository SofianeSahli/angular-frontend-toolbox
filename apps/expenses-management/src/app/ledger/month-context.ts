import { monthRange } from '../operations/data/filters';

export const MIN_MONTH = '2000-01';
export const MONTHS_AHEAD = 12;
export const MONTH_PARAM = 'mois';
export const CATEGORY_PARAM = 'categorie';

const YEAR_MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isMonth(value: string | null | undefined): value is string {
  return typeof value === 'string' && YEAR_MONTH.test(value);
}

export function addMonths(month: string, count: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const index = year * 12 + monthNumber - 1 + count;
  return `${String(Math.floor(index / 12)).padStart(4, '0')}-${String((index % 12) + 1).padStart(2, '0')}`;
}

export function currentMonth(today: string): string {
  return today.slice(0, 7);
}

export function maxMonth(today: string): string {
  return addMonths(currentMonth(today), MONTHS_AHEAD);
}

export function monthFromQuery(value: string | null | undefined, today: string): string {
  if (!isMonth(value)) return currentMonth(today);
  if (value < MIN_MONTH) return MIN_MONTH;
  const max = maxMonth(today);
  return value > max ? max : value;
}

export function lastDayOf(month: string): string {
  return monthRange(month).to;
}

export type MonthPosition = 'past' | 'current' | 'future';

export function positionOf(month: string, today: string): MonthPosition {
  const current = currentMonth(today);
  return month < current ? 'past' : month > current ? 'future' : 'current';
}
