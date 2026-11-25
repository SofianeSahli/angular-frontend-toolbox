import { DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, TouchedChangeEvent, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { SessionStore } from '@shared/identity-data-access';
import { UiBadge, UiButton, UiChip, UiFieldMessage, UiInput } from '@shared/ui-atoms';
import { UiAlert, UiFormField } from '@shared/ui-molecules';
import { UI_DIALOG_CONTEXT, UiConfirm, UiDialog, UiDialogBody, UiDialogContext, UiDialogFooter, UiDialogHeader, UiToast } from '@shared/ui-organisms';
import { addDays, addYears, formatMinor, parseMajor, todayIn } from '@shared/util-format';
import { filter, firstValueFrom, map, startWith } from 'rxjs';
import { CategoriesStore } from '../../categories/data/categories.store';
import { CategoryLabels } from '../../categories/data/category-labels';
import { pushRecentCategory, readRecentCategories } from '../../categories/data/recent-categories';
import { CategoryChip } from '../../categories/parts/category-chip';
import { openCategoryPicker } from '../../categories/parts/category-picker';
import { BooksStore } from '../../households/data/books.store';
import { Book } from '../../households/data/models';
import { retryText } from '../../households/support/retry-text';
import { EntryForm, diff, formFromEntry, isEmptyPatch, toInput } from '../data/entry-draft';
import { Entry } from '../data/models';
import { OperationsStore, WriteResult } from '../data/operations.store';
import { OtherNamesApi } from '../data/other-names-api';
import { EntryField, entryFieldMessages, reactionTo, refusesCategory } from '../support/entry-errors';

export interface EntrySheetData {
  readonly book: Book;
  readonly entry?: Entry;
}

export const BIG_AMOUNT_MAJOR = 1000;
export const MIN_DATE = '2000-01-01';
export const OTHER_NAME_MAX = 60;
export const COMMENT_MAX = 200;
const MAX_SUGGESTIONS = 10;
const ERROR_TEMPLATES: Readonly<Record<string, string>> = {
  amount: '{{message}}',
  server: '{{message}}',
  date: '{{message}}',
};

function amountValidator(exponent: number, translate: TranslateService): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const parsed = parseMajor(control.value ?? '', exponent);
    return parsed.ok
      ? null
      : {
          amount: {
            message: translate.instant(`operations.amount.${parsed.reason}`),
          },
        };
  };
}

function dateValidator(min: string, max: string, translate: TranslateService): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value ?? '';
    if (value === '')
      return {
        date: { message: translate.instant('operations.fields.date.required') },
      };
    if (value < min)
      return {
        date: {
          message: translate.instant('operations.fields.date.after_or_equal'),
        },
      };
    if (value > max)
      return {
        date: {
          message: translate.instant('operations.fields.date.before_or_equal'),
        },
      };
    return null;
  };
}

@Component({
  selector: 'app-entry-sheet',
  imports: [
    CategoryChip,
    ReactiveFormsModule,
    TranslatePipe,
    UiAlert,
    UiBadge,
    UiButton,
    UiChip,
    UiDialogBody,
    UiDialogFooter,
    UiDialogHeader,
    UiFieldMessage,
    UiFormField,
    UiInput,
  ],
  templateUrl: './entry-sheet.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: UI_DIALOG_CONTEXT,
      useFactory: (): UiDialogContext => {
        const outer = inject(UI_DIALOG_CONTEXT, { skipSelf: true });
        const sheet = inject(EntrySheet);
        return {
          titleId: outer.titleId,
          sheet: outer.sheet,
          close: () => void sheet.requestClose(),
        };
      },
    },
  ],
})
export class EntrySheet {
  protected readonly data = inject<EntrySheetData>(DIALOG_DATA);
  private readonly context = inject(UI_DIALOG_CONTEXT, { skipSelf: true });
  private readonly translate = inject(TranslateService);
  private readonly operations = inject(OperationsStore);
  protected readonly categories = inject(CategoriesStore);
  private readonly labels = inject(CategoryLabels);
  private readonly books = inject(BooksStore);
  private readonly session = inject(SessionStore);
  private readonly otherNamesApi = inject(OtherNamesApi);
  private readonly dialog = inject(UiDialog);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);

  protected readonly book = this.data.book;
  protected readonly editing = this.data.entry ?? null;
  private readonly exponent = this.book.currency.exponent;
  protected readonly today = todayIn(this.book.timezone);
  protected readonly yesterday = addDays(this.today, -1);
  protected readonly minDate = MIN_DATE;
  protected readonly maxDate = addYears(this.today, 1);
  protected readonly otherNameMax = OTHER_NAME_MAX;
  protected readonly commentMax = COMMENT_MAX;
  protected readonly errorTemplates = ERROR_TEMPLATES;

  protected readonly form = new FormGroup({
    amount: new FormControl('', {
      nonNullable: true,
      validators: [amountValidator(this.exponent, this.translate)],
    }),
    category: new FormControl<string | null>(null, {
      validators: [Validators.required],
    }),
    otherName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(OTHER_NAME_MAX)],
    }),
    date: new FormControl(this.today, {
      nonNullable: true,
      validators: [dateValidator(MIN_DATE, this.maxDate, this.translate)],
    }),
    comment: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(COMMENT_MAX)],
    }),
  });

  private submitted = false;
  private readonly value = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), { initialValue: this.form.getRawValue() });

  protected readonly id = signal(crypto.randomUUID());
  protected readonly saving = signal(false);
  protected readonly deleting = signal(false);
  protected readonly confirmFor = signal<number | null>(null);
  protected readonly throttled = signal<string | null>(null);
  protected readonly offline = signal(false);
  protected readonly generic = signal(false);
  protected readonly categoryError = signal<string | null>(null);
  protected readonly suggestions = signal<readonly string[]>([]);
  protected readonly recents = signal<readonly string[]>([]);

  protected readonly parsed = computed(() => parseMajor(this.value().amount, this.exponent));
  protected readonly preview = computed(() => {
    const parsed = this.parsed();
    return parsed.ok ? formatMinor(parsed.minor, this.book.currency) : null;
  });
  protected readonly category = computed(() => this.value().category);
  protected readonly node = computed(() => {
    const code = this.category();
    return code === null ? null : this.categories.node(code);
  });
  protected readonly isOther = computed(() => this.node()?.isOther ?? false);
  protected readonly retired = computed(() => this.node()?.retired ?? false);
  protected readonly typeKey = computed(() => {
    const type = this.node()?.type;
    return type === undefined ? null : `operations.type.${type}`;
  });
  protected readonly recentChips = computed(() =>
    this.recents()
      .filter((code) => this.categories.isOfferable(code))
      .map((code) => ({
        code,
        emoji: this.labels.emoji(code),
        name: this.labels.name(code),
      })),
  );
  protected readonly unavailable = computed(() => this.categories.status() === 'error' && this.categories.tops().length === 0);
  protected readonly confirmText = computed(() => {
    const minor = this.confirmFor();
    return minor === null ? null : formatMinor(minor, this.book.currency);
  });
  protected readonly date = computed(() => this.value().date);

  constructor() {
    void this.categories.load();
    const accountId = this.session.account()?.id ?? null;
    if (accountId !== null) this.recents.set(readRecentCategories(accountId, this.book.id));
    if (this.editing !== null) {
      this.form.setValue(formFromEntry(this.editing, this.exponent));
      this.form.markAsPristine();
    }

    const destroyRef = inject(DestroyRef);
    for (const control of Object.values(this.form.controls)) {
      control.events
        .pipe(
          filter((event) => event instanceof TouchedChangeEvent && event.touched),
          takeUntilDestroyed(destroyRef),
        )
        .subscribe(() => {
          if (!this.submitted && control.pristine) control.markAsUntouched();
        });
    }
    this.form.controls.amount.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => this.confirmFor.set(null));
    this.form.controls.category.valueChanges
      .pipe(startWith(this.form.controls.category.value), takeUntilDestroyed(destroyRef))
      .subscribe(() => this.categoryError.set(null));

    effect(() => {
      const isOther = this.isOther();
      const code = this.category();
      untracked(() => this.onCategory(code, isOther));
    });

    effect(() => {
      const selected = this.books.selectedBookId();
      untracked(() => {
        if (selected === this.book.id) return;
        this.context.close();
        this.toast.show({
          message: this.translate.instant('operations.toasts.bookChanged'),
        });
      });
    });
  }

  protected async chooseCategory(): Promise<void> {
    const code = await openCategoryPicker(this.dialog, {
      mode: 'entry',
      recents: this.recents(),
    });
    if (code !== null) this.setCategory(code);
  }

  protected setCategory(code: string): void {
    this.form.controls.category.setValue(code);
    this.form.controls.category.markAsDirty();
  }

  protected setDate(date: string): void {
    this.form.controls.date.setValue(date);
    this.form.controls.date.markAsDirty();
  }

  protected useSuggestion(name: string): void {
    this.form.controls.otherName.setValue(name);
    this.form.controls.otherName.markAsDirty();
  }

  async requestClose(): Promise<void> {
    if (this.saving() || this.deleting()) return;
    if (this.form.dirty) {
      const discard = await this.confirm.ask({
        title: this.translate.instant('operations.sheet.discard.title'),
        message: this.translate.instant('operations.sheet.discard.message'),
        confirmLabel: this.translate.instant('operations.sheet.discard.confirm'),
        cancelLabel: this.translate.instant('operations.sheet.discard.cancel'),
        tone: 'danger',
      });
      if (!discard) return;
    }
    this.context.close();
  }

  protected async save(): Promise<void> {
    if (this.saving() || this.deleting()) return;
    this.submitted = true;
    this.form.markAllAsTouched();
    if (this.category() === null) this.categoryError.set(this.translate.instant('operations.fields.category.required'));
    if (this.form.invalid || this.unavailable()) return;
    const context = { exponent: this.exponent, isOther: this.isOther() };
    const form: EntryForm = this.form.getRawValue();
    if (this.editing !== null) await this.saveEdit(this.editing, form, context);
    else await this.saveNew(form, context);
  }

  protected async remove(): Promise<void> {
    if (this.editing === null || this.saving() || this.deleting()) return;
    const confirmed = await this.confirm.ask({
      title: this.translate.instant('operations.sheet.delete.title'),
      message: this.translate.instant('operations.sheet.delete.message'),
      confirmLabel: this.translate.instant('operations.sheet.delete.confirm'),
      cancelLabel: this.translate.instant('operations.sheet.delete.cancel'),
      tone: 'danger',
    });
    if (!confirmed) return;
    this.clearNotices();
    this.deleting.set(true);
    const result = await this.operations.remove(this.book.id, this.editing.id);
    this.deleting.set(false);
    if (result.outcome === 'done') {
      this.finish('operations.toasts.deleted');
      return;
    }
    this.handleError(result.error);
  }

  private async saveNew(form: EntryForm, context: { exponent: number; isOther: boolean }): Promise<void> {
    const input = toInput(this.id(), form, context);
    if (input === null || this.needsConfirmation(input.amount)) return;
    this.clearNotices();
    this.saving.set(true);
    let result: WriteResult = await this.operations.create(this.book.id, input);
    if (result.outcome === 'error' && reactionTo(result.error) === 'idConflict') {
      this.id.set(crypto.randomUUID());
      result = await this.operations.create(this.book.id, {
        ...input,
        id: this.id(),
      });
    }
    this.saving.set(false);
    if (result.outcome === 'done') {
      const accountId = this.session.account()?.id;
      if (accountId !== undefined) pushRecentCategory(accountId, this.book.id, input.category);
      this.finish(`operations.toasts.created.${result.entry?.type ?? this.node()?.type ?? 'expense'}`);
      return;
    }
    if (reactionTo(result.error) === 'idConflict') this.generic.set(true);
    else this.handleError(result.error);
  }

  private async saveEdit(entry: Entry, form: EntryForm, context: { exponent: number; isOther: boolean }): Promise<void> {
    const patch = diff(entry, form, context);
    if (patch === null) return;
    if (isEmptyPatch(patch)) {
      this.context.close();
      return;
    }
    if (patch.amount !== undefined && this.needsConfirmation(patch.amount)) return;
    this.clearNotices();
    this.saving.set(true);
    const result = await this.operations.update(this.book.id, entry.id, patch);
    this.saving.set(false);
    if (result.outcome === 'done') {
      this.finish('operations.toasts.updated');
      return;
    }
    this.handleError(result.error);
  }

  private needsConfirmation(minor: number): boolean {
    if (minor < BIG_AMOUNT_MAJOR * 10 ** this.exponent || this.confirmFor() === minor) return false;
    this.confirmFor.set(minor);
    return true;
  }

  private handleError(error: ApiError): void {
    switch (reactionTo(error)) {
      case 'fields':
        this.showFieldErrors(error);
        return;
      case 'bookGone':
        this.context.close();
        void this.books.load({ force: true });
        this.toast.show({
          message: this.translate.instant('operations.toasts.bookGone'),
          tone: 'danger',
        });
        return;
      case 'entryGone':
        this.context.close();
        this.toast.show({
          message: this.translate.instant('operations.toasts.entryGone'),
          tone: 'danger',
        });
        return;
      case 'throttled':
        this.throttled.set(
          this.translate.instant('operations.errors.throttled', {
            retry: retryText(this.translate, error.retryAfterSeconds),
          }),
        );
        return;
      case 'offline':
        this.offline.set(true);
        return;
      case 'idConflict':
        this.generic.set(true);
        return;
      case 'presenter':
        return;
    }
  }

  private showFieldErrors(error: ApiError): void {
    const messages = entryFieldMessages(error, this.translate);
    if (refusesCategory(error)) {
      void this.categories.load({ force: true });
      this.form.controls.category.setValue(null);
    }
    for (const [field, message] of Object.entries(messages) as [EntryField, string][]) {
      if (field === 'category') this.categoryError.set(message);
      else if (field === 'id') this.generic.set(true);
      else {
        const control = this.form.controls[field];
        control.setErrors({ server: { message } });
        control.markAsTouched();
      }
    }
  }

  private finish(toastKey: string): void {
    this.form.markAsPristine();
    this.context.close();
    this.toast.show({
      message: this.translate.instant(toastKey),
      tone: 'success',
    });
  }

  private clearNotices(): void {
    this.throttled.set(null);
    this.offline.set(false);
    this.generic.set(false);
  }

  private async onCategory(code: string | null, isOther: boolean): Promise<void> {
    const otherName = this.form.controls.otherName;
    otherName.setValidators(isOther ? [Validators.required, Validators.maxLength(OTHER_NAME_MAX)] : [Validators.maxLength(OTHER_NAME_MAX)]);
    otherName.updateValueAndValidity({ emitEvent: false });
    this.suggestions.set([]);
    if (!isOther || code === null) return;
    try {
      const names = await firstValueFrom(this.otherNamesApi.list(this.book.id, code));
      if (this.category() === code) this.suggestions.set(names.slice(0, MAX_SUGGESTIONS));
    } catch {
      this.suggestions.set([]);
    }
  }
}
