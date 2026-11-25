import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiButton, UiIcon, UiSkeleton } from '@shared/ui-atoms';
import { UiAlert, UiEmptyState, UiList } from '@shared/ui-molecules';
import { UiConfirm, UiToast } from '@shared/ui-organisms';
import { UiPage } from '@shared/ui-templates';
import { CategoriesStore } from '../../categories/data/categories.store';
import { BooksStore } from '../../households/data/books.store';
import { retryText } from '../../households/support/retry-text';
import { RecurringRule } from '../data/models';
import { RecurringStore } from '../data/recurring.store';
import { RuleRow } from '../parts/rule-row';
import { RuleSheetService } from '../rule-sheet.service';
import { ruleReaction } from '../support/rule-errors';

@Component({
  selector: 'app-recurring-page',
  imports: [RuleRow, TranslatePipe, UiAlert, UiButton, UiEmptyState, UiIcon, UiList, UiPage, UiSkeleton],
  templateUrl: './recurring-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecurringPage implements OnInit, OnDestroy {
  protected readonly store = inject(RecurringStore);
  private readonly books = inject(BooksStore);
  private readonly categories = inject(CategoriesStore);
  private readonly sheets = inject(RuleSheetService);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  private readonly translate = inject(TranslateService);

  protected readonly book = this.books.selectedBook;

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
    this.sheets.openNew();
  }

  protected edit(rule: RecurringRule): void {
    this.sheets.openEdit(rule);
  }

  protected async remove(rule: RecurringRule): Promise<void> {
    const book = this.book();
    if (book === null) return;
    const confirmed = await this.confirm.ask({
      title: this.translate.instant('recurring.delete.title'),
      message: this.translate.instant('recurring.delete.message'),
      confirmLabel: this.translate.instant('recurring.delete.confirm'),
      cancelLabel: this.translate.instant('recurring.delete.cancel'),
      tone: 'danger',
    });
    if (!confirmed) return;
    const result = await this.store.remove(book.id, rule.id);
    if (result.outcome === 'done') {
      this.toast.show({ message: this.translate.instant('recurring.toasts.deleted'), tone: 'success' });
      return;
    }
    const error = result.error;
    const message: Record<string, string> = {
      ruleGone: this.translate.instant('recurring.toasts.gone'),
      bookGone: this.translate.instant('operations.toasts.bookGone'),
      throttled: this.translate.instant('operations.errors.throttled', { retry: retryText(this.translate, error.retryAfterSeconds) }),
      offline: this.translate.instant('recurring.errors.offline'),
    };
    this.toast.show({ message: message[ruleReaction(error)] ?? this.translate.instant('recurring.errors.generic'), tone: 'danger' });
  }

  protected retry(): void {
    void this.store.reload();
  }
}
