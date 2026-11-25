import { addMonths, currentMonth, lastDayOf, maxMonth, monthFromQuery, positionOf } from './month-context';

describe('month-context (spec 008 REQ-1.1, 1.2, 8.6)', () => {
  const today = '2026-11-25';

  it('defaults to the current month when mois is absent or invalid', () => {
    for (const value of [null, undefined, '', '2026-13', '2026-1', 'novembre', '2026-11-01']) {
      expect(monthFromQuery(value, today)).toBe('2026-11');
    }
  });

  it('keeps a valid month in range', () => {
    expect(monthFromQuery('2025-02', today)).toBe('2025-02');
    expect(monthFromQuery('2027-11', today)).toBe('2027-11');
  });

  it('clamps mois to 2000-01 … current month + 12', () => {
    expect(monthFromQuery('1999-12', today)).toBe('2000-01');
    expect(monthFromQuery('2027-12', today)).toBe('2027-11');
    expect(maxMonth(today)).toBe('2027-11');
  });

  it('moves across years', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-11', 12)).toBe('2027-11');
  });

  it('knows the last day and where a month stands', () => {
    expect(lastDayOf('2028-02')).toBe('2028-02-29');
    expect(currentMonth(today)).toBe('2026-11');
    expect([positionOf('2026-10', today), positionOf('2026-11', today), positionOf('2026-12', today)]).toEqual(['past', 'current', 'future']);
  });
});
