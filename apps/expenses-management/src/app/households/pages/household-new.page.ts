import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiButton, UiInput } from '@shared/ui-atoms';
import { UiAlert, UiFormField } from '@shared/ui-molecules';
import { UiToast } from '@shared/ui-organisms';
import { UiFlowLayout } from '@shared/ui-templates';
import { BooksStore } from '../data/books.store';
import { HouseholdStore } from '../data/household.store';
import { householdsMessage } from '../support/server-errors';

const NAME_MAX_LENGTH = 60;

@Component({
  selector: 'app-household-new-page',
  imports: [ReactiveFormsModule, TranslatePipe, UiAlert, UiButton, UiFormField, UiFlowLayout, UiInput],
  template: `
    <ui-flow-layout
      [title]="'households.newHousehold.title' | translate"
      [lead]="'households.newHousehold.lead' | translate"
      [step]="1"
      [steps]="2"
      (back)="leave('/bienvenue')"
      (exit)="leave('/')"
    >
      <form id="household-form" class="d-flex flex-column gap-3" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (message(); as text) {
          <ui-alert tone="danger">{{ text }}</ui-alert>
        }
        <ui-form-field [label]="'households.newHousehold.name' | translate" required [maxLength]="maxLength">
          <input uiInput formControlName="name" type="text" autocomplete="off" [attr.maxlength]="maxLength" />
        </ui-form-field>
      </form>
      <div uiFlowFooter>
        <button uiButton variant="primary" type="submit" form="household-form" [loading]="submitting()">
          {{ 'households.newHousehold.submit' | translate }}
        </button>
      </div>
    </ui-flow-layout>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HouseholdNewPage {
  private readonly household = inject(HouseholdStore);
  private readonly books = inject(BooksStore);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);
  private readonly translate = inject(TranslateService);

  protected readonly maxLength = NAME_MAX_LENGTH;
  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
  });
  protected readonly submitting = signal(false);
  protected readonly message = signal<string | null>(null);

  protected leave(url: string): void {
    void this.router.navigateByUrl(url);
  }

  protected async submit(): Promise<void> {
    if (this.submitting()) return;
    const name = this.form.getRawValue().name.trim();
    if (this.form.invalid || name === '') {
      this.form.markAllAsTouched();
      if (name === '') this.form.controls.name.setErrors({ required: true });
      return;
    }
    this.submitting.set(true);
    this.message.set(null);
    const result = await this.household.create(name);
    if (result.outcome === 'done') {
      await this.router.navigateByUrl('/carnets/nouveau?foyer=1');
    } else if (result.error.code === 'household.limit_reached') {
      await this.books.load({ force: true });
      this.toast.show({ message: this.translate.instant('households.newHousehold.alreadyJoined') });
      await this.router.navigateByUrl('/foyer');
    } else if (result.error.code === 'request.throttled') {
      this.message.set(householdsMessage(this.translate, result.error));
    }
    this.submitting.set(false);
  }
}
