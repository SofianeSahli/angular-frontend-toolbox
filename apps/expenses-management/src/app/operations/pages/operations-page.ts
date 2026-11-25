import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SessionStore } from '@shared/identity-data-access';
import { UiButton, UiIcon } from '@shared/ui-atoms';
import { UiAlert, UiEmptyState } from '@shared/ui-molecules';
import { UiGroupedList } from '@shared/ui-organisms';
import { UiPage } from '@shared/ui-templates';
import { todayIn } from '@shared/util-format';
import { CategoriesStore } from '../../categories/data/categories.store';
import { injectTranslationRevision } from '../../i18n/translation-revision';
import { BooksStore } from '../../households/data/books.store';
import { HouseholdStore } from '../../households/data/household.store';
import { EntrySheetService } from '../entry-sheet.service';
import { hasNarrowingFilters } from '../data/filters';
import { Entry, Person } from '../data/models';
import { OperationsStore } from '../data/operations.store';
import { EntryRow } from '../parts/entry-row';
import { OperationsFilters } from '../parts/operations-filters';
import { dayGroups, uiLocale } from '../support/day-groups';

@Component({
  selector: 'app-operations-page',
  imports: [EntryRow, OperationsFilters, TranslatePipe, UiAlert, UiButton, UiEmptyState, UiGroupedList, UiIcon, UiPage],
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

  protected readonly book = this.books.selectedBook;
  protected readonly locale = computed(() => {
    this.revision();
    return uiLocale(this.translate.getCurrentLang());
  });
  protected readonly isHouseholdBook = computed(() => this.book()?.owner.type === 'household');
  protected readonly today = computed(() => todayIn(this.book()?.timezone ?? 'Africa/Tunis'));

  private readonly revision = injectTranslationRevision();

  protected readonly groups = computed(() => {
    this.revision();
    return dayGroups(this.operations.entries(), this.today(), {
      today: this.translate.instant('operations.list.today'),
      yesterday: this.translate.instant('operations.list.yesterday'),
      locale: this.locale(),
    });
  });

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
    if (bookId !== null) void this.operations.open(bookId);
    this.operations.setActive(true);
    if (this.isHouseholdBook()) void this.household.loadDetail();
  }

  ngOnDestroy(): void {
    this.operations.setActive(false);
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
