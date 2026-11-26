import { addDays } from '@shared/util-format';
import { lastDayOf } from '../../ledger/month-context';
import { RecurringRule } from '../data/models';

export type RuleSchedule = Pick<RecurringRule, 'startsOn' | 'frequency' | 'interval' | 'endsOn'>;

const DAYS_PER_WEEK = 7;
const MONTHS_PER_YEAR = 12;

function monthIndex(date: string): number {
  return Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1;
}

function dayOfMonth(index: number, day: number): string {
  const month = `${String(Math.floor(index / 12)).padStart(4, '0')}-${String((index % 12) + 1).padStart(2, '0')}`;
  const last = Number(lastDayOf(month).slice(8, 10));
  return `${month}-${String(Math.min(day, last)).padStart(2, '0')}`;
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10)) - Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10))) / 86_400_000);
}

function weeklyDates(rule: RuleSchedule, first: string, last: string): string[] {
  const step = DAYS_PER_WEEK * rule.interval;
  const skipped = Math.max(0, Math.ceil(daysBetween(rule.startsOn, first) / step));
  const dates: string[] = [];
  for (let date = addDays(rule.startsOn, skipped * step); date <= last; date = addDays(date, step)) dates.push(date);
  return dates;
}

function monthlyDates(rule: RuleSchedule, months: number, month: string): string[] {
  const offset = monthIndex(month) - monthIndex(rule.startsOn);
  if (offset < 0 || offset % months !== 0) return [];
  return [dayOfMonth(monthIndex(month), Number(rule.startsOn.slice(8, 10)))];
}

export function dueDatesIn(rule: RuleSchedule, month: string): string[] {
  const first = `${month}-01`;
  const last = lastDayOf(month);
  const dates =
    rule.frequency === 'weekly'
      ? weeklyDates(rule, first, last)
      : monthlyDates(rule, rule.frequency === 'monthly' ? rule.interval : rule.interval * MONTHS_PER_YEAR, month);
  return dates.filter((date) => date >= first && date >= rule.startsOn && (rule.endsOn === null || date <= rule.endsOn));
}
