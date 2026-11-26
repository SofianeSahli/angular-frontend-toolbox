import { entry } from '../../operations/testing';
import { fixedBills, withoutFixed } from './fixed-bills';

describe('fixed bills (spec 009 REQ-6.2)', () => {
  const entries = [
    entry('rent', { date: '2026-11-01', amount: 650000, recurring_rule_id: 'r1' }),
    entry('power', { date: '2026-11-03', amount: 85000, recurring_rule_id: 'r2' }),
    entry('bread', { date: '2026-11-03', amount: 1500 }),
    entry('salary', { date: '2026-11-03', amount: 2800000, type: 'income', recurring_rule_id: 'r3' }),
    entry('october', { date: '2026-10-31', amount: 650000, recurring_rule_id: 'r1' }),
  ];

  it('keeps only the month expenses made by a rule', () => {
    const fixed = fixedBills(entries, '2026-11');
    expect(fixed.total).toBe(735000);
    expect([...fixed.byDay]).toEqual([
      [1, 650000],
      [3, 85000],
    ]);
  });

  it('takes the cumulative fixed amount out of each day', () => {
    const points = [
      { day: 1, value: 660000 },
      { day: 2, value: 670000 },
      { day: 3, value: 760000 },
    ];
    expect(withoutFixed(points, fixedBills(entries, '2026-11'))).toEqual([
      { day: 1, value: 10000 },
      { day: 2, value: 20000 },
      { day: 3, value: 25000 },
    ]);
  });
});
