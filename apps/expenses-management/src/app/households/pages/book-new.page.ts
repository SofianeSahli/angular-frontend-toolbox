import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiButton, UiInput, UiSelect } from '@shared/ui-atoms';
import { UiAlert, UiFormField } from '@shared/ui-molecules';
import { UiToast } from '@shared/ui-organisms';
import { UiFlowLayout } from '@shared/ui-templates';
import { BooksStore } from '../data/books.store';
import { HouseholdStore } from '../data/household.store';
import { NewBook } from '../data/models';
import { CURRENCY_CHOICES, CURRENCY_CODE_PATTERN, DEFAULT_CURRENCY, OTHER_CURRENCY } from '../support/currencies';
import { SERVER_ERROR_TEMPLATE, applyFieldErrors, householdsMessage, showOnField } from '../support/server-errors';
import { DEFAULT_TIMEZONE, timezoneList } from '../support/timezones';

const NAME_MAX_LENGTH = 60;
const STALE_CODES = new Set(['household.forbidden', 'book.household_has_book', 'household_id.not_found']);

@Component({
  selector: 'app-book-new-page',
  imports: [ReactiveFormsModule, TranslatePipe, UiAlert, UiButton, UiFormField, UiFlowLayout, UiInput, UiSelect],
  template: `
    <ui-flow-layout
      [title]="(forHousehold ? 'households.newBook.titleHousehold' : 'households.newBook.titlePersonal') | translate"
      [lead]="'households.newBook.lead' | translate"
      [step]="forHousehold ? 2 : 1"
      [steps]="forHousehold ? 2 : 1"
      (back)="back()"
      (exit)="exit()"
    >
      <form id="book-form" class="d-flex flex-column gap-3" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (message(); as text) {
          <ui-alert tone="danger">{{ text }}</ui-alert>
        }
        <ui-form-field [label]="'households.newBook.name' | translate" required [maxLength]="maxLength" [errors]="serverErrors">
          <input uiInput formControlName="name" type="text" autocomplete="off" [attr.maxlength]="maxLength" />
        </ui-form-field>
        <ui-form-field
          [label]="'households.newBook.currency' | translate"
          [hint]="'households.newBook.currencyFinal' | translate"
          [errors]="serverErrors"
        >
          <select uiSelect formControlName="currency">
            @for (code of currencies; track code) {
              <option [value]="code">{{ code }}</option>
            }
            <option [value]="otherCurrency">{{ 'households.newBook.otherCurrency' | translate }}</option>
          </select>
        </ui-form-field>
        @if (isOther()) {
          <ui-form-field [label]="'households.newBook.otherCurrencyField' | translate" required [errors]="serverErrors">
            <input uiInput formControlName="otherCurrency" type="text" dir="ltr" autocomplete="off" maxlength="3" (input)="upperCase()" />
          </ui-form-field>
        }
        <ui-form-field [label]="'households.newBook.timezone' | translate" [errors]="serverErrors">
          <select uiSelect formControlName="timezone">
            @for (zone of timezones; track zone) {
              <option [value]="zone">{{ zone }}</option>
            }
          </select>
        </ui-form-field>
      </form>
      <div uiFlowFooter>
        <button uiButton variant="primary" type="submit" form="book-form" [loading]="submitting()">
          {{ 'households.newBook.submit' | translate }}
        </button>
      </div>
    </ui-flow-layout>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookNewPage {
  private readonly books = inject(BooksStore);
  private readonly household = inject(HouseholdStore);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);
  private readonly translate = inject(TranslateService);

  protected readonly forHousehold = inject(ActivatedRoute).snapshot.queryParamMap.get('foyer') === '1';
  protected readonly maxLength = NAME_MAX_LENGTH;
  protected readonly currencies = CURRENCY_CHOICES;
  protected readonly otherCurrency = OTHER_CURRENCY;
  protected readonly timezones = timezoneList();
  protected readonly serverErrors = SERVER_ERROR_TEMPLATE;

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
    currency: [DEFAULT_CURRENCY],
    otherCurrency: [''],
    timezone: [DEFAULT_TIMEZONE],
  });
  private readonly currencyValue = toSignal(this.form.controls.currency.valueChanges, { initialValue: DEFAULT_CURRENCY });
  protected readonly isOther = computed(() => this.currencyValue() === OTHER_CURRENCY);
  protected readonly submitting = signal(false);
  protected readonly message = signal<string | null>(null);

  constructor() {
    this.form.controls.currency.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      const control = this.form.controls.otherCurrency;
      control.setValidators(value === OTHER_CURRENCY ? [Validators.required, Validators.pattern(CURRENCY_CODE_PATTERN)] : []);
      control.setValue('');
    });
  }

  protected upperCase(): void {
    const control = this.form.controls.otherCurrency;
    control.setValue(control.value.toUpperCase(), { emitEvent: false });
  }

  protected back(): void {
    void this.router.navigateByUrl(this.forHousehold ? '/bienvenue' : this.home());
  }

  protected exit(): void {
    void this.router.navigateByUrl(this.home());
  }

  private home(): string {
    return this.books.books().length > 0 ? '/' : '/bienvenue';
  }

  private buildRequest(): NewBook | null {
    const value = this.form.getRawValue();
    const input: { -readonly [K in keyof NewBook]: NewBook[K] } = { name: value.name.trim() };
    if (this.form.controls.currency.dirty) {
      input.currency = value.currency === OTHER_CURRENCY ? value.otherCurrency.toUpperCase() : value.currency;
    }
    if (this.form.controls.timezone.dirty) input.timezone = value.timezone;
    if (this.forHousehold) {
      const id = this.household.household()?.id;
      if (id === undefined) return null;
      input.householdId = id;
    }
    return input;
  }

  protected async submit(): Promise<void> {
    if (this.submitting()) return;
    const name = this.form.getRawValue().name.trim();
    if (this.form.invalid || name === '') {
      this.form.markAllAsTouched();
      if (name === '') this.form.controls.name.setErrors({ required: true });
      return;
    }
    const request = this.buildRequest();
    if (request === null) {
      await this.router.navigateByUrl('/bienvenue');
      return;
    }
    this.submitting.set(true);
    this.message.set(null);
    const result = await this.books.create(request);
    if (result.outcome === 'done') {
      await this.router.navigateByUrl('/');
    } else {
      await this.fail(result.error);
    }
    this.submitting.set(false);
  }

  private async fail(error: ApiError): Promise<void> {
    if (error.code === 'book.limit_reached') {
      this.toast.show({ message: this.translate.instant('households.newBook.limitReached'), tone: 'danger' });
      await this.books.load({ force: true });
      await this.router.navigateByUrl('/');
    } else if (STALE_CODES.has(error.code)) {
      await this.books.load({ force: true });
      await this.router.navigateByUrl(this.home());
    } else if (error.code === 'request.throttled') {
      this.message.set(householdsMessage(this.translate, error));
    } else if (error.kind === 'validation') {
      applyFieldErrors(this.form, error, this.translate);
      const currencyError = this.form.controls.currency.errors?.['server'] as { message: string } | undefined;
      if (currencyError && this.form.controls.currency.value === OTHER_CURRENCY) showOnField(this.form, 'otherCurrency', currencyError.message);
    }
  }
}
