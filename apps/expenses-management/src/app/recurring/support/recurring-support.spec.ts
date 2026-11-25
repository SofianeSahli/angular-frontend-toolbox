import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import fr from '../../../../public/i18n/fr.json';
import { frequencyText } from './frequency-text';
import { refusesRuleCategory, ruleFieldMessages, ruleReaction } from './rule-errors';

function translate(): TranslateService {
  TestBed.configureTestingModule({ providers: [provideTranslateService({ lang: 'fr' })] });
  const service = TestBed.inject(TranslateService);
  service.setTranslation('fr', fr);
  return service;
}

const failure = (code: string, fields: Record<string, string[]> = {}) => new ApiError('validation', 422, code, fields, null, 'r1');

describe('recurring support (spec 008 REQ-6.1, 6.5)', () => {
  it('words the frequency with its interval', () => {
    const service = translate();
    expect(frequencyText(service, 'monthly', 1)).toBe('Chaque mois');
    expect(frequencyText(service, 'weekly', 2)).toBe('Toutes les 2 semaines');
    expect(frequencyText(service, 'yearly', 3)).toBe('Tous les 3 ans');
  });

  it('maps each code to its reaction', () => {
    expect(ruleReaction(failure('validation.failed'))).toBe('fields');
    expect(ruleReaction(failure('recurring_rule.limit_reached'))).toBe('limit');
    expect(ruleReaction(failure('recurring_rule.not_found'))).toBe('ruleGone');
    expect(ruleReaction(failure('book.not_found'))).toBe('bookGone');
    expect(ruleReaction(failure('request.throttled'))).toBe('throttled');
    expect(ruleReaction(failure('http.offline'))).toBe('offline');
    expect(ruleReaction(failure('x'))).toBe('presenter');
  });

  it('puts every code of the field table on its field', () => {
    const service = translate();
    const codes: Record<string, string[]> = {
      amount: ['amount.min'],
      category: ['category.retired'],
      other_name: ['other_name.required'],
      comment: ['comment.max'],
      frequency: ['frequency.in'],
      interval: ['interval.max'],
      starts_on: ['starts_on.after_or_equal'],
      ends_on: ['ends_on.after_or_equal'],
    };
    const messages = ruleFieldMessages(failure('validation.failed', codes), service);
    expect(Object.keys(messages).sort()).toEqual(['amount', 'category', 'comment', 'endsOn', 'frequency', 'interval', 'otherName', 'startsOn']);
    expect(messages.frequency).toBe(fr.recurring.fields.frequency.in);
    expect(messages.startsOn).toBe(fr.recurring.fields.starts_on.after_or_equal);
    expect(messages.amount).toBe(fr.operations.fields.amount.min);
    expect(refusesRuleCategory(failure('validation.failed', codes))).toBe(true);
  });

  it('has a message for every recurring field code', () => {
    const service = translate();
    const codes = [
      'frequency.required',
      'frequency.in',
      'interval.required',
      'interval.integer',
      'interval.min',
      'interval.max',
      'starts_on.required',
      'starts_on.date_format',
      'starts_on.after_or_equal',
      'starts_on.before_or_equal',
      'ends_on.date_format',
      'ends_on.after_or_equal',
    ];
    for (const code of codes) expect(service.instant(`recurring.fields.${code}`)).not.toBe(`recurring.fields.${code}`);
  });
});
