import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AccountLocale, SessionStore } from '@shared/identity-data-access';

export type AppLanguage = 'fr' | 'en' | 'ar';

export const APP_LANGUAGES: readonly AppLanguage[] = ['fr', 'en', 'ar'];
export const LANGUAGE_STORAGE_KEY = 'ui.lang';
const DEFAULT_LANGUAGE: AppLanguage = 'fr';
const RIGHT_TO_LEFT: ReadonlySet<AppLanguage> = new Set(['ar']);

export const LANGUAGE_NAMES: Readonly<Record<AppLanguage, string>> = { fr: 'Français', en: 'English', ar: 'العربية' };

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && (APP_LANGUAGES as readonly string[]).includes(value);
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);
  private readonly storage = this.document.defaultView?.localStorage;
  private readonly current = signal<AppLanguage>(this.savedLanguage());

  readonly language = this.current.asReadonly();

  constructor() {
    this.apply(this.current());
    const store = inject(SessionStore);
    effect(() => {
      const locale = store.account()?.locale;
      if (locale) untracked(() => this.followAccount(locale));
    });
  }

  use(language: AppLanguage): void {
    this.current.set(language);
    this.save(language);
    this.apply(language);
  }

  private followAccount(locale: AccountLocale): void {
    const keepsArabicUntilTheBackendAcceptsIt = this.current() === 'ar' && locale === 'fr';
    if (keepsArabicUntilTheBackendAcceptsIt || this.current() === locale) return;
    this.use(locale);
  }

  private apply(language: AppLanguage): void {
    this.translate.use(language).subscribe({ error: () => undefined });
    const root = this.document.documentElement;
    root.lang = language;
    root.dir = RIGHT_TO_LEFT.has(language) ? 'rtl' : 'ltr';
  }

  private savedLanguage(): AppLanguage {
    try {
      const saved = this.storage?.getItem(LANGUAGE_STORAGE_KEY);
      return isAppLanguage(saved) ? saved : DEFAULT_LANGUAGE;
    } catch {
      return DEFAULT_LANGUAGE;
    }
  }

  private save(language: AppLanguage): void {
    try {
      this.storage?.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      return;
    }
  }
}
