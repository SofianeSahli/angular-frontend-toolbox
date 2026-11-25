import { FormControl, FormGroup } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import fr from '../../../../public/i18n/fr.json';
import { fieldMessage, householdsMessage, showOnField } from './server-errors';

describe('server errors', () => {
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService({ lang: 'fr' })] });
    translate = TestBed.inject(TranslateService);
    translate.setTranslation('fr', fr);
  });

  const error = (code: string, retry: number | null = null) => new ApiError('conflict', 422, code, {}, retry, 'r');

  it('uses the message of a known code', () => {
    expect(householdsMessage(translate, error('household.member_limit'))).toBe(fr.households.errors.household.member_limit);
  });

  it('puts the delay in a throttled message', () => {
    expect(householdsMessage(translate, error('request.throttled', 90))).toContain('2 min');
  });

  it('falls back to the generic message for an unknown code', () => {
    expect(householdsMessage(translate, error('something.else'))).toBe(fr.households.errors.generic);
  });

  it('translates the first code of a field, or null when the field has none', () => {
    const invalid = new ApiError('validation', 422, 'validation.failed', { name: ['name.max', 'name.string'], other: ['x.y'] }, null, 'r');
    expect(fieldMessage(translate, invalid, 'name')).toBe(fr.households.fields.name.max);
    expect(fieldMessage(translate, invalid, 'other')).toBe(fr.households.fields.generic);
    expect(fieldMessage(translate, invalid, 'email')).toBeNull();
  });

  it('shows a message on a field and marks it touched', () => {
    const form = new FormGroup({ name: new FormControl('') });
    showOnField(form, 'name', 'Oups');
    expect(form.controls.name.errors).toEqual({ server: { message: 'Oups' } });
    expect(form.controls.name.touched).toBe(true);
  });

  it('ignores an unknown field', () => {
    const form = new FormGroup({ name: new FormControl('') });
    expect(() => showOnField(form, 'other', 'Oups')).not.toThrow();
  });
});
