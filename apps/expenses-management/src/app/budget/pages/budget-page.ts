import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiButton, UiIcon, UiSkeleton } from '@shared/ui-atoms';
import { UiAlert, UiEmptyState, UiMonthStrip, UiMonthStripItem, UiSaveBar } from '@shared/ui-molecules';
import { UiConfirm, UiDialog, UiToast } from '@shared/ui-organisms';
import { UiPage } from '@shared/ui-templates';
import { formatMinor, parseMajor, todayIn } from '@shared/util-format';
import { firstValueFrom, map } from 'rxjs';
import { CategoriesStore } from '../../categories/data/categories.store';
import { CategoryLabels } from '../../categories/data/category-labels';
import { openCategoryPicker } from '../../categories/parts/category-picker';
import { MONTH_PARAM, addMonths, monthFromQuery, positionOf } from '../../ledger/month-context';
import { quietReads } from '../../ledger/quiet-reads';
import { RecurringRule } from '../../recurring/data/models';
import { RecurringApi } from '../../recurring/data/recurring-api';
import { BudgetPlans } from '../data/budget-plans';
import { AmountSheetResult, openAmountSheet } from '../parts/amount-sheet';
import { BudgetSummary } from '../parts/budget-summary';
import { KnownRulesCard, dueInMonth } from '../parts/known-rules-card';
import { futureMonths, stripMonths, stripStatus } from '../support/strip-months';
import { injectTranslationRevision } from '../../i18n/translation-revision';
import { BooksStore } from '../../households/data/books.store';
import { uiLocale } from '../../operations/support/day-groups';
import { BudgetDraft } from '../data/budget-draft';
import { LeaveCheck } from './budget-leave.guard';
import { BudgetStore, BudgetWriteResult } from '../data/budget.store';
import { Budget, BudgetInput, BudgetLine } from '../data/models';
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
    BudgetSummary,
    KnownRulesCard,
    OffPlanList,
    PlanLineRow,
    TranslatePipe,
    UiAlert,
    UiButton,
    UiEmptyState,
    UiIcon,
    UiMonthStrip,
    UiPage,
    UiSaveBar,
    UiSkeleton,
  ],
  templateUrl: './budget-page.html',
  styleUrls: ['./budget-page.scss', '../parts/budget-parts.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetPage implements OnInit, OnDestroy, LeaveCheck {
  protected readonly store = inject(BudgetStore);
  private readonly books = inject(BooksStore);
  private readonly categories = inject(CategoriesStore);
  private readonly labels = inject(CategoryLabels);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly confirm = inject(UiConfirm);
  private readonly dialog = inject(UiDialog);
  private readonly toast = inject(UiToast);
  private readonly plans = inject(BudgetPlans);
  private readonly recurringApi = inject(RecurringApi);
  private readonly revision = injectTranslationRevision();

  protected readonly book = this.books.selectedBook;
  protected readonly today = computed(() => todayIn(this.book()?.timezone ?? DEFAULT_TIMEZONE));
  private readonly queryMonth = toSignal(this.route.queryParamMap.pipe(map((params) => params.get(MONTH_PARAM))), { initialValue: null });
  protected readonly month = computed(() => monthFromQuery(this.queryMonth(), this.today()));
  protected readonly shownMonth = signal('');
  protected readonly startedFresh = signal(false);
  private readonly rules = signal<readonly RecurringRule[]>([]);
  private rulesRequest = 0;
  protected readonly future = computed(() => positionOf(this.month(), this.today()) === 'future');
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

  protected readonly stripItems = computed<readonly UiMonthStripItem[]>(() => {
    this.revision();
    const today = this.today();
    const plans = this.plans.plans();
    const short = new Intl.DateTimeFormat(this.locale(), { month: 'short', timeZone: 'UTC' });
    return stripMonths(today, this.month()).map((month) => {
      const status = stripStatus(month, today, plans);
      return {
        month,
        label: short.format(this.firstDay(month)),
        caption: month.slice(2, 4),
        status,
        statusLabel: status === undefined ? undefined : this.translate.instant(`budget.strip.${status}`),
      };
    });
  });
  protected readonly monthName = computed(() => this.longMonth(this.month()));
  protected readonly previousMonthName = computed(() => this.longMonth(addMonths(this.month(), -1)));
  protected readonly showEmpty = computed(() => {
    const answer = this.answer();
    return answer !== null && !answer.hasPlan && !this.draft().dirty() && !this.startedFresh();
  });
  protected readonly knownRules = computed(() => (this.future() ? this.rules() : []));
  protected readonly showKnown = computed(() => dueInMonth(this.knownRules(), this.month()).length > 0);
  protected readonly saveBarText = computed(() => {
    this.revision();
    const count = this.draft().changeCount();
    return this.translate.instant(count === 1 ? 'budget.saveBar.one' : 'budget.saveBar.many', { count });
  });

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
        this.startedFresh.set(false);
        if (bookId !== null && positionOf(month, this.today()) === 'future') void this.loadRules(bookId);
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
        this.learnPlans(answer);
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

  protected async editLine(category: string): Promise<void> {
    const line = this.draft().lines().find((candidate) => candidate.category === category);
    if (line === undefined) return;
    const result = await this.askAmount(this.labels.name(category), line.text, true, false);
    if (result === undefined) return;
    if (result.kind === 'remove') this.draft().removeLine(category);
    else this.draft().setLine(category, result.text);
    this.clearLineErrors(category);
  }

  protected async editIncome(): Promise<void> {
    const result = await this.askAmount(this.translate.instant('budget.expectedIncome'), this.draft().income(), false, true);
    if (result?.kind !== 'set') return;
    this.draft().setIncome(result.text);
    this.serverErrors.update((errors) => (errors === null ? null : { ...errors, income: null }));
  }

  protected async editSaving(): Promise<void> {
    const result = await this.askAmount(this.translate.instant('budget.plannedSaving'), this.draft().saving(), false, true);
    if (result?.kind !== 'set') return;
    this.draft().setSaving(result.text);
    this.serverErrors.update((errors) => (errors === null ? null : { ...errors, saving: null }));
  }

  protected discard(): void {
    this.draft().discard();
    this.submitted.set(false);
    this.serverErrors.set(null);
    this.notice.set(null);
  }

  protected amountText(text: string): string {
    if (text.trim() === '') return '—';
    const parsed = parseMajor(text, this.book()?.currency.exponent ?? NO_EXPONENT, { allowZero: true });
    return parsed.ok ? this.minorText(parsed.minor) : text;
  }

  protected minorText(minor: number): string {
    const book = this.book();
    return book === null ? '' : formatMinor(minor, book.currency);
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
      const bookId = this.store.bookId();
      if (bookId !== null) this.plans.set(bookId, result.budget.month, result.budget.hasPlan);
      this.startedFresh.set(false);
      this.resetDraft(result.budget, `${bookId}|${result.budget.month}`);
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

  private askAmount(title: string, text: string, removable: boolean, optional: boolean): Promise<AmountSheetResult | undefined> {
    const book = this.book();
    if (book === null) return Promise.resolve(undefined);
    return openAmountSheet(this.dialog, { title, text, currency: book.currency, removable, optional });
  }

  private learnPlans(answer: Budget): void {
    const bookId = this.store.bookId();
    if (bookId === null) return;
    this.plans.load(bookId, futureMonths(this.today()));
    if (positionOf(answer.month, this.today()) === 'future') this.plans.set(bookId, answer.month, answer.hasPlan);
  }

  private async loadRules(bookId: string): Promise<void> {
    const request = ++this.rulesRequest;
    try {
      const rules = await firstValueFrom(this.recurringApi.list(bookId, quietReads()));
      if (request === this.rulesRequest) this.rules.set(rules);
    } catch {
      if (request === this.rulesRequest) this.rules.set([]);
    }
  }

  private firstDay(month: string): Date {
    return new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1));
  }

  private longMonth(month: string): string {
    this.revision();
    return new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(this.firstDay(month));
  }

  private navigateTo(month: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { [MONTH_PARAM]: month }, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
