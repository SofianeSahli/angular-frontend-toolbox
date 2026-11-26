import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiDialog } from '@shared/ui-organisms';
import { EMPTY, Subject } from 'rxjs';
import { BooksStore } from '../households/data/books.store';
import { book } from '../households/testing';
import { EntrySheetService } from './entry-sheet.service';
import { EntrySheet } from './parts/entry-sheet/entry-sheet';
import { entry } from './testing';

describe('EntrySheetService (REQ-4.1, 4.10, 6.1)', () => {
  function setup(selected: ReturnType<typeof book> | null) {
    const backdropClick = new Subject<MouseEvent>();
    const requestClose = vi.fn();
    const ref = {
      disableClose: false,
      backdropClick,
      keydownEvents: EMPTY,
      closed: new Subject<void>(),
      componentInstance: { requestClose },
    };
    const dialog = { open: vi.fn(() => ref) };
    TestBed.configureTestingModule({
      providers: [
        { provide: UiDialog, useValue: dialog },
        { provide: BooksStore, useValue: { selectedBook: signal(selected) } },
      ],
    });
    return {
      service: TestBed.inject(EntrySheetService),
      dialog,
      ref,
      backdropClick,
      requestClose,
    };
  }

  it('does nothing without a selected book', () => {
    const { service, dialog } = setup(null);
    expect(service.openNew()).toBeNull();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('opens the sheet for the selected book, focusing the amount', () => {
    const { service, dialog } = setup(book('b1'));
    service.openNew();
    expect(dialog.open).toHaveBeenCalledWith(
      EntrySheet,
      expect.objectContaining({
        data: { book: book('b1'), mode: 'once' },
        autoFocus: '#entry-amount',
      }),
    );
  });

  it('opens the sheet in recurring mode when asked (spec 009 REQ-3.1)', () => {
    const { service, dialog } = setup(book('b1'));
    service.openNew({ mode: 'recurring' });
    expect(dialog.open).toHaveBeenCalledWith(EntrySheet, expect.objectContaining({ data: { book: book('b1'), mode: 'recurring' } }));
  });

  it('opens an entry in edit mode', () => {
    const { service, dialog } = setup(book('b1'));
    const saved = entry('e1');
    service.openEdit(saved);
    expect(dialog.open).toHaveBeenCalledWith(EntrySheet, expect.objectContaining({ data: { book: book('b1'), entry: saved } }));
  });

  it('routes a backdrop click through the close guard', () => {
    const { service, ref, backdropClick, requestClose } = setup(book('b1'));
    service.openNew();
    expect(ref.disableClose).toBe(true);
    backdropClick.next(new MouseEvent('click'));
    expect(requestClose).toHaveBeenCalled();
  });
});
