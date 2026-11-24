import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { UiButton, UiInput } from '@shared/ui-atoms';
import { UiFormField } from '@shared/ui-molecules';
import { SERVER_ERROR_TEMPLATE, showOnField } from '../support/server-errors';

const EMAIL_MAX_LENGTH = 255;

@Component({
  selector: 'app-invite-form',
  imports: [ReactiveFormsModule, TranslatePipe, UiButton, UiFormField, UiInput],
  template: `
    <form class="d-flex flex-column gap-2" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <ui-form-field [label]="'households.household.invite.email' | translate" required [errors]="serverErrors">
        <input uiInput formControlName="email" type="email" dir="ltr" autocomplete="off" [attr.maxlength]="maxLength" />
      </ui-form-field>
      <div>
        <button uiButton variant="primary" type="submit" [loading]="busy()">{{ 'households.household.invite.submit' | translate }}</button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteForm {
  readonly busy = input(false);
  readonly serverError = input<string | null>(null);
  readonly invite = output<string>();

  protected readonly maxLength = EMAIL_MAX_LENGTH;
  protected readonly serverErrors = SERVER_ERROR_TEMPLATE;
  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(EMAIL_MAX_LENGTH)]],
  });

  constructor() {
    effect(() => {
      const message = this.serverError();
      if (message !== null) showOnField(this.form, 'email', message);
    });
  }

  clear(): void {
    this.form.reset();
  }

  protected submit(): void {
    if (this.busy()) return;
    const control = this.form.controls.email;
    const email = control.value.trim();
    control.setValue(email);
    if (control.invalid || email === '') {
      this.form.markAllAsTouched();
      return;
    }
    this.invite.emit(email);
  }
}
