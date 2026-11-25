import { nodeDto, summary } from '../../dashboard/testing';
import { offPlanCategories } from './off-plan';

const tree = summary({
  categories: [
    nodeDto('salary', 2500000, 'income'),
    nodeDto('food', 600000, 'expense', [nodeDto('food.groceries', 450000), nodeDto('food.restaurants', 150000)]),
    nodeDto('transport', 400000),
    nodeDto('health', 90000),
    nodeDto('leisure', 0),
  ],
});

describe('offPlanCategories (spec 008 REQ-9.13)', () => {
  it('lists the unplanned expense tops, largest first, without income', () => {
    expect(offPlanCategories(tree, [])).toEqual([
      { code: 'food', total: 600000 },
      { code: 'transport', total: 400000 },
      { code: 'health', total: 90000 },
    ]);
  });

  it('skips a planned top and everything under it', () => {
    expect(offPlanCategories(tree, ['food']).map((row) => row.code)).toEqual(['transport', 'health']);
  });

  it('keeps the unplanned remainder of a top when only a group under it is planned', () => {
    expect(offPlanCategories(tree, ['food.groceries'])).toContainEqual({ code: 'food', total: 150000 });
  });

  it('drops a top whose children are all planned', () => {
    expect(offPlanCategories(tree, ['food.groceries', 'food.restaurants']).map((row) => row.code)).toEqual(['transport', 'health']);
  });

  it('adds up to the off-plan amount of the backend', () => {
    const rows = offPlanCategories(tree, ['transport']);
    expect(rows.reduce((sum, row) => sum + row.total, 0)).toBe(600000 + 90000);
  });

  it('is empty for an empty month', () => {
    expect(offPlanCategories(summary({ categories: [] }), ['food'])).toEqual([]);
  });

  it('keeps the tree order for equal totals', () => {
    const equal = summary({ categories: [nodeDto('b', 100), nodeDto('a', 100)] });
    expect(offPlanCategories(equal, []).map((row) => row.code)).toEqual(['b', 'a']);
  });
});
