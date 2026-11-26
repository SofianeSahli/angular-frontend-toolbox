import { DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { SessionStore } from '@shared/identity-data-access';
import { UiBadge, UiButton, UiChip, UiFieldMessage, UiInput, UiSelect } from '@shared/ui-atoms';
import { UiAlert, UiFormField, UiSegmentedControl, UiSegmentedOption } from '@shared/ui-molecules';
import { UI_DIALOG_CONTEXT, UiConfirm, UiDialog, UiDialogBody, UiDialogContext, UiDialogFooter, UiDialogHeader, UiToast } from '@shared/ui-organisms';
import { addYears, formatMinor, parseMajor, todayIn } from '@shared/util-format';
import { firstValueFrom, map } from 'rxjs';
import { CategoriesStore } from '../../../categories/data/categories.store';
import { CategoryLabels } from '../../../categories/data/category-labels';
import { pushRecentCategory, readRecentCategories } from '../../../categories/data/recent-categories';
import { CategoryChip } from '../../../categories/parts/category-chip/category-chip';
import { openCategoryPicker } from '../../../categories/parts/category-picker/category-picker';
import { BooksStore } from '../../../households/data/books.store';
import { Book } from '../../../households/data/models';
import { retryText } from '../../../households/support/retry-text';
import { OtherNamesApi } from '../../../operations/data/other-names-api';
import { BIG_AMOUNT_MAJOR, COMMENT_MAX, OTHER_NAME_MAX, amountValidator } from '../../../operations/parts/entry-sheet/entry-sheet';
import { FREQUENCIES, Frequency, RecurringRule } from '../../data/models';
import { RecurringStore, RuleWriteResult } from '../../data/recurring.store';
import { RuleForm, diffRule, formFromRule, isEmptyRulePatch } from '../../data/rule-draft';
import { longDate, uiLocale } from '../../../operations/support/day-groups';
import { RuleField, refusesRuleCategory, ruleCodeMessage, ruleFieldMessages, ruleReaction } from '../../support/rule-errors';
import { INTERVALS, rangeValidator } from '../../support/rule-validators';

export { INTERVALS };

export interface RuleSheetData {
  readonly book: Book;
  readonly rule: RecurringRule;
}

const MAX_SUGGESTIONS = 10;
const ERROR_TEMPLATES: Readonly<Record<string, string>> = { amount: '{{message}}', server: '{{message}}', range: '{{message}}' };

@Component({
  selector: 'app-rule-sheet',
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
    UiSegmentedControl,
    UiSelect,
  ],
  templateUrl: './rule-sheet.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: UI_DIALOG_CONTEXT,
      useFactory: (): UiDialogContext => {
        const outer = inject(UI_DIALOG_CONTEXT, { skipSelf: true });
        const sheet = inject(RuleSheet);
        return { titleId: outer.titleId, sheet: outer.sheet, close: () => void sheet.requestClose() };
      },
    },
  ],
})
export class RuleSheet {
  protected readonly data = inject<RuleSheetData>(DIALOG_DATA);
  private readonly context = inject(UI_DIALOG_CONTEXT, { skipSelf: true });
  private readonly translate = inject(TranslateService);
  private readonly recurring = inject(RecurringStore);
  protected readonly categories = inject(CategoriesStore);
  private readonly labels = inject(CategoryLabels);
  private readonly books = inject(BooksStore);
  private readonly session = inject(SessionStore);
  private readonly otherNamesApi = inject(OtherNamesApi);
  private readonly dialog = inject(UiDialog);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);

  protected readonly book = this.data.book;
  protected readonly editing = this.data.rule;
  private readonly exponent = this.book.currency.exponent;
  protected readonly today = todayIn(this.book.timezone);
  protected readonly minStart = addYears(this.today, -1);
  protected readonly maxStart = addYears(this.today, 1);
  protected readonly otherNameMax = OTHER_NAME_MAX;
  protected readonly commentMax = COMMENT_MAX;
  protected readonly intervals = INTERVALS;
  protected readonly errorTemplates = ERROR_TEMPLATES;
  protected readonly frequencyOptions: readonly UiSegmentedOption<Frequency>[] = FREQUENCIES.map((value) => ({
    value,
    label: this.translate.instant(`recurring.sheet.frequencies.${value}`),
  }));

  protected readonly form = new FormGroup({
    amount: new FormControl('', { nonNullable: true, validators: [amountValidator(this.exponent, this.translate)] }),
    category: new FormControl<string | null>(null, { validators: [Validators.required] }),
    otherName: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(OTHER_NAME_MAX)] }),
    comment: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(COMMENT_MAX)] }),
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

  private readonly value = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue() as RuleForm)), {
    initialValue: this.form.getRawValue() as RuleForm,
  });

  protected readonly saving = signal(false);
  protected readonly deleting = signal(false);
  protected readonly confirmFor = signal<number | null>(null);
  protected readonly notice = signal<string | null>(null);
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
  protected readonly nextDate = computed(() => {
    const next = this.editing.nextDate;
    return next === null ? null : longDate(next, uiLocale(this.translate.getCurrentLang()));
  });
  protected readonly endMin = computed(() => this.value().startsOn || this.minStart);
  protected readonly recentChips = computed(() =>
    this.recents()
      .filter((code) => this.categories.isOfferable(code))
      .map((code) => ({ code, emoji: this.labels.emoji(code), name: this.labels.name(code) })),
  );
  protected readonly unavailable = computed(() => this.categories.status() === 'error' && this.categories.tops().length === 0);
  protected readonly confirmText = computed(() => {
    const minor = this.confirmFor();
    return minor === null ? null : formatMinor(minor, this.book.currency);
  });

  constructor() {
    void this.categories.load();
    const accountId = this.session.account()?.id ?? null;
    if (accountId !== null) this.recents.set(readRecentCategories(accountId, this.book.id));
    this.form.setValue(formFromRule(this.editing, this.exponent));
    this.form.markAsPristine();

    const destroyRef = inject(DestroyRef);
    this.form.controls.amount.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => this.confirmFor.set(null));
    this.form.controls.category.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => this.categoryError.set(null));
    this.form.controls.startsOn.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => this.form.controls.endsOn.updateValueAndValidity({ emitEvent: false }));

    effect(() => {
      const isOther = this.isOther();
      const code = this.category();
      untracked(() => void this.onCategory(code, isOther));
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

  protected async chooseCategory(): Promise<void> {
    const code = await openCategoryPicker(this.dialog, { mode: 'entry', recents: this.recents() });
    if (code !== null) this.setCategory(code);
  }

  protected setCategory(code: string): void {
    this.form.controls.category.setValue(code);
    this.form.controls.category.markAsDirty();
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
    this.form.markAllAsTouched();
    if (this.category() === null) this.categoryError.set(this.translate.instant('operations.fields.category.required'));
    if (this.form.invalid || this.unavailable()) return;
    const form = this.form.getRawValue() as RuleForm;
    const context = { exponent: this.exponent, isOther: this.isOther() };
    const patch = diffRule(this.editing, form, context);
    if (patch === null) return;
    if (isEmptyRulePatch(patch)) {
      this.context.close();
      return;
    }
    if (patch.amount !== undefined && this.needsConfirmation(patch.amount)) return;
    const rule = this.editing;
    await this.write(() => this.recurring.update(this.book.id, rule.id, patch), 'recurring.toasts.updated', patch.category);
  }

  protected async stop(): Promise<void> {
    if (this.saving() || this.deleting()) return;
    const confirmed = await this.confirm.ask({
      title: this.translate.instant('recurring.delete.title'),
      message: this.translate.instant('recurring.delete.message'),
      confirmLabel: this.translate.instant('recurring.delete.confirm'),
      cancelLabel: this.translate.instant('recurring.delete.cancel'),
      tone: 'danger',
    });
    if (!confirmed) return;
    this.notice.set(null);
    this.deleting.set(true);
    const result = await this.recurring.remove(this.book.id, this.editing.id);
    this.deleting.set(false);
    if (result.outcome === 'done') {
      this.form.markAsPristine();
      this.context.close();
      this.toast.show({ message: this.translate.instant('recurring.toasts.deleted'), tone: 'success' });
      return;
    }
    this.handleError(result.error);
  }

  private async write(call: () => Promise<RuleWriteResult>, toastKey: string, category?: string): Promise<void> {
    this.notice.set(null);
    this.saving.set(true);
    const result = await call();
    this.saving.set(false);
    if (result.outcome === 'done') {
      const accountId = this.session.account()?.id;
      if (category !== undefined && accountId !== undefined) pushRecentCategory(accountId, this.book.id, category);
      this.form.markAsPristine();
      this.context.close();
      this.toast.show({ message: this.translate.instant(toastKey), tone: 'success' });
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
    switch (ruleReaction(error)) {
      case 'fields':
        this.showFieldErrors(error);
        return;
      case 'bookGone':
        this.form.markAsPristine();
        this.context.close();
        void this.books.load({ force: true });
        this.toast.show({ message: this.translate.instant('operations.toasts.bookGone'), tone: 'danger' });
        return;
      case 'ruleGone':
        this.form.markAsPristine();
        this.context.close();
        this.toast.show({ message: this.translate.instant('recurring.toasts.gone'), tone: 'danger' });
        return;
      case 'limit':
        this.notice.set(this.translate.instant('recurring.errors.limit'));
        return;
      case 'throttled':
        this.notice.set(this.translate.instant('operations.errors.throttled', { retry: retryText(this.translate, error.retryAfterSeconds) }));
        return;
      case 'offline':
        this.notice.set(this.translate.instant('operations.errors.offline'));
        return;
      default:
        this.notice.set(this.translate.instant('operations.errors.generic'));
    }
  }

  private showFieldErrors(error: ApiError): void {
    if (refusesRuleCategory(error)) {
      void this.categories.load({ force: true });
      if (this.form.controls.category.value !== this.editing.category) this.form.controls.category.setValue(null);
    }
    const messages = ruleFieldMessages(error, this.translate);
    for (const [field, message] of Object.entries(messages) as [RuleField, string][]) {
      if (field === 'category') {
        this.categoryError.set(message);
        continue;
      }
      const control = this.form.controls[field];
      control.setErrors({ server: { message } });
      control.markAsTouched();
    }
    if (Object.keys(messages).length === 0) this.notice.set(ruleCodeMessage(this.translate, Object.values(error.fields)[0]?.[0] ?? 'generic'));
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
