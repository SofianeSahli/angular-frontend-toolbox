import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { retryText } from './retry-text';

export const SERVER_ERROR_TEMPLATE: Readonly<Record<string, string>> = { server: '{{message}}' };

export function householdsMessage(translate: TranslateService, error: ApiError): string {
  const key = `households.errors.${error.code}`;
  const params = { retry: retryText(translate, error.retryAfterSeconds) };
  return translate.instant(translate.instant(key) === key ? 'households.errors.generic' : key, params);
}

export function fieldMessage(translate: TranslateService, error: ApiError, field: string): string | null {
  const code = error.fields[field]?.[0];
  if (code === undefined) return null;
  const key = `households.fields.${code}`;
  return translate.instant(translate.instant(key) === key ? 'households.fields.generic' : key);
}

export function applyFieldErrors(form: FormGroup, error: ApiError, translate: TranslateService): boolean {
  let applied = false;
  for (const field of Object.keys(error.fields)) {
    const message = fieldMessage(translate, error, field);
    if (!form.get(field) || message === null) continue;
    showOnField(form, field, message);
    applied = true;
  }
  return applied;
}

export function showOnField(form: FormGroup, field: string, message: string): void {
  const control = form.get(field);
  if (!control) return;
  control.setErrors({ server: { message } });
  control.markAsTouched();
}
