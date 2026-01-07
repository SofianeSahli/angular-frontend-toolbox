import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Generates a regex-based validator for use in Angular forms
 * @param pattern - Regular expression to validate against
 * @param errorKey - Custom error key to return on validation failure
 */
export const regexValidator = (pattern: RegExp, errorKey: string): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null; // Don't validate empty values (use required separately)
    return pattern.test(control.value) ? null : { [errorKey]: true };
  };
}
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PHONE_REGEX = /^\d{8}$/;
export const USERNAME_VALIDATOR = /^[a-z0-9._-]+$/;

export function usernameValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value || control.value === '') {
    return null;
  }

  const value = control.value;
  const isValid = USERNAME_VALIDATOR.test(value);

  if (isValid) {
    return null;
  }

  return {
    invalidUsername: {
      message: 'errors.username_malformated',
      value: value,
      allowedPattern: 'a-z 0-9 . - _',
      invalidCharacters: getInvalidCharacters(value)
    }
  };
}

function getInvalidCharacters(username: string): string {
  const invalidChars = username.split('').filter(char =>
    !char.match(/[a-z0-9._-]/)
  );
  return [...new Set(invalidChars)].join(', ');
}

export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const passwordConfirmation = control.get('password_confirmation');

    if (!password || !passwordConfirmation) {
      return null;
    }

    if (!password.value || !passwordConfirmation.value) {
      return null;
    }

    const mismatch = password.value !== passwordConfirmation.value;

    return mismatch ? {
      passwordMismatch: {
        message: 'Passwords do not match',
        isDirty: passwordConfirmation.dirty
      }
    } : null;
  };
}

export function minDateValidator(minDate: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || !minDate) return null;

    const selectedDate = new Date(control.value);
    const min = new Date(minDate);

    return selectedDate < min ? { minDate: { required: minDate, actual: control.value } } : null;
  };
}

// Validateur pour date maximum
export function maxDateValidator(maxDate: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || !maxDate) return null;

    const selectedDate = new Date(control.value);
    const max = new Date(maxDate);

    return selectedDate > max ? { maxDate: { required: maxDate, actual: control.value } } : null;
  };
}

// Validateur pour plage de dates (start_date < end_date)
export function dateRangeValidator(startDateControlName: string, endDateControlName: string): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const startDate = formGroup.get(startDateControlName)?.value;
    const endDate = formGroup.get(endDateControlName)?.value;

    if (!startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return {
        invalidDateRange: {
          message: 'La date de début doit être antérieure à la date de fin'
        }
      };
    }

    return null;
  };
}