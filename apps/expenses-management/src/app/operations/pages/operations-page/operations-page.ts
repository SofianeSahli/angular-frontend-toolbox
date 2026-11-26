import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SessionStore } from '@shared/identity-data-access';
import { UiButton, UiIcon } from '@shared/ui-atoms';
import { UiAlert, UiEmptyState, UiSearchField } from '@shared/ui-molecules';
import { UiGroupedList } from '@shared/ui-organisms';
import { UiPage } from '@shared/ui-templates';
import { formatMinor, todayIn } from '@shared/util-format';
import { firstValueFrom } from 'rxjs';
import { CategoriesStore } from '../../../categories/data/categories.store';
import { CategoryLabels } from '../../../categories/data/category-labels';
import { SummaryApi } from '../../../dashboard/data/summary-api';
import { Totals } from '../../../dashboard/data/models';
import { LedgerChanges, affects } from '../../../ledger/ledger-changes';
import { quietReads } from '../../../ledger/quiet-reads';
import { matchesSearch } from '../../support/search';
import { injectTranslationRevision } from '../../../i18n/translation-revision';
import { BooksStore } from '../../../households/data/books.store';
import { HouseholdStore } from '../../../households/data/household.store';
import { EntrySheetService } from '../../entry-sheet.service';
import { CATEGORY_PARAM, MONTH_PARAM, isMonth, monthFromQuery } from '../../../ledger/month-context';
import { hasNarrowingFilters, monthOf, monthRange } from '../../data/filters';
import { Entry, EntryFilters, Person } from '../../data/models';
import { OperationsStore } from '../../data/operations.store';
import { EntryRow } from '../../parts/entry-row/entry-row';
import { OperationsFilters } from '../../parts/operations-filters/operations-filters';
import { dayGroups, uiLocale } from '../../support/day-groups';

export const SEARCH_MAX_PAGES = 20;

@Component({
  selector: 'app-operations-page',
  imports: [EntryRow, OperationsFilters, TranslatePipe, UiAlert, UiButton, UiEmptyState, UiGroupedList, UiIcon, UiPage, UiSearchField],
  templateUrl: './operations-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationsPage implements OnInit, OnDestroy {
  protected readonly operations = inject(OperationsStore);
  protected readonly categories = inject(CategoriesStore);
  private readonly books = inject(BooksStore);
  private readonly household = inject(HouseholdStore);
  private readonly session = inject(SessionStore);
  private readonly sheets = inject(EntrySheetService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly labels = inject(CategoryLabels);
  private readonly summaries = inject(SummaryApi);
  private readonly ledger = inject(LedgerChanges);

  protected readonly query = signal('');
  private readonly totals = signal<Totals | null>(null);
  private totalsRequest = 0;
  private totalsKey: string | null = null;
  private seenChange = 0;

  protected readonly book = this.books.selectedBook;
  protected readonly locale = computed(() => {
    this.revision();
    return uiLocale(this.translate.getCurrentLang());
  });
  protected readonly isHouseholdBook = computed(() => this.book()?.owner.type === 'household');
  protected readonly today = computed(() => todayIn(this.book()?.timezone ?? 'Africa/Tunis'));

  private readonly revision = injectTranslationRevision();

  protected readonly searching = computed(() => this.query().trim() !== '');
  protected readonly shown = computed(() => {
    const book = this.book();
    const query = this.query();
    if (book === null || !this.searching()) return this.operations.entries();
    this.revision();
    return this.operations.entries().filter((entry) => matchesSearch(entry, query, (code) => this.labels.name(code), book.currency));
  });
  protected readonly searchCapped = computed(() => this.searching() && this.operations.status() === 'ready' && this.operations.nextCursor() !== null && this.operations.pageStatus() !== 'loading');

  protected readonly groups = computed(() => {
    this.revision();
    const book = this.book();
    return dayGroups(
      this.shown(),
      this.today(),
      {
        today: this.translate.instant('operations.list.today'),
        yesterday: this.translate.instant('operations.list.yesterday'),
        locale: this.locale(),
      },
      book === null ? undefined : { currency: book.currency, lastDayComplete: this.operations.nextCursor() === null },
    );
  });

  protected readonly caption = computed(() => {
    const totals = this.totals();
    const book = this.book();
    if (totals === null || book === null) return undefined;
    return `−${formatMinor(totals.expense, book.currency)} · ${formatMinor(totals.income, book.currency, { signed: true })}`;
  });

  constructor() {
    effect(() => {
      const bookId = this.book()?.id ?? null;
      const filters = this.operations.filters();
      const change = this.ledger.last();
      untracked(() => {
        if (bookId === null || filters === null) return;
        const month = monthOf(filters);
        const key = `${bookId}|${month}`;
        const fresh = change !== null && change.version !== this.seenChange && affects(change, bookId, month);
        this.seenChange = change?.version ?? 0;
        if (key === this.totalsKey && !fresh) return;
        this.totalsKey = key;
        void this.loadTotals(bookId, month);
      });
    });

    effect(() => {
      const searching = this.searching();
      const status = this.operations.status();
      untracked(() => {
        if (searching && status === 'ready') void this.operations.loadAll(SEARCH_MAX_PAGES);
      });
    });
  }

  private async loadTotals(bookId: string, month: string): Promise<void> {
    const request = ++this.totalsRequest;
    try {
      const summary = await firstValueFrom(this.summaries.get(bookId, { month }, quietReads()));
      if (request === this.totalsRequest) this.totals.set(summary.totals);
    } catch {
      if (request === this.totalsRequest) this.totals.set(null);
    }
  }

  protected readonly authors = computed<readonly Person[]>(() => {
    const me = this.session.account();
    const self: Person[] = me ? [{ id: me.id, name: me.name }] : [];
    const members = this.isHouseholdBook() ? this.household.members().filter((member) => member.id !== me?.id) : [];
    return [...self, ...members.map((member) => ({ id: member.id, name: member.name }))];
  });

  protected readonly loading = computed(() => this.operations.status() === 'loading' || this.operations.pageStatus() === 'loading');
  protected readonly failed = computed(() => this.operations.status() === 'error' || this.operations.pageStatus() === 'error');
  protected readonly narrowed = computed(() => {
    const filters = this.operations.filters();
    return filters !== null && hasNarrowingFilters(filters);
  });
  protected readonly endReached = computed(
    () => this.operations.status() === 'ready' && this.operations.nextCursor() === null && this.operations.pages() > 1,
  );
  protected readonly categoriesUnavailable = computed(() => this.categories.status() === 'error' && this.categories.tops().length === 0);

  ngOnInit(): void {
    void this.categories.load();
    const bookId = this.books.selectedBookId();
    if (bookId !== null) void this.operations.open(bookId, this.requestedFilters());
    this.operations.setActive(true);
    if (this.isHouseholdBook()) void this.household.loadDetail();
  }

  ngOnDestroy(): void {
    this.operations.setActive(false);
  }

  private requestedFilters(): Partial<EntryFilters> | null {
    const params = this.route.snapshot.queryParamMap;
    const month = params.get(MONTH_PARAM);
    const category = params.get(CATEGORY_PARAM);
    if (!isMonth(month) && !category) return null;
    return {
      ...monthRange(monthFromQuery(month, this.today())),
      ...(category ? { category } : {}),
    };
  }

  protected add(): void {
    this.sheets.openNew();
  }

  protected edit(entry: Entry): void {
    this.sheets.openEdit(entry);
  }

  protected retry(): void {
    if (this.operations.pageStatus() === 'error') void this.operations.loadMore();
    else void this.operations.reload();
  }
}
