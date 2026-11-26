import { rule } from '../testing';
import { dueDatesIn } from './due-dates';
import { monthlyAverage } from './monthly-average';

describe('dueDatesIn (spec 009 REQ-9.7)', () => {
  it('falls on the last day of a shorter month, then back on the start day', () => {
    const monthly = rule('r', { starts_on: '2026-01-31' });
    expect(dueDatesIn(monthly, '2027-02')).toEqual(['2027-02-28']);
    expect(dueDatesIn(monthly, '2027-03')).toEqual(['2027-03-31']);
    expect(dueDatesIn(rule('r', { starts_on: '2028-02-29', frequency: 'yearly' }), '2029-02')).toEqual(['2029-02-28']);
  });

  it('skips the months between two dates of an every-N-months rule', () => {
    const everyTwo = rule('r', { starts_on: '2026-10-12', interval: 2 });
    expect(dueDatesIn(everyTwo, '2026-12')).toEqual(['2026-12-12']);
    expect(dueDatesIn(everyTwo, '2027-01')).toEqual([]);
  });

  it('lists every weekly date of the month', () => {
    const weekly = rule('r', { starts_on: '2026-11-02', frequency: 'weekly' });
    expect(dueDatesIn(weekly, '2026-12')).toEqual(['2026-12-07', '2026-12-14', '2026-12-21', '2026-12-28']);
    expect(dueDatesIn(rule('r', { starts_on: '2026-11-02', frequency: 'weekly', interval: 2 }), '2026-12')).toEqual(['2026-12-14', '2026-12-28']);
  });

  it('respects the start and the end of the rule', () => {
    expect(dueDatesIn(rule('r', { starts_on: '2027-02-10' }), '2027-01')).toEqual([]);
    expect(dueDatesIn(rule('r', { starts_on: '2026-01-05', ends_on: '2026-12-31' }), '2027-01')).toEqual([]);
    expect(dueDatesIn(rule('r', { starts_on: '2026-12-20', frequency: 'weekly', ends_on: '2027-01-05' }), '2027-01')).toEqual(['2027-01-03']);
  });
});

describe('monthlyAverage (spec 009 REQ-10.1)', () => {
  it('spreads each live rule over a month, by type, rounded down to whole units', () => {
    const rules = [
      rule('rent', { amount: 650000 }),
      rule('power', { amount: 85000, interval: 2 }),
      rule('weekly', { amount: 10000, frequency: 'weekly' }),
      rule('insurance', { amount: 240000, frequency: 'yearly' }),
      rule('salary', { amount: 2800000, type: 'income' }),
      rule('ended', { amount: 999000, next_date: null }),
    ];
    expect(monthlyAverage(rules, 3)).toEqual({ expense: 755000, income: 2800000 });
  });
});
