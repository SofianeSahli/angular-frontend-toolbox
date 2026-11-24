import { Provider, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DEFAULT_UI_TEXT, UI_TEXT, UiText } from '@shared/ui-tokens';

function translatedTexts<T extends object>(defaults: T, prefix: string, translate: TranslateService): T {
  const texts = {};
  for (const [key, fallback] of Object.entries(defaults)) {
    const translationKey = `${prefix}.${key}`;
    if (typeof fallback === 'object' && fallback !== null) {
      Object.defineProperty(texts, key, { value: translatedTexts(fallback, translationKey, translate), enumerable: true });
      continue;
    }
    Object.defineProperty(texts, key, {
      enumerable: true,
      get: () => {
        const translated = translate.instant(translationKey);
        return translated === translationKey ? fallback : translated;
      },
    });
  }
  return texts as T;
}

export function provideTranslatedUiText(): Provider {
  return { provide: UI_TEXT, useFactory: (): UiText => translatedTexts(DEFAULT_UI_TEXT, 'ui', inject(TranslateService)) };
}
