import { Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { merge, scan } from 'rxjs';

export function injectTranslationRevision(): Signal<number> {
  const translate = inject(TranslateService);
  return toSignal(merge(translate.onLangChange, translate.onTranslationChange).pipe(scan((n) => n + 1, 0)), { initialValue: 0 });
}
