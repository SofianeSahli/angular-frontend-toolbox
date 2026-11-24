import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';

export const TRANSLATION_FOLDERS = ['/i18n/', '/i18n/identity/', '/i18n/errors/'];

function isObject(value: unknown): value is TranslationObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function deepMerge(target: TranslationObject, source: TranslationObject): TranslationObject {
  const merged: TranslationObject = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const existing = merged[key];
    merged[key] = isObject(existing) && isObject(value) ? deepMerge(existing, value) : value;
  }
  return merged;
}

@Injectable()
export class MergedTranslateLoader implements TranslateLoader {
  private readonly http = inject(HttpClient);

  getTranslation(language: string): Observable<TranslationObject> {
    const files = TRANSLATION_FOLDERS.map((folder) =>
      this.http.get<TranslationObject>(`${folder}${language}.json`).pipe(catchError(() => of<TranslationObject>({}))),
    );
    return forkJoin(files).pipe(map((translations) => translations.reduce(deepMerge, {})));
  }
}
