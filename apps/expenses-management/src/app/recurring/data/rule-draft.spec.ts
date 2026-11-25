import { rule } from '../testing';
import { RuleForm, diffRule, emptyRuleForm, formFromRule, isEmptyRulePatch, toRuleInput } from './rule-draft';

const PLAIN = { exponent: 3, isOther: false };
const OTHER = { exponent: 3, isOther: true };

function form(overrides: Partial<RuleForm> = {}): RuleForm {
  return { ...formFromRule(rule('r1'), 3), ...overrides };
}

describe('rule-draft (spec 008 REQ-6.3, 6.5)', () => {
  it('starts a new rule monthly, every 1, from today, without end', () => {
    expect(emptyRuleForm('2026-11-25')).toEqual({
      amount: '',
      category: null,
      otherName: '',
      comment: '',
      frequency: 'monthly',
      interval: 1,
      startsOn: '2026-11-25',
      endsOn: '',
    });
  });

  it('fills the form from a rule', () => {
    expect(formFromRule(rule('r1', { ends_on: '2027-06-30' }), 3)).toMatchObject({ amount: '850,000', endsOn: '2027-06-30', comment: 'Loyer' });
  });

  it('builds the request, an empty end becoming null', () => {
    expect(toRuleInput(form({ comment: '  ' }), PLAIN)).toEqual({
      amount: 850000,
      category: 'food.groceries.supermarket',
      otherName: null,
      comment: null,
      frequency: 'monthly',
      interval: 1,
      startsOn: '2026-01-31',
      endsOn: null,
    });
  });

  it('keeps the trimmed other name only on an Other leaf', () => {
    expect(toRuleInput(form({ category: 'food.groceries.other', otherName: ' Garage ' }), OTHER)?.otherName).toBe('Garage');
    expect(toRuleInput(form({ otherName: 'Garage' }), PLAIN)?.otherName).toBeNull();
  });

  it('refuses a draft without a valid amount or a category', () => {
    expect(toRuleInput(form({ amount: '0' }), PLAIN)).toBeNull();
    expect(toRuleInput(form({ category: null }), PLAIN)).toBeNull();
    expect(diffRule(rule('r1'), form({ amount: 'abc' }), PLAIN)).toBeNull();
  });

  it('sends nothing when nothing changed', () => {
    const patch = diffRule(rule('r1'), form(), PLAIN);
    expect(patch).toEqual({});
    expect(isEmptyRulePatch(patch ?? {})).toBe(true);
  });

  it('sends only the changed fields', () => {
    expect(diffRule(rule('r1'), form({ amount: '900', frequency: 'weekly', interval: 2 }), PLAIN)).toEqual({
      amount: 900000,
      frequency: 'weekly',
      interval: 2,
    });
  });

  it('sends ends_on null to remove the end, and a date to set it', () => {
    expect(diffRule(rule('r1', { ends_on: '2027-01-31' }), form({ endsOn: '' }), PLAIN)).toEqual({ endsOn: null });
    expect(diffRule(rule('r1'), form({ endsOn: '2027-06-30' }), PLAIN)).toEqual({ endsOn: '2027-06-30' });
  });

  it('sends the other name with a new Other category, or alone when only it changed', () => {
    expect(diffRule(rule('r1'), form({ category: 'food.groceries.other', otherName: 'Marché' }), OTHER)).toEqual({
      category: 'food.groceries.other',
      otherName: 'Marché',
    });
    const other = rule('r2', { category: 'food.groceries.other', other_name: 'Marché' });
    expect(diffRule(other, { ...formFromRule(other, 3), otherName: 'Épicerie' }, OTHER)).toEqual({ otherName: 'Épicerie' });
  });

  it('clears the comment with null', () => {
    expect(diffRule(rule('r1'), form({ comment: '' }), PLAIN)).toEqual({ comment: null });
  });
});
