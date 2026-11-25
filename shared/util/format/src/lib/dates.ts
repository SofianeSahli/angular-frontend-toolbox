const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function localMidnight(year: number, monthIndex: number, day: number): Date {
  const date = new Date(0);
  date.setFullYear(year, monthIndex, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

export function toLocalIsoDate(date: Date): string {
  if (Number.isNaN(date.getTime())) throw new RangeError('Invalid date');
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromLocalIsoDate(value: string): Date {
  const match = ISO_DATE.exec(value);
  if (!match) throw new RangeError(`Expected a date as YYYY-MM-DD, got "${value}"`);
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = localMidnight(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new RangeError(`"${value}" is not a calendar date`);
  }
  return date;
}

const dayFormatters = new Map<string, Intl.DateTimeFormat>();

function dayFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = dayFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
    dayFormatters.set(timeZone, formatter);
  }
  return formatter;
}

export function todayIn(timeZone: string, now: Date = new Date()): string {
  const parts = dayFormatter(timeZone).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function utcParts(value: string): [number, number, number] {
  const match = ISO_DATE.exec(value);
  if (!match) throw new RangeError(`Expected a date as YYYY-MM-DD, got "${value}"`);
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new RangeError(`"${value}" is not a calendar date`);
  }
  return [year, month - 1, day];
}

function utcIso(date: Date): string {
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function addDays(value: string, days: number): string {
  const [year, monthIndex, day] = utcParts(value);
  return utcIso(new Date(Date.UTC(year, monthIndex, day + days)));
}

export function addYears(value: string, years: number): string {
  const [year, monthIndex, day] = utcParts(value);
  const lastDay = new Date(Date.UTC(year + years, monthIndex + 1, 0)).getUTCDate();
  return utcIso(new Date(Date.UTC(year + years, monthIndex, Math.min(day, lastDay))));
}
