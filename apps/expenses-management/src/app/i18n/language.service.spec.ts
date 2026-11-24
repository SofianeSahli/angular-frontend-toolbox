import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { Account, AccountLocale, SessionStore } from '@shared/identity-data-access';
import { LANGUAGE_STORAGE_KEY, LanguageService } from './language.service';

function setup(saved: string | null = null) {
  if (saved === null) localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  else localStorage.setItem(LANGUAGE_STORAGE_KEY, saved);
  const account = signal<Account | null>(null);
  TestBed.configureTestingModule({ providers: [provideTranslateService({ fallbackLang: 'fr' }), { provide: SessionStore, useValue: { account } }] });
  const service = TestBed.inject(LanguageService);
  TestBed.tick();
  const signIn = (locale: AccountLocale) => {
    account.set({ id: 'a1', name: 'Amira', email: 'amira@exemple.com', phone: null, locale, twoFactorEnabled: false });
    TestBed.tick();
  };
  return { service, signIn, translate: TestBed.inject(TranslateService) };
}

describe('LanguageService', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts in French with a left-to-right page', () => {
    const { service, translate } = setup();
    expect(service.language()).toBe('fr');
    expect(translate.getCurrentLang()).toBe('fr');
    expect(document.documentElement.lang).toBe('fr');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('restores the language saved on the device', () => {
    const { service } = setup('en');
    expect(service.language()).toBe('en');
  });

  it('falls back to French for an unknown saved language', () => {
    const { service } = setup('de');
    expect(service.language()).toBe('fr');
  });

  it('falls back to French when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { service } = setup();
    expect(service.language()).toBe('fr');
    expect(() => service.use('en')).not.toThrow();
  });

  it('switches to Arabic: saves it, sets lang and a right-to-left page', () => {
    const { service, translate } = setup();
    service.use('ar');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ar');
    expect(translate.getCurrentLang()).toBe('ar');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it("follows the account's language after sign-in", () => {
    const { service, signIn } = setup('fr');
    signIn('en');
    expect(service.language()).toBe('en');
  });

  it('keeps Arabic when the account says French', () => {
    const { service, signIn } = setup('ar');
    signIn('fr');
    expect(service.language()).toBe('ar');
  });

  it('leaves Arabic for English when the account says English', () => {
    const { service, signIn } = setup('ar');
    signIn('en');
    expect(service.language()).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });
});
