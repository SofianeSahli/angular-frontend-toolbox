import { TranslateService } from '@ngx-translate/core';
import { AccountLocale } from '@shared/identity-data-access';

const ACCOUNT_LOCALES: readonly string[] = ['fr', 'en'] satisfies AccountLocale[];
const FALLBACK_LOCALE: AccountLocale = 'fr';

export function accountLocaleOf(translate: TranslateService): AccountLocale {
  const language = translate.getCurrentLang();
  return ACCOUNT_LOCALES.includes(language) ? (language as AccountLocale) : FALLBACK_LOCALE;
}
