import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { UI_TEXT } from '@shared/ui-tokens';
import ar from '../../../public/i18n/ar.json';
import fr from '../../../public/i18n/fr.json';
import { provideTranslatedUiText } from './translated-ui-text';

describe('provideTranslatedUiText', () => {
  it('reads the toolbox texts from the current language, and follows a language change', () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService({ lang: 'fr' }), provideTranslatedUiText()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('fr', fr);
    translate.setTranslation('ar', ar);
    const text = TestBed.inject(UI_TEXT);
    expect(text.close).toBe('Fermer');
    expect(text.errors.minlength).toBe('{{requiredLength}} caractères minimum.');

    translate.use('ar');
    expect(text.close).toBe('إغلاق');
    expect(text.errors.required).toBe('هذا الحقل مطلوب.');
  });

  it('keeps the built-in French text when a key is missing', () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService({ lang: 'en' }), provideTranslatedUiText()] });
    TestBed.inject(TranslateService).setTranslation('en', {});
    expect(TestBed.inject(UI_TEXT).back).toBe('Retour');
  });
});
