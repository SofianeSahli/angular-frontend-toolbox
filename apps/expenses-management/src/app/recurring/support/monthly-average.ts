import { RecurringRule } from '../data/models';

export interface MonthlyAverage {
  readonly expense: number;
  readonly income: number;
}

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

function perMonth(rule: RecurringRule): number {
  switch (rule.frequency) {
    case 'weekly':
      return (rule.amount * WEEKS_PER_YEAR) / MONTHS_PER_YEAR / rule.interval;
    case 'monthly':
      return rule.amount / rule.interval;
    case 'yearly':
      return rule.amount / MONTHS_PER_YEAR / rule.interval;
  }
}

export function isLive(rule: RecurringRule): boolean {
  return rule.nextDate !== null;
}

export function monthlyAverage(rules: readonly RecurringRule[], exponent: number): MonthlyAverage {
  const unit = 10 ** exponent;
  const sum = (type: RecurringRule['type']) => rules.filter((rule) => isLive(rule) && rule.type === type).reduce((total, rule) => total + perMonth(rule), 0);
  const wholeUnits = (minor: number) => Math.floor(minor / unit) * unit;
  return { expense: wholeUnits(sum('expense')), income: wholeUnits(sum('income')) };
}
