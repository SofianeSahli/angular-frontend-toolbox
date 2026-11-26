import { DialogRef } from '@angular/cdk/dialog';
import { Injectable, inject } from '@angular/core';
import { UiDialog } from '@shared/ui-organisms';
import { filter, merge, takeUntil } from 'rxjs';
import { BooksStore } from '../households/data/books.store';
import { Entry } from './data/models';
import { EntrySheet, EntrySheetData, EntrySheetMode } from './parts/entry-sheet/entry-sheet';

@Injectable({ providedIn: 'root' })
export class EntrySheetService {
  private readonly dialog = inject(UiDialog);
  private readonly books = inject(BooksStore);

  openNew(options: { readonly mode?: EntrySheetMode } = {}): DialogRef<unknown, EntrySheet> | null {
    const book = this.books.selectedBook();
    return book === null ? null : this.open({ book, mode: options.mode ?? 'once' });
  }

  openEdit(entry: Entry): DialogRef<unknown, EntrySheet> | null {
    const book = this.books.selectedBook();
    return book === null ? null : this.open({ book, entry });
  }

  private open(data: EntrySheetData): DialogRef<unknown, EntrySheet> {
    const ref = this.dialog.open<unknown, EntrySheetData, EntrySheet>(EntrySheet, {
      data,
      size: 'md',
      presentation: 'auto',
      autoFocus: '#entry-amount',
    });
    ref.disableClose = true;
    merge(ref.backdropClick, ref.keydownEvents.pipe(filter((event) => event.key === 'Escape')))
      .pipe(takeUntil(ref.closed))
      .subscribe(() => void ref.componentInstance?.requestClose());
    return ref;
  }
}
