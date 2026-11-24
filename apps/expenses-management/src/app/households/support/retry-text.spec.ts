import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import fr from '../../../../public/i18n/fr.json';
import { retryText } from './retry-text';

describe('retryText', () => {
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService({ lang: 'fr' })] });
    translate = TestBed.inject(TranslateService);
    translate.setTranslation('fr', fr);
  });

  it.each([
    [1, '1 s'],
    [45, '45 s'],
    [60, '1 min'],
    [61, '2 min'],
    [3599, '60 min'],
    [3600, '1 h'],
    [7300, '3 h'],
  ])('turns %i seconds into %s', (seconds, text) => {
    expect(retryText(translate, seconds)).toBe(text);
  });

  it('falls back to one second when the delay is unknown', () => {
    expect(retryText(translate, null)).toBe('1 s');
  });
});
