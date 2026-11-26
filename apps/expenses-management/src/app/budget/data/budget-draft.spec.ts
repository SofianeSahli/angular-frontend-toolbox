import { NO_PLAN, budget, lineDto } from '../testing';
import { BudgetDraft, overlaps } from './budget-draft';

const ORDER = ['food', 'food.groceries', 'home', 'home.housing', 'transport', 'entertainment', 'entertainment.outings'];
const position = (code: string) => ORDER.indexOf(code);

function draft(): BudgetDraft {
  const result = new BudgetDraft(3, position);
  result.reset(budget());
  return result;
}

describe('BudgetDraft (spec 008 REQ-5.3–5.6)', () => {
  it('starts from the answer, untouched', () => {
    const value = draft();
    expect(value.lines().map((line) => [line.category, line.text])).toEqual([
      ['food', '600,000'],
      ['home.housing', '400,000'],
      ['transport', '100,000'],
      ['entertainment.outings', '0,000'],
    ]);
    expect(value.income()).toBe('2500,000');
    expect(value.saving()).toBe('300,000');
    expect(value.dirty()).toBe(false);
  });

  it('starts empty for a month without a plan', () => {
    const value = new BudgetDraft(3, position);
    value.reset(NO_PLAN);
    expect(value.isEmpty()).toBe(true);
    expect(value.toInput()).toEqual({ expectedIncome: null, plannedSaving: null, lines: [] });
  });

  it('becomes dirty on a change and clean when it is undone', () => {
    const value = draft();
    value.setLine('food', '650');
    expect(value.dirty()).toBe(true);
    value.setLine('food', '600,000');
    expect(value.dirty()).toBe(false);
  });

  it('refuses a category overlapping a line: the same, its parent or its child', () => {
    const value = draft();
    expect(value.canAdd('food')).toBe(false);
    expect(value.canAdd('food.groceries')).toBe(false);
    expect(value.canAdd('home')).toBe(false);
    expect(value.canAdd('entertainment')).toBe(false);
    expect(value.canAdd('health')).toBe(true);
    expect(overlaps('food', 'foodtruck')).toBe(false);
  });

  it('adds lines in category-tree order and removes them', () => {
    const value = new BudgetDraft(3, position);
    value.reset(NO_PLAN);
    value.addLine('transport');
    value.addLine('food');
    expect(value.lines().map((line) => line.category)).toEqual(['food', 'transport']);
    expect(value.addLine('food.groceries')).toBe(false);
    value.removeLine('food');
    expect(value.lines().map((line) => line.category)).toEqual(['transport']);
  });

  it.each([
    [3, 90000, '90,000'],
    [2, 9050, '90,50'],
    [0, 90, '90'],
  ])('prefills an added line with the amount spent, exponent %i (REQ-9.13)', (exponent, minor, text) => {
    const value = new BudgetDraft(exponent, position);
    value.reset(NO_PLAN);
    expect(value.dirty()).toBe(false);
    expect(value.addLine('health', minor)).toBe(true);
    expect(value.lines()).toEqual([{ category: 'health', text, retired: false }]);
    expect(value.dirty()).toBe(true);
    expect(value.lineErrors().size).toBe(0);
    expect(value.toInput()?.lines).toEqual([{ category: 'health', planned: minor }]);
  });

  it('still refuses an overlapping category when an amount is given', () => {
    const value = draft();
    expect(value.addLine('food.groceries', 500)).toBe(false);
    expect(value.lines().some((line) => line.category === 'food.groceries')).toBe(false);
  });

  it('recomputes the planned total locally, accepting 0', () => {
    const value = draft();
    expect(value.plannedTotal()).toBe(1100000);
    value.setLine('transport', '0');
    expect(value.plannedTotal()).toBe(1000000);
    expect(value.lineErrors().size).toBe(0);
  });

  it('reports parse errors per field and builds no input until they are fixed', () => {
    const value = draft();
    value.setLine('food', 'abc');
    value.setIncome('1,2345');
    expect(value.lineErrors().get('food')).toBe('invalid');
    expect(value.incomeError()).toBe('too_many_decimals');
    expect(value.toInput()).toBeNull();
  });

  it('requires a value on a new line', () => {
    const value = new BudgetDraft(3, position);
    value.reset(NO_PLAN);
    value.addLine('food');
    expect(value.lineErrors().get('food')).toBe('empty');
  });

  it('sends empty income and saving as null and full precision lines', () => {
    const value = draft();
    value.setIncome('');
    value.setSaving(' ');
    value.setLine('food', '612,5');
    expect(value.toInput()).toEqual({
      expectedIncome: null,
      plannedSaving: null,
      lines: [
        { category: 'food', planned: 612500 },
        { category: 'home.housing', planned: 400000 },
        { category: 'transport', planned: 100000 },
        { category: 'entertainment.outings', planned: 0 },
      ],
    });
  });

  it('keeps the retired mark of a line', () => {
    const value = new BudgetDraft(3, position);
    value.reset(budget({ lines: [lineDto('food', { retired: true })] }));
    expect(value.lines()[0].retired).toBe(true);
  });

  it('counts the changed lines, income and saving, and discards them (spec 009 REQ-9.5)', () => {
    const draft = new BudgetDraft(3, () => 0);
    draft.reset(budget());
    expect(draft.changeCount()).toBe(0);
    draft.setLine('food', '650');
    draft.removeLine('transport');
    draft.addLine('health');
    draft.setIncome('');
    expect(draft.changeCount()).toBe(4);
    draft.discard();
    expect(draft.changeCount()).toBe(0);
    expect(draft.dirty()).toBe(false);
  });
});
