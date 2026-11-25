import { ChangeDetectionStrategy, Component, OnInit, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { UiButton, UiInput } from '@shared/ui-atoms';
import { UiFormField } from '@shared/ui-molecules';
import { SERVER_ERROR_TEMPLATE, showOnField } from '../support/server-errors';

const NAME_MAX_LENGTH = 60;

@Component({
  selector: 'app-rename-form',
  imports: [ReactiveFormsModule, TranslatePipe, UiButton, UiFormField, UiInput],
  template: `
    <form class="d-flex flex-column gap-2" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <ui-form-field [label]="'households.household.name' | translate" required [maxLength]="maxLength" [errors]="serverErrors">
        <input uiInput formControlName="name" type="text" autocomplete="off" [attr.maxlength]="maxLength" />
      </ui-form-field>
      <div class="d-flex gap-2">
        <button uiButton variant="primary" type="submit" [loading]="busy()">{{ 'households.household.renameSave' | translate }}</button>
        <button uiButton variant="ghost" type="button" [disabled]="busy()" (click)="cancelled.emit()">
          {{ 'households.household.renameCancel' | translate }}
        </button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RenameForm implements OnInit {
  readonly name = input.required<string>();
  readonly busy = input(false);
  readonly serverError = input<string | null>(null);
  readonly rename = output<string>();
  readonly cancelled = output<void>();

  protected readonly maxLength = NAME_MAX_LENGTH;
  protected readonly serverErrors = SERVER_ERROR_TEMPLATE;
  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
  });

  constructor() {
    effect(() => {
      const message = this.serverError();
      if (message !== null) showOnField(this.form, 'name', message);
    });
  }

  ngOnInit(): void {
    this.form.controls.name.setValue(this.name());
  }

  protected submit(): void {
    if (this.busy()) return;
    const name = this.form.getRawValue().name.trim();
    if (this.form.controls.name.hasError('maxlength') || name === '') {
      if (name === '') this.form.controls.name.setErrors({ required: true });
      this.form.markAllAsTouched();
      return;
    }
    this.rename.emit(name);
  }
}
