import { ChangeDetectorRef, effect, inject } from '@angular/core';
import { AbstractControl } from '@angular/forms';

/**
 * Keeps an OnPush form-control component in sync with the AbstractControl it
 * displays: any change of value, status (valid/invalid), touched or pristine
 * state — for example a parent calling `form.markAllAsTouched()` on submit —
 * redraws the component.
 *
 * Call it in a constructor (it needs an injection context).
 * spec 001 T12, REQ-3.5c.
 */
export function redrawOnControlEvents(
  control: () => AbstractControl | null | undefined
): void {
  const cdr = inject(ChangeDetectorRef);
  effect((onCleanup) => {
    const current = control();
    if (!current) return;
    const subscription = current.events.subscribe(() => cdr.markForCheck());
    onCleanup(() => subscription.unsubscribe());
  });
}
