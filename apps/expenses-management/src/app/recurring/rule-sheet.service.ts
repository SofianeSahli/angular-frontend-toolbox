import { DialogRef } from '@angular/cdk/dialog';
import { Injectable, inject } from '@angular/core';
import { UiDialog } from '@shared/ui-organisms';
import { filter, merge, takeUntil } from 'rxjs';
import { BooksStore } from '../households/data/books.store';
import { RecurringRule } from './data/models';
import { RuleSheet, RuleSheetData } from './parts/rule-sheet';

@Injectable({ providedIn: 'root' })
export class RuleSheetService {
  private readonly dialog = inject(UiDialog);
  private readonly books = inject(BooksStore);

  openEdit(rule: RecurringRule): DialogRef<unknown, RuleSheet> | null {
    const book = this.books.selectedBook();
    return book === null ? null : this.open({ book, rule });
  }

  private open(data: RuleSheetData): DialogRef<unknown, RuleSheet> {
    const ref = this.dialog.open<unknown, RuleSheetData, RuleSheet>(RuleSheet, { data, size: 'md', presentation: 'auto', autoFocus: '#rule-amount' });
    ref.disableClose = true;
    merge(ref.backdropClick, ref.keydownEvents.pipe(filter((event) => event.key === 'Escape')))
      .pipe(takeUntil(ref.closed))
      .subscribe(() => void ref.componentInstance?.requestClose());
    return ref;
  }
}
