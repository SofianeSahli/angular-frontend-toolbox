import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

export const INTERVALS: readonly number[] = Array.from({ length: 12 }, (_, index) => index + 1);

export function rangeValidator(
  code: string,
  bounds: (control: AbstractControl<string>) => { min: string | null; max: string | null },
  required: boolean,
  translate: TranslateService,
): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value ?? '';
    const { min, max } = bounds(control);
    const failure = (suffix: string) => ({ range: { message: translate.instant(`recurring.fields.${code}.${suffix}`) } });
    if (value === '') return required ? failure('required') : null;
    if (min !== null && value < min) return failure('after_or_equal');
    if (max !== null && value > max) return failure('before_or_equal');
    return null;
  };
}
