import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiAmount, UiButton, UiIcon, UiSkeleton } from '@shared/ui-atoms';
import { UiAlert, UiEmptyState, UiList } from '@shared/ui-molecules';
import { UiPage } from '@shared/ui-templates';
import { CategoryType } from '../../../categories/data/models';
import { CategoriesStore } from '../../../categories/data/categories.store';
import { BooksStore } from '../../../households/data/books.store';
import { EntrySheetService } from '../../../operations/entry-sheet.service';
import { RecurringRule } from '../../data/models';
import { RecurringStore } from '../../data/recurring.store';
import { RuleRow } from '../../parts/rule-row/rule-row';
import { RuleSheetService } from '../../rule-sheet.service';
import { isLive, monthlyAverage } from '../../support/monthly-average';

interface RuleSection {
  readonly type: CategoryType;
  readonly rules: readonly RecurringRule[];
}

const SECTION_ORDER: readonly CategoryType[] = ['expense', 'income', 'saving'];

@Component({
  selector: 'app-recurring-page',
  imports: [RuleRow, TranslatePipe, UiAlert, UiAmount, UiButton, UiEmptyState, UiIcon, UiList, UiPage, UiSkeleton],
  templateUrl: './recurring-page.html',
  styleUrl: './recurring-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecurringPage implements OnInit, OnDestroy {
  protected readonly store = inject(RecurringStore);
  private readonly books = inject(BooksStore);
  private readonly categories = inject(CategoriesStore);
  private readonly ruleSheets = inject(RuleSheetService);
  private readonly entrySheets = inject(EntrySheetService);

  protected readonly book = this.books.selectedBook;
  protected readonly showEnded = signal(false);
  protected readonly average = computed(() => monthlyAverage(this.store.rules(), this.book()?.currency.exponent ?? 0));
  protected readonly sections = computed<readonly RuleSection[]>(() => {
    const live = this.store.rules().filter(isLive);
    return SECTION_ORDER.map((type) => ({ type, rules: live.filter((rule) => rule.type === type) })).filter(
      (section) => section.type !== 'saving' || section.rules.length > 0,
    );
  });
  protected readonly ended = computed(() => this.store.rules().filter((rule) => !isLive(rule)));

  ngOnInit(): void {
    void this.categories.load();
    const bookId = this.books.selectedBookId();
    if (bookId !== null) void this.store.open(bookId);
    this.store.setActive(true);
  }

  ngOnDestroy(): void {
    this.store.setActive(false);
  }

  protected add(): void {
    this.entrySheets.openNew({ mode: 'recurring' });
  }

  protected edit(rule: RecurringRule): void {
    this.ruleSheets.openEdit(rule);
  }

  protected retry(): void {
    void this.store.reload();
  }
}
