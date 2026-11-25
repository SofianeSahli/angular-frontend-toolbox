import { toBudget } from '../data/mappers';
import { budgetDto, lineDto } from '../testing';
import { overallPercent, overallState, overviewLines } from './overview';

describe('overview (spec 008 REQ-9.12)', () => {
  it('sorts lines by percent, highest first, with an unplanned overspend on top', () => {
    const lines = toBudget(
      budgetDto({
        lines: [
          lineDto('a', { percent: 40, status: 'ok' }),
          lineDto('b', { percent: 160, status: 'over' }),
          lineDto('c', { percent: null, status: 'over', planned: 0 }),
          lineDto('d', { percent: 90, status: 'warning' }),
          lineDto('e', { percent: 40, status: 'ok' }),
          lineDto('f', { percent: null, status: 'ok', planned: 0, actual: 0 }),
        ],
      }),
    ).lines;
    expect(overviewLines(lines).map((line) => line.category)).toEqual(['c', 'b', 'd', 'a', 'e', 'f']);
  });

  it('does not change the order of its input', () => {
    const lines = toBudget(budgetDto()).lines;
    const before = lines.map((line) => line.category);
    overviewLines(lines);
    expect(lines.map((line) => line.category)).toEqual(before);
  });

  it('is ok below 85 %, warning from 85 % to 100 %, over above 100 %', () => {
    expect(overallState(84, 100)).toBe('ok');
    expect(overallState(85, 100)).toBe('warning');
    expect(overallState(100, 100)).toBe('warning');
    expect(overallState(101, 100)).toBe('over');
  });

  it('is over for spending against a plan of zero and ok for none', () => {
    expect(overallState(10, 0)).toBe('over');
    expect(overallState(0, 0)).toBe('ok');
  });

  it('rounds the percent and gives none without a plan', () => {
    expect(overallPercent(2, 3)).toBe(67);
    expect(overallPercent(5, 0)).toBeNull();
  });
});
