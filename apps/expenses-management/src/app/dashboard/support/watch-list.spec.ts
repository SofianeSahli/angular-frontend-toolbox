import { budget, lineDto } from '../../budget/testing';
import { watchList } from './watch-list';

describe('watchList (spec 008 REQ-3.2)', () => {
  it('keeps warning and over, sorted by percent with null over first', () => {
    const { lines } = budget();
    expect(watchList(lines).map((line) => line.category)).toEqual(['entertainment.outings', 'transport', 'home.housing']);
  });

  it('keeps at most three lines and drops ok lines', () => {
    const { lines } = budget({
      lines: [
        lineDto('a', { status: 'ok', percent: 10 }),
        lineDto('b', { status: 'warning', percent: 86 }),
        lineDto('c', { status: 'over', percent: 120 }),
        lineDto('d', { status: 'warning', percent: 99 }),
        lineDto('e', { status: 'over', percent: 101 }),
      ],
    });
    expect(watchList(lines).map((line) => line.category)).toEqual(['c', 'e', 'd']);
  });

  it('keeps the tree order between equal percents', () => {
    const { lines } = budget({ lines: [lineDto('x', { percent: 90 }), lineDto('y', { percent: 90 })] });
    expect(watchList(lines).map((line) => line.category)).toEqual(['x', 'y']);
  });

  it('is empty when every line is ok', () => {
    expect(watchList(budget({ lines: [lineDto('a', { status: 'ok', percent: 20 })] }).lines)).toEqual([]);
  });
});
