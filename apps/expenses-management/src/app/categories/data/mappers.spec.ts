import { TREE_DTO } from '../testing';
import { toTop } from './mappers';

describe('category mappers', () => {
  it('maps the tree to camelCase, keeping the order', () => {
    const food = toTop(TREE_DTO[1]);
    expect(food).toMatchObject({
      code: 'food',
      key: 'categories.food.label',
      emoji: '🛒',
      type: 'expense',
      retired: false,
    });
    expect(food.groups[0].leaves.map((leaf) => leaf.code)).toEqual([
      'food.groceries.supermarket',
      'food.groceries.bakery',
      'food.groceries.old',
      'food.groceries.other',
    ]);
    expect(food.groups[0].leaves[3]).toEqual({
      code: 'food.groceries.other',
      key: 'categories.food.groceries.other.label',
      emoji: '📝',
      retired: false,
      isOther: true,
    });
  });
});
