import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';

export const SERVER_ERROR_TEMPLATE: Readonly<Record<string, string>> = { server: '{{message}}' };

export function serverMessage(translate: TranslateService, code: string, field?: string): string {
  const candidates = [`identity.errors.${code}`, ...(field ? [`identity.errors.fields.${field}`] : []), 'identity.errors.generic'];
  const key = candidates.find((candidate) => translate.instant(candidate) !== candidate) ?? 'identity.errors.generic';
  return translate.instant(key);
}

export function showOnField(form: FormGroup, field: string, message: string): void {
  const control = form.get(field);
  if (!control) return;
  control.setErrors({ server: { message } });
  control.markAsTouched();
}

export function applyServerErrors(form: FormGroup, error: ApiError, translate: TranslateService): boolean {
  let applied = false;
  for (const [field, codes] of Object.entries(error.fields)) {
    if (!form.get(field) || codes.length === 0) continue;
    showOnField(form, field, serverMessage(translate, codes[0], field));
    applied = true;
  }
  return applied;
}
