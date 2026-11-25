import { entry } from '../testing';
import { EntryForm, diff, formFromEntry, isEmptyPatch, minorToMajorText, toInput } from './entry-draft';

const TND = { exponent: 3, isOther: false };
const OTHER = { exponent: 3, isOther: true };

const form = (overrides: Partial<EntryForm> = {}): EntryForm => ({
  amount: '12,500',
  category: 'food.groceries.supermarket',
  otherName: '',
  date: '2026-11-20',
  comment: '',
  ...overrides,
});

describe('entry draft (REQ-4.2, 6.2, 6.4)', () => {
  it.each([
    [12500, 3, '12,500'],
    [5, 3, '0,005'],
    [1250, 2, '12,50'],
    [1500, 0, '1500'],
  ])('%d with exponent %d reads %s', (minor, exponent, text) => {
    expect(minorToMajorText(minor, exponent)).toBe(text);
  });

  it('turns the form into a request, trimming and dropping the hidden "other" name', () => {
    expect(toInput('x1', form({ amount: '1 500', comment: '  hebdo ', otherName: 'stale' }), TND)).toEqual({
      id: 'x1',
      amount: 1500000,
      date: '2026-11-20',
      category: 'food.groceries.supermarket',
      otherName: null,
      comment: 'hebdo',
    });
    expect(toInput('x1', form({ category: 'food.groceries.other', otherName: ' Marché ' }), OTHER)?.otherName).toBe('Marché');
  });

  it('gives nothing while the amount or the category is invalid', () => {
    expect(toInput('x1', form({ amount: 'abc' }), TND)).toBeNull();
    expect(toInput('x1', form({ category: null }), TND)).toBeNull();
  });

  it('finds no change on an untouched form', () => {
    const saved = entry('e1', { comment: 'hebdo' });
    const patch = diff(saved, formFromEntry(saved, 3), TND);
    expect(patch !== null && isEmptyPatch(patch)).toBe(true);
  });

  it('sends only the changed fields, and null for a cleared comment', () => {
    const saved = entry('e1', { comment: 'hebdo' });
    expect(diff(saved, form({ amount: '13,250', comment: '   ' }), TND)).toEqual({ amount: 13250, comment: null });
    expect(diff(saved, form({ date: '2026-11-21', comment: 'hebdo' }), TND)).toEqual({ date: '2026-11-21' });
  });

  it('sends the "other" name with a move to an "Other" leaf', () => {
    const saved = entry('e1');
    expect(diff(saved, form({ category: 'food.groceries.other', otherName: 'Marché' }), OTHER)).toEqual({
      category: 'food.groceries.other',
      otherName: 'Marché',
    });
    expect(diff(saved, form({ category: 'salary.pay.monthly', otherName: 'stale' }), TND)).toEqual({ category: 'salary.pay.monthly' });
  });

  it('sends the stored "other" name only when it changed', () => {
    const saved = entry('e1', {
      category: 'food.groceries.other',
      other_name: 'Marché',
    });
    expect(diff(saved, formFromEntry(saved, 3), OTHER)).toEqual({});
    expect(diff(saved, { ...formFromEntry(saved, 3), otherName: 'Souk' }, OTHER)).toEqual({ otherName: 'Souk' });
  });
});
