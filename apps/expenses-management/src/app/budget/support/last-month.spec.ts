import { nodeDto, summary } from '../../dashboard/testing';
import { lastMonthActual } from './last-month';

const previous = summary({ categories: [nodeDto('food', 600000, 'expense', [nodeDto('food.groceries', 450000)]), nodeDto('transport', 400000)] });

describe('lastMonthActual (spec 008 REQ-9.14)', () => {
  it('gives the total of a top, children included', () => {
    expect(lastMonthActual(previous, 'food')).toBe(600000);
  });

  it('finds a group below a top', () => {
    expect(lastMonthActual(previous, 'food.groceries')).toBe(450000);
  });

  it('gives zero for a category without entries last month', () => {
    expect(lastMonthActual(previous, 'health')).toBe(0);
  });

  it('gives null when last month is unknown', () => {
    expect(lastMonthActual(null, 'food')).toBeNull();
  });
});
