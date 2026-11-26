import { DIALOG_DATA } from '@angular/cdk/dialog';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, TouchedChangeEvent, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { SessionStore } from '@shared/identity-data-access';
import { UiBadge, UiButton, UiChip, UiFieldMessage, UiInput, UiSelect } from '@shared/ui-atoms';
import { UiAlert, UiFormField, UiSegmentedControl, UiSegmentedOption } from '@shared/ui-molecules';
import { UI_DIALOG_CONTEXT, UiConfirm, UiDialog, UiDialogBody, UiDialogContext, UiDialogFooter, UiDialogHeader, UiToast } from '@shared/ui-organisms';
import { mediaQueryDown } from '@shared/ui-tokens';
import { addDays, addYears, formatMinor, parseMajor, todayIn } from '@shared/util-format';
import { filter, firstValueFrom, map, startWith } from 'rxjs';
import { CategoriesStore } from '../../../categories/data/categories.store';
import { CategoryLabels } from '../../../categories/data/category-labels';
import { pushRecentCategory, readRecentCategories } from '../../../categories/data/recent-categories';
import { CategoryChip } from '../../../categories/parts/category-chip/category-chip';
import { openCategoryPicker } from '../../../categories/parts/category-picker/category-picker';
import { BooksStore } from '../../../households/data/books.store';
import { Book } from '../../../households/data/models';
import { retryText } from '../../../households/support/retry-text';
import { FREQUENCIES, Frequency } from '../../../recurring/data/models';
import { RecurringStore } from '../../../recurring/data/recurring.store';
import { toRuleInput } from '../../../recurring/data/rule-draft';
import { frequencyText } from '../../../recurring/support/frequency-text';
import { RuleField, refusesRuleCategory, ruleCodeMessage, ruleFieldMessages, ruleReaction } from '../../../recurring/support/rule-errors';
import { INTERVALS, rangeValidator } from '../../../recurring/support/rule-validators';
import { EntryForm, diff, formFromEntry, isEmptyPatch, minorToMajorText, toInput } from '../../data/entry-draft';
import { EntryHistory } from '../../data/entry-history';
import { Entry } from '../../data/models';
import { OperationsStore, WriteResult } from '../../data/operations.store';
import { OtherNamesApi } from '../../data/other-names-api';
import { EntryField, entryFieldMessages, reactionTo, refusesCategory } from '../../support/entry-errors';
import { EntryTemplate, suggestCategory, templatesFrom } from '../../support/suggestion';
import { AmountPad } from '../amount-pad/amount-pad';

export type EntrySheetMode = 'once' | 'recurring';

export interface EntrySheetData {
  readonly book: Book;
  readonly entry?: Entry;
  readonly mode?: EntrySheetMode;
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
  range: '{{message}}',
};

export function amountValidator(exponent: number, translate: TranslateService): ValidatorFn {
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
    if (value === '') return { date: { message: translate.instant('operations.fields.date.required') } };
    if (value < min) return { date: { message: translate.instant('operations.fields.date.after_or_equal') } };
    if (value > max) return { date: { message: translate.instant('operations.fields.date.before_or_equal') } };
    return null;
  };
}

interface CategoryOption {
  readonly code: string;
  readonly emoji: string;
  readonly name: string;
  readonly suggested: boolean;
}

interface TemplateOption extends EntryTemplate {
  readonly label: string;
}

@Component({
  selector: 'app-entry-sheet',
  imports: [
    AmountPad,
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
    UiSegmentedControl,
    UiSelect,
  ],
  templateUrl: './entry-sheet.html',
  styleUrl: './entry-sheet.scss',
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
  private readonly recurring = inject(RecurringStore);
  protected readonly categories = inject(CategoriesStore);
  private readonly labels = inject(CategoryLabels);
  private readonly books = inject(BooksStore);
  private readonly session = inject(SessionStore);
  private readonly otherNamesApi = inject(OtherNamesApi);
  private readonly history = inject(EntryHistory);
  private readonly dialog = inject(UiDialog);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  private readonly changeDetector = inject(ChangeDetectorRef);

  protected readonly book = this.data.book;
  protected readonly editing = this.data.entry ?? null;
  private readonly exponent = this.book.currency.exponent;
  private readonly accountId = this.session.account()?.id ?? null;
  protected readonly keypad = inject(DOCUMENT).defaultView?.matchMedia?.(mediaQueryDown('medium')).matches ?? false;
  protected readonly today = todayIn(this.book.timezone);
  protected readonly yesterday = addDays(this.today, -1);
  protected readonly minDate = MIN_DATE;
  protected readonly maxDate = addYears(this.today, 1);
  protected readonly minStart = addYears(this.today, -1);
  protected readonly maxStart = addYears(this.today, 1);
  protected readonly otherNameMax = OTHER_NAME_MAX;
  protected readonly commentMax = COMMENT_MAX;
  protected readonly intervals = INTERVALS;
  protected readonly errorTemplates = ERROR_TEMPLATES;
  protected readonly modeOptions: readonly UiSegmentedOption<EntrySheetMode>[] = [
    { value: 'once', label: this.translate.instant('operations.sheet.once') },
    { value: 'recurring', label: this.translate.instant('operations.sheet.recurring') },
  ];
  protected readonly frequencyOptions: readonly UiSegmentedOption<Frequency>[] = FREQUENCIES.map((value) => ({
    value,
    label: this.translate.instant(`recurring.sheet.frequencies.${value}`),
  }));

  protected readonly modeControl = new FormControl<EntrySheetMode>(this.data.mode ?? 'once', { nonNullable: true });
  protected readonly mode = toSignal(this.modeControl.valueChanges, { initialValue: this.modeControl.value });
  protected readonly isRecurring = computed(() => this.editing === null && this.mode() === 'recurring');

  protected readonly form = new FormGroup({
    amount: new FormControl('', { nonNullable: true, validators: [amountValidator(this.exponent, this.translate)] }),
    category: new FormControl<string | null>(null, { validators: [Validators.required] }),
    otherName: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(OTHER_NAME_MAX)] }),
    date: new FormControl(this.today, { nonNullable: true, validators: [dateValidator(MIN_DATE, this.maxDate, this.translate)] }),
    comment: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(COMMENT_MAX)] }),
  });

  protected readonly rule = new FormGroup({
    frequency: new FormControl<Frequency>('monthly', { nonNullable: true }),
    interval: new FormControl(1, { nonNullable: true }),
    startsOn: new FormControl(this.today, {
      nonNullable: true,
      validators: [rangeValidator('starts_on', () => ({ min: this.minStart, max: this.maxStart }), true, this.translate)],
    }),
    endsOn: new FormControl('', {
      nonNullable: true,
      validators: [rangeValidator('ends_on', (control) => ({ min: control.parent?.get('startsOn')?.value || null, max: null }), false, this.translate)],
    }),
  });

  private submitted = false;
  protected readonly value = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), { initialValue: this.form.getRawValue() });
  private readonly ruleValue = toSignal(this.rule.valueChanges.pipe(map(() => this.rule.getRawValue())), { initialValue: this.rule.getRawValue() });

  protected readonly id = signal(crypto.randomUUID());
  protected readonly saving = signal(false);
  protected readonly deleting = signal(false);
  protected readonly confirmFor = signal<number | null>(null);
  protected readonly throttled = signal<string | null>(null);
  protected readonly offline = signal(false);
  protected readonly generic = signal(false);
  protected readonly notice = signal<string | null>(null);
  protected readonly categoryError = signal<string | null>(null);
  protected readonly suggestions = signal<readonly string[]>([]);
  protected readonly recents = signal<readonly string[]>([]);
  protected readonly showDate = signal(this.editing !== null);
  protected readonly showComment = signal(this.editing !== null);
  private readonly historyEntries = signal<readonly Entry[] | null>(null);
  private readonly createdAt = new Date();

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
  protected readonly suggested = computed(() => {
    const entries = this.historyEntries();
    return entries === null || this.editing !== null ? null : suggestCategory(entries, this.createdAt, this.book.timezone, (code) => this.categories.isOfferable(code));
  });
  protected readonly categoryOptions = computed<readonly CategoryOption[]>(() => {
    const suggested = this.suggested();
    const codes = [...(suggested === null ? [] : [suggested]), ...this.recents().filter((code) => code !== suggested)];
    const current = this.category();
    if (current !== null && !codes.includes(current)) codes.push(current);
    return codes
      .filter((code) => code === current || this.categories.isOfferable(code))
      .map((code) => ({ code, emoji: this.labels.emoji(code), name: this.labels.name(code), suggested: code === suggested }));
  });
  protected readonly templates = computed<readonly TemplateOption[]>(() => {
    const entries = this.historyEntries();
    if (entries === null || this.editing !== null) return [];
    return templatesFrom(entries, (code) => this.categories.isOfferable(code)).map((template) => ({
      ...template,
      label: `${template.otherName || this.labels.name(template.category)} ${minorToMajorText(template.amount, this.exponent)}`,
    }));
  });
  protected readonly unavailable = computed(() => this.categories.status() === 'error' && this.categories.tops().length === 0);
  protected readonly confirmText = computed(() => {
    const minor = this.confirmFor();
    return minor === null ? null : formatMinor(minor, this.book.currency);
  });
  protected readonly date = computed(() => this.value().date);
  protected readonly otherDate = computed(() => this.date() !== this.today && this.date() !== this.yesterday);
  protected readonly pastStart = computed(() => this.isRecurring() && this.ruleValue().startsOn !== '' && this.ruleValue().startsOn <= this.today);
  protected readonly endMin = computed(() => this.ruleValue().startsOn || this.minStart);
  protected readonly frequencyLabel = computed(() => {
    const text = frequencyText(this.translate, this.ruleValue().frequency, this.ruleValue().interval);
    return text.charAt(0).toLocaleLowerCase() + text.slice(1);
  });
  protected readonly canSave = computed(() => this.editing !== null || this.parsed().ok);
  protected readonly title = computed(() =>
    this.editing !== null ? 'operations.sheet.editTitle' : this.isRecurring() ? 'recurring.sheet.addTitle' : 'operations.sheet.addTitle',
  );

  constructor() {
    void this.categories.load();
    if (this.accountId !== null) this.recents.set(readRecentCategories(this.accountId, this.book.id));
    if (this.editing !== null) {
      this.form.setValue(formFromEntry(this.editing, this.exponent));
      this.form.markAsPristine();
    } else if (this.accountId !== null) {
      this.history.forBook(this.accountId, this.book).then(
        (entries) => this.historyEntries.set(entries),
        () => undefined,
      );
    }

    const destroyRef = inject(DestroyRef);
    for (const control of [...Object.values(this.form.controls), ...Object.values(this.rule.controls)]) {
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
    this.rule.controls.startsOn.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => this.rule.controls.endsOn.updateValueAndValidity({ emitEvent: false }));
    this.modeControl.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe((mode) => this.switchMode(mode));

    effect(() => {
      const suggested = this.suggested();
      untracked(() => {
        const control = this.form.controls.category;
        if (suggested !== null && control.value === null && control.pristine) control.setValue(suggested);
      });
    });

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
        this.toast.show({ message: this.translate.instant('operations.toasts.bookChanged') });
      });
    });
  }

  protected setAmount(text: string): void {
    this.form.controls.amount.setValue(text);
    this.form.controls.amount.markAsDirty();
  }

  protected async chooseCategory(): Promise<void> {
    const code = await openCategoryPicker(this.dialog, { mode: 'entry', recents: this.recents() });
    if (code !== null) this.setCategory(code);
  }

  protected setCategory(code: string): void {
    this.form.controls.category.setValue(code);
    this.form.controls.category.markAsDirty();
  }

  protected useTemplate(template: EntryTemplate): void {
    this.setAmount(minorToMajorText(template.amount, this.exponent));
    this.setCategory(template.category);
    this.form.controls.otherName.setValue(template.otherName ?? '');
    this.form.controls.otherName.markAsDirty();
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
    if (this.form.dirty || this.rule.dirty) {
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
    const context = { exponent: this.exponent, isOther: this.isOther() };
    if (this.isRecurring()) {
      this.rule.markAllAsTouched();
      const { amount, category, otherName, comment } = this.form.controls;
      if ([amount, category, otherName, comment].some((control) => control.invalid) || this.rule.invalid || this.unavailable()) return;
      await this.saveRule(context);
      return;
    }
    if (this.form.invalid || this.unavailable()) return;
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

  private switchMode(mode: EntrySheetMode): void {
    if (mode === 'recurring') {
      this.rule.controls.startsOn.setValue(this.form.controls.date.value);
    } else {
      const start = this.rule.controls.startsOn.value;
      if (start !== '') this.form.controls.date.setValue(start);
      this.showDate.set(start !== '' && start !== this.today && start !== this.yesterday);
    }
    this.clearNotices();
  }

  private async saveNew(form: EntryForm, context: { exponent: number; isOther: boolean }): Promise<void> {
    const input = toInput(this.id(), form, context);
    if (input === null || this.needsConfirmation(input.amount)) return;
    this.clearNotices();
    this.saving.set(true);
    let result: WriteResult = await this.operations.create(this.book.id, input);
    if (result.outcome === 'error' && reactionTo(result.error) === 'idConflict') {
      this.id.set(crypto.randomUUID());
      result = await this.operations.create(this.book.id, { ...input, id: this.id() });
    }
    this.saving.set(false);
    if (result.outcome === 'done') {
      this.remember(input.category);
      this.finish(`operations.toasts.created.${result.entry?.type ?? this.node()?.type ?? 'expense'}`);
      return;
    }
    if (reactionTo(result.error) === 'idConflict') this.generic.set(true);
    else this.handleError(result.error);
  }

  private async saveRule(context: { exponent: number; isOther: boolean }): Promise<void> {
    const form = this.form.getRawValue();
    const input = toRuleInput({ ...form, ...this.rule.getRawValue() }, context);
    if (input === null || this.needsConfirmation(input.amount)) return;
    this.clearNotices();
    this.saving.set(true);
    const result = await this.recurring.create(this.book.id, input);
    this.saving.set(false);
    if (result.outcome === 'done') {
      this.remember(input.category);
      this.finish('recurring.toasts.created');
      return;
    }
    this.handleRuleError(result.error);
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

  private remember(category: string): void {
    if (this.accountId === null) return;
    pushRecentCategory(this.accountId, this.book.id, category);
    this.history.invalidate(this.accountId, this.book.id);
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
        this.bookGone();
        return;
      case 'entryGone':
        this.context.close();
        this.toast.show({ message: this.translate.instant('operations.toasts.entryGone'), tone: 'danger' });
        return;
      case 'throttled':
        this.throttled.set(this.throttleText(error));
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

  private handleRuleError(error: ApiError): void {
    switch (ruleReaction(error)) {
      case 'fields':
        this.showRuleFieldErrors(error);
        return;
      case 'bookGone':
        this.bookGone();
        return;
      case 'limit':
        this.notice.set(this.translate.instant('recurring.errors.limit'));
        return;
      case 'throttled':
        this.throttled.set(this.throttleText(error));
        return;
      case 'offline':
        this.offline.set(true);
        return;
      case 'ruleGone':
      case 'presenter':
        this.generic.set(true);
    }
  }

  private bookGone(): void {
    this.form.markAsPristine();
    this.rule.markAsPristine();
    this.context.close();
    void this.books.load({ force: true });
    this.toast.show({ message: this.translate.instant('operations.toasts.bookGone'), tone: 'danger' });
  }

  private throttleText(error: ApiError): string {
    return this.translate.instant('operations.errors.throttled', { retry: retryText(this.translate, error.retryAfterSeconds) });
  }

  private showFieldErrors(error: ApiError): void {
    const messages = entryFieldMessages(error, this.translate);
    if (refusesCategory(error)) {
      void this.categories.load({ force: true });
      this.form.controls.category.setValue(null);
    }
    const entries = Object.entries(messages) as [EntryField, string][];
    if (entries.some(([field]) => field === 'comment')) this.showComment.set(true);
    if (entries.some(([field]) => field === 'date')) this.showDate.set(true);
    // A field revealed here attaches its form control on render, which re-validates it and would drop the server error.
    this.changeDetector.detectChanges();
    for (const [field, message] of entries) {
      if (field === 'category') this.categoryError.set(message);
      else if (field === 'id') this.generic.set(true);
      else {
        const control = this.form.controls[field];
        control.setErrors({ server: { message } });
        control.markAsTouched();
      }
    }
  }

  private showRuleFieldErrors(error: ApiError): void {
    if (refusesRuleCategory(error)) {
      void this.categories.load({ force: true });
      this.form.controls.category.setValue(null);
    }
    const messages = ruleFieldMessages(error, this.translate);
    for (const [field, message] of Object.entries(messages) as [RuleField, string][]) {
      if (field === 'category') {
        this.categoryError.set(message);
        continue;
      }
      const control = field in this.rule.controls ? this.rule.get(field) : this.form.get(field);
      control?.setErrors({ server: { message } });
      control?.markAsTouched();
    }
    if (Object.keys(messages).length === 0) this.notice.set(ruleCodeMessage(this.translate, Object.values(error.fields)[0]?.[0] ?? 'generic'));
  }

  private finish(toastKey: string): void {
    this.form.markAsPristine();
    this.rule.markAsPristine();
    this.context.close();
    this.toast.show({ message: this.translate.instant(toastKey), tone: 'success' });
  }

  private clearNotices(): void {
    this.throttled.set(null);
    this.offline.set(false);
    this.generic.set(false);
    this.notice.set(null);
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
