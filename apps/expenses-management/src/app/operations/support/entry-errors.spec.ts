import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import fr from '../../../../public/i18n/fr.json';
import { entryFieldMessages, reactionTo, refusesCategory } from './entry-errors';

const apiError = (code: string, fields: Record<string, string[]> = {}) => new ApiError('validation', 422, code, fields, null, 'r1');

describe('entry errors (REQ-7.1–7.7, 8.3)', () => {
  it.each([
    ['validation.failed', 'fields'],
    ['book.not_found', 'bookGone'],
    ['transaction.not_found', 'entryGone'],
    ['transaction.id_conflict', 'idConflict'],
    ['request.throttled', 'throttled'],
    ['http.offline', 'offline'],
    ['server.error', 'presenter'],
  ])('%s → %s', (code, reaction) => {
    expect(reactionTo(apiError(code))).toBe(reaction);
  });

  it('spots a refused category', () => {
    expect(refusesCategory(apiError('validation.failed', { category: ['category.retired'] }))).toBe(true);
    expect(refusesCategory(apiError('validation.failed', { category: ['category.required'] }))).toBe(false);
  });

  it('translates every field code of REQ-7.1 onto its form field', () => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService({ lang: 'fr' })],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('fr', fr);
    const codes = [
      'amount.required',
      'amount.integer',
      'amount.min',
      'amount.max',
      'date.required',
      'date.date_format',
      'date.after_or_equal',
      'date.before_or_equal',
      'category.required',
      'category.string',
      'category.not_found',
      'category.not_leaf',
      'category.retired',
      'other_name.required',
      'other_name.prohibited',
      'other_name.string',
      'other_name.max',
      'comment.string',
      'comment.max',
      'id.uuid',
    ];
    for (const code of codes) expect(translate.instant(`operations.fields.${code}`)).not.toBe(`operations.fields.${code}`);
    const messages = entryFieldMessages(
      apiError('validation.failed', {
        other_name: ['other_name.max'],
        amount: ['amount.unknown_rule'],
      }),
      translate,
    );
    expect(messages.otherName).toBe(fr.operations.fields.other_name.max);
    expect(messages.amount).toBe(fr.operations.fields.generic);
  });
});
