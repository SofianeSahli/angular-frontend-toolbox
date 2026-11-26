import { nodeDto, summary } from '../../dashboard/testing';
import { topCategories } from './top-categories';

describe('topCategories (spec 008 REQ-3.3)', () => {
  it('keeps expense tops, sorted by total, with their share of the expense total', () => {
    const result = topCategories(summary());
    expect(result.rows).toEqual([
      { code: 'food', total: 600000, share: 0.6 },
      { code: 'transport', total: 400000, share: 0.4 },
    ]);
    expect(result.others).toBeNull();
  });

  it('cuts to six rows, the last one adding up the rest', () => {
    const categories = [100, 700, 300, 500, 200, 600, 400, 50].map((total, index) => nodeDto(`c${index}`, total));
    const result = topCategories(summary({ categories, totals: { income: 0, expense: 2850, saving: 0, balance: -2850, entries: 8 } }));
    expect(result.rows.map((row) => row.code)).toEqual(['c1', 'c5', 'c3', 'c6', 'c2']);
    expect(result.others).toEqual({ total: 350, share: 350 / 2850 });
  });

  it('gives a share of 0 when there is no expense', () => {
    const result = topCategories(summary({ categories: [nodeDto('food', 0)], totals: { income: 0, expense: 0, saving: 0, balance: 0, entries: 0 } }));
    expect(result.rows).toEqual([]);
  });
});
