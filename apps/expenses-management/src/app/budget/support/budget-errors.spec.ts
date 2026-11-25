import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import fr from '../../../../public/i18n/fr.json';
import { budgetFieldErrors, budgetReaction, parseMessage, throttledMessage } from './budget-errors';

function translate(): TranslateService {
  TestBed.configureTestingModule({ providers: [provideTranslateService({ lang: 'fr' })] });
  const service = TestBed.inject(TranslateService);
  service.setTranslation('fr', fr);
  return service;
}

const failure = (code: string, fields: Record<string, string[]> = {}, retry: number | null = null) =>
  new ApiError('validation', 422, code, fields, retry, 'r1');

describe('budget-errors (spec 008 REQ-5.7, 5.9)', () => {
  it('maps each code to its reaction', () => {
    expect(budgetReaction(failure('validation.failed'))).toBe('fields');
    expect(budgetReaction(failure('book.not_found'))).toBe('bookGone');
    expect(budgetReaction(failure('request.throttled'))).toBe('throttled');
    expect(budgetReaction(failure('http.offline'))).toBe('offline');
    expect(budgetReaction(failure('budget.not_empty'))).toBe('notEmpty');
    expect(budgetReaction(failure('budget.nothing_to_copy'))).toBe('nothingToCopy');
    expect(budgetReaction(failure('http.unknown'))).toBe('presenter');
  });

  it('puts line codes on the line sent at that position', () => {
    const errors = budgetFieldErrors(
      failure('validation.failed', { 'lines.1.category': ['lines.category.not_plannable'], 'lines.2.planned': ['lines.planned.min'] }),
      ['food', 'food.groceries.bakery', 'transport'],
      translate(),
    );
    expect(Object.keys(errors.lines)).toEqual(['food.groceries.bakery', 'transport']);
    expect(errors.lines['food.groceries.bakery'].category).toBe(fr.budget.fields.lines.category.not_plannable);
    expect(errors.lines['transport'].planned).toBe(fr.budget.fields.lines.planned.min);
  });

  it('puts income and saving codes on their fields, the rest in an alert', () => {
    const errors = budgetFieldErrors(
      failure('validation.failed', { expected_income: ['expected_income.max'], planned_saving: ['planned_saving.integer'], lines: ['lines.max'], replace: ['replace.boolean'] }),
      [],
      translate(),
    );
    expect(errors.income).toBe(fr.budget.fields.expected_income.max);
    expect(errors.saving).toBe(fr.budget.fields.planned_saving.integer);
    expect(errors.alerts).toEqual([fr.budget.fields.lines.max, fr.budget.fields.generic]);
  });

  it('covers every code of the contract field table', () => {
    const codes = [
      'expected_income.integer',
      'expected_income.min',
      'expected_income.max',
      'planned_saving.integer',
      'planned_saving.min',
      'planned_saving.max',
      'lines.present',
      'lines.array',
      'lines.max',
      'lines.category.required',
      'lines.category.string',
      'lines.category.distinct',
      'lines.category.not_found',
      'lines.category.not_plannable',
      'lines.category.not_expense',
      'lines.category.overlaps',
      'lines.category.retired',
      'lines.planned.required',
      'lines.planned.integer',
      'lines.planned.min',
      'lines.planned.max',
      'month.date_format',
      'month.after_or_equal',
      'month.before_or_equal',
    ];
    const service = translate();
    for (const code of codes) expect(service.instant(`budget.fields.${code}`)).not.toBe(`budget.fields.${code}`);
  });

  it('words parse errors and the throttle delay', () => {
    const service = translate();
    expect(parseMessage(service, 'too_many_decimals')).toBe(fr.budget.amount.too_many_decimals);
    expect(throttledMessage(service, failure('request.throttled', {}, 30))).toContain('30');
  });
});
