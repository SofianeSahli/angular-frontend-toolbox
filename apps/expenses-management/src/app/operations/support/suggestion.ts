import { Entry } from '../data/models';

export interface EntryTemplate {
  readonly category: string;
  readonly otherName: string | null;
  readonly amount: number;
}

export const HISTORY_SIZE = 30;
export const TEMPLATE_COUNT = 3;
export const SUGGESTION_WINDOW_MINUTES = 120;
const MINUTES_PER_DAY = 24 * 60;

const timeFormatters = new Map<string, Intl.DateTimeFormat>();

export function minuteOfDay(moment: Date, timeZone: string): number {
  let formatter = timeFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    timeFormatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(moment);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return value('hour') * 60 + value('minute');
}

function minutesApart(a: number, b: number): number {
  const gap = Math.abs(a - b);
  return Math.min(gap, MINUTES_PER_DAY - gap);
}

function newestFirst(entries: readonly Entry[]): Entry[] {
  return [...entries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function mostFrequentCategory(entries: readonly Entry[]): string | null {
  const counts = new Map<string, number>();
  for (const entry of entries) counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
  let best: string | null = null;
  for (const entry of newestFirst(entries)) {
    if (best === null || (counts.get(entry.category) ?? 0) > (counts.get(best) ?? 0)) best = entry.category;
  }
  return best;
}

export function suggestCategory(entries: readonly Entry[], now: Date, timeZone: string, offerable: (code: string) => boolean): string | null {
  const usable = entries.filter((entry) => offerable(entry.category));
  const nowMinute = minuteOfDay(now, timeZone);
  const nearNow = usable.filter((entry) => minutesApart(minuteOfDay(entry.createdAt, timeZone), nowMinute) <= SUGGESTION_WINDOW_MINUTES);
  return mostFrequentCategory(nearNow) ?? mostFrequentCategory(usable);
}

export function templatesFrom(entries: readonly Entry[], offerable: (code: string) => boolean): EntryTemplate[] {
  const templates: EntryTemplate[] = [];
  const seen = new Set<string>();
  for (const entry of newestFirst(entries)) {
    if (!offerable(entry.category)) continue;
    const key = `${entry.category}|${entry.otherName ?? ''}|${entry.amount}`;
    if (seen.has(key)) continue;
    seen.add(key);
    templates.push({ category: entry.category, otherName: entry.otherName, amount: entry.amount });
    if (templates.length === TEMPLATE_COUNT) break;
  }
  return templates;
}
