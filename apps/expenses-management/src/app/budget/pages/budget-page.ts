import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiButton, UiFieldMessage, UiIcon, UiInput, UiLabel, UiSkeleton } from '@shared/ui-atoms';
import { UiAlert, UiMonthSwitcher } from '@shared/ui-molecules';
import { UiConfirm, UiDialog, UiToast } from '@shared/ui-organisms';
import { UiPage } from '@shared/ui-templates';
import { todayIn } from '@shared/util-format';
import { map } from 'rxjs';
import { CategoriesStore } from '../../categories/data/categories.store';
import { openCategoryPicker } from '../../categories/parts/category-picker';
import { MIN_MONTH, MONTH_PARAM, maxMonth, monthFromQuery } from '../../ledger/month-context';
import { injectTranslationRevision } from '../../i18n/translation-revision';
import { BooksStore } from '../../households/data/books.store';
import { uiLocale } from '../../operations/support/day-groups';
import { BudgetDraft } from '../data/budget-draft';
import { LeaveCheck } from './budget-leave.guard';
import { BudgetStore, BudgetWriteResult } from '../data/budget.store';
import { Budget, BudgetInput, BudgetLine } from '../data/models';
import { BudgetOverview } from '../parts/budget-overview';
import { BudgetTotals } from '../parts/budget-totals';
import { OffPlanItem, OffPlanList } from '../parts/off-plan-list';
import { PlanLineRow } from '../parts/plan-line-row';
import { lastMonthActual } from '../support/last-month';
import { OffPlanCategory, offPlanCategories } from '../support/off-plan';
import { BudgetFieldErrors, budgetFieldErrors, budgetReaction, parseMessage, throttledMessage } from '../support/budget-errors';

const DEFAULT_TIMEZONE = 'Africa/Tunis';
const NO_EXPONENT = 3;

@Component({
  selector: 'app-budget-page',
  imports: [
    BudgetOverview,
    BudgetTotals,
    OffPlanList,
    PlanLineRow,
    TranslatePipe,
    UiAlert,
    UiButton,
    UiFieldMessage,
    UiIcon,
    UiInput,
    UiLabel,
    UiMonthSwitcher,
    UiPage,
    UiSkeleton,
  ],
  templateUrl: './budget-page.html',
  styleUrl: './budget-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetPage implements OnInit, OnDestroy, LeaveCheck {
  protected readonly store = inject(BudgetStore);
  private readonly books = inject(BooksStore);
  private readonly categories = inject(CategoriesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly confirm = inject(UiConfirm);
  private readonly dialog = inject(UiDialog);
  private readonly toast = inject(UiToast);
  private readonly revision = injectTranslationRevision();

  protected readonly book = this.books.selectedBook;
  protected readonly today = computed(() => todayIn(this.book()?.timezone ?? DEFAULT_TIMEZONE));
  private readonly queryMonth = toSignal(this.route.queryParamMap.pipe(map((params) => params.get(MONTH_PARAM))), { initialValue: null });
  protected readonly month = computed(() => monthFromQuery(this.queryMonth(), this.today()));
  protected readonly shownMonth = signal('');
  protected readonly minMonth = MIN_MONTH;
  protected readonly maxMonth = computed(() => maxMonth(this.today()));
  protected readonly locale = computed(() => {
    this.revision();
    return uiLocale(this.translate.getCurrentLang());
  });

  private readonly order = computed(() => {
    const positions = new Map<string, number>();
    for (const top of this.categories.orderedTops()) {
      positions.set(top.code, positions.size);
      for (const group of top.groups) positions.set(group.code, positions.size);
    }
    return positions;
  });
  protected readonly draft = computed(() => {
    const exponent = this.book()?.currency.exponent ?? NO_EXPONENT;
    return untracked(() => new BudgetDraft(exponent, (code) => this.order().get(code) ?? Number.MAX_SAFE_INTEGER));
  });

  protected readonly answer = computed<Budget | null>(() => (this.store.status() === 'ready' ? this.store.budget() : null));
  protected readonly answerLines = computed(() => new Map<string, BudgetLine>((this.answer()?.lines ?? []).map((line) => [line.category, line])));
  protected readonly offPlanRows = computed<readonly OffPlanItem[]>(() => {
    const summary = this.store.summary();
    const answer = this.answer();
    if (summary === null || answer === null) return [];
    const draft = this.draft();
    return offPlanCategories(
      summary,
      answer.lines.map((line) => line.category),
    ).map((row) => ({ ...row, canAdd: draft.canAdd(row.code) && this.categories.node(row.code)?.retired !== true }));
  });
  protected readonly lastMonths = computed(
    () => new Map(this.draft().lines().map((line) => [line.category, lastMonthActual(this.store.previous(), line.category)] as const)),
  );
  protected readonly submitted = signal(false);
  protected readonly serverErrors = signal<BudgetFieldErrors | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly busy = computed(() => this.store.busy() !== 'idle');

  protected readonly incomeError = computed(() => this.fieldError(this.draft().incomeError(), this.serverErrors()?.income ?? null));
  protected readonly savingError = computed(() => this.fieldError(this.draft().savingError(), this.serverErrors()?.saving ?? null));

  private requested: string | null = null;
  private draftSource: string | null = null;

  constructor() {
    effect(() => {
      const bookId = this.book()?.id ?? null;
      const month = this.month();
      untracked(() => {
        this.shownMonth.set(month);
        if (bookId === null || (this.requested !== null && this.store.bookId() === bookId && this.store.month() === month)) return;
        this.requested = month;
        void this.store.open(bookId, month);
      });
    });

    effect(() => {
      const shown = this.store.month();
      untracked(() => {
        if (shown === null || this.requested === null || shown === this.requested) return;
        this.requested = shown;
        this.navigateTo(shown);
      });
    });

    effect(() => {
      const answer = this.answer();
      const draft = this.draft();
      untracked(() => {
        if (answer === null) return;
        const source = `${this.store.bookId()}|${answer.month}`;
        if (source !== this.draftSource || !draft.dirty()) this.resetDraft(answer, source);
      });
    });
  }

  ngOnInit(): void {
    void this.categories.load();
    this.store.setActive(true);
  }

  ngOnDestroy(): void {
    this.store.setActive(false);
  }

  async canLeave(): Promise<boolean> {
    if (this.busy()) return false;
    if (!this.draft().dirty()) return true;
    return this.confirm.ask({
      title: this.translate.instant('budget.leave.title'),
      message: this.translate.instant('budget.leave.message'),
      confirmLabel: this.translate.instant('budget.leave.confirm'),
      cancelLabel: this.translate.instant('budget.leave.cancel'),
      tone: 'danger',
    });
  }

  protected async changeMonth(month: string): Promise<void> {
    this.shownMonth.set(month);
    if (month === this.month()) return;
    if (!(await this.canLeave())) {
      this.shownMonth.set(this.month());
      return;
    }
    this.draft().reset(this.answer());
    this.navigateTo(month);
  }

  protected lineError(category: string): string | null {
    const parse = this.draft().lineErrors().get(category);
    const server = this.serverErrors()?.lines[category];
    return this.fieldError(parse ?? null, server?.planned ?? server?.category ?? null);
  }

  protected setLine(category: string, text: string): void {
    this.draft().setLine(category, text);
    this.clearLineErrors(category);
  }

  protected removeLine(category: string): void {
    this.draft().removeLine(category);
    this.clearLineErrors(category);
  }

  protected setIncome(event: Event): void {
    this.draft().setIncome((event.target as HTMLInputElement).value);
    this.serverErrors.update((errors) => (errors === null ? null : { ...errors, income: null }));
  }

  protected setSaving(event: Event): void {
    this.draft().setSaving((event.target as HTMLInputElement).value);
    this.serverErrors.update((errors) => (errors === null ? null : { ...errors, saving: null }));
  }

  protected async addLine(): Promise<void> {
    const code = await openCategoryPicker(this.dialog, { mode: 'plan', excluded: [...this.draft().categories()] });
    if (code !== null) this.draft().addLine(code);
  }

  protected addFromOffPlan(row: OffPlanCategory): void {
    this.draft().addLine(row.code, row.total);
  }

  protected async save(): Promise<void> {
    if (this.busy()) return;
    this.submitted.set(true);
    const input = this.draft().toInput();
    if (input === null) return;
    const clearing = input.lines.length === 0 && input.expectedIncome === null && input.plannedSaving === null;
    if (clearing && this.answer()?.hasPlan === true && !(await this.askClear())) return;
    this.notice.set(null);
    this.serverErrors.set(null);
    const result = await this.store.save(input);
    this.afterWrite(result, input, clearing ? 'budget.cleared' : 'budget.saved');
  }

  protected async copy(): Promise<void> {
    if (this.busy()) return;
    const untouched = this.answer()?.hasPlan === false && !this.draft().dirty();
    if (!untouched && !(await this.askReplace())) return;
    this.notice.set(null);
    this.serverErrors.set(null);
    let result = await this.store.copy(!untouched);
    if (result.outcome === 'error' && budgetReaction(result.error) === 'notEmpty') {
      if (!(await this.askReplace())) return;
      result = await this.store.copy(true);
    }
    this.afterWrite(result, null, 'budget.copy.done');
  }

  protected retry(): void {
    void this.store.reload();
  }

  private afterWrite(result: BudgetWriteResult, input: BudgetInput | null, toastKey: string): void {
    if (result.outcome === 'done') {
      this.resetDraft(result.budget, `${this.store.bookId()}|${result.budget.month}`);
      this.toast.show({ message: this.translate.instant(toastKey), tone: 'success' });
      return;
    }
    this.handleError(result.error, input);
  }

  private handleError(error: ApiError, input: BudgetInput | null): void {
    switch (budgetReaction(error)) {
      case 'fields': {
        const errors = budgetFieldErrors(error, input?.lines.map((line) => line.category) ?? [], this.translate);
        this.serverErrors.set(errors);
        if (errors.alerts.length > 0) this.notice.set(errors.alerts.join(' '));
        return;
      }
      case 'bookGone':
        this.toast.show({ message: this.translate.instant('budget.errors.bookGone'), tone: 'danger' });
        return;
      case 'throttled':
        this.notice.set(throttledMessage(this.translate, error));
        return;
      case 'offline':
        this.notice.set(this.translate.instant('budget.errors.offline'));
        return;
      case 'nothingToCopy':
        this.notice.set(this.translate.instant('budget.copy.nothing'));
        return;
      default:
        this.notice.set(this.translate.instant('budget.errors.generic'));
    }
  }

  private askClear(): Promise<boolean> {
    return this.confirm.ask({
      title: this.translate.instant('budget.clear.title'),
      message: this.translate.instant('budget.clear.message'),
      confirmLabel: this.translate.instant('budget.clear.confirm'),
      cancelLabel: this.translate.instant('budget.cancel'),
      tone: 'danger',
    });
  }

  private askReplace(): Promise<boolean> {
    return this.confirm.ask({
      title: this.translate.instant('budget.copy.replaceTitle'),
      message: this.translate.instant('budget.copy.replaceMessage'),
      confirmLabel: this.translate.instant('budget.copy.replaceConfirm'),
      cancelLabel: this.translate.instant('budget.cancel'),
      tone: 'danger',
    });
  }

  private resetDraft(budget: Budget, source: string): void {
    this.draftSource = source;
    this.draft().reset(budget);
    this.submitted.set(false);
    this.serverErrors.set(null);
  }

  private clearLineErrors(category: string): void {
    this.serverErrors.update((errors) => {
      if (errors === null || errors.lines[category] === undefined) return errors;
      const lines = { ...errors.lines };
      delete lines[category];
      return { ...errors, lines };
    });
  }

  private fieldError(parse: Parameters<typeof parseMessage>[1] | null, server: string | null): string | null {
    if (server !== null) return server;
    return parse !== null && this.submitted() ? parseMessage(this.translate, parse) : null;
  }

  private navigateTo(month: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { [MONTH_PARAM]: month }, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
