import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { SessionStore } from '@shared/identity-data-access';
import { UiToast } from '@shared/ui-organisms';
import { Observable, Subject, of, throwError } from 'rxjs';
import { BooksStore } from '../../households/data/books.store';
import { book } from '../../households/testing';
import { LedgerChanges } from '../../ledger/ledger-changes';
import { NOVEMBER, entry } from '../testing';
import { EntriesApi } from './entries-api';
import { Entry, EntryPage } from './models';
import { OperationsStore } from './operations.store';
import { provideOperations } from './provide-operations';

const error = (code: string, status = 422) => new ApiError(status === 422 ? 'validation' : 'not-found', status, code, {}, null, 'r1');

function setup(page: (cursor: string | null) => Observable<EntryPage>) {
  const api = {
    page: vi.fn((_book: string, _filters: unknown, cursor: string | null = null) => page(cursor)),
    create: vi.fn<(bookId: string, input: unknown) => Observable<Entry>>(),
    update: vi.fn<(bookId: string, id: string, patch: unknown) => Observable<Entry>>(),
    remove: vi.fn<(bookId: string, id: string) => Observable<void>>(),
  };
  const selectedBookId = signal<string | null>('b1');
  const account = signal<{ id: string; name: string } | null>({
    id: 'u1',
    name: 'Moi',
  });
  TestBed.configureTestingModule({
    providers: [
      provideTranslateService({ lang: 'fr' }),
      { provide: EntriesApi, useValue: api },
      {
        provide: BooksStore,
        useValue: { books: signal([book('b1'), book('b2')]), selectedBookId },
      },
      { provide: SessionStore, useValue: { account } },
      provideOperations(),
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', {
    operations: { toasts: { filtersReset: 'Filtres réinitialisés' } },
  });
  const store = TestBed.inject(OperationsStore);
  TestBed.tick();
  return {
    api,
    store,
    selectedBookId,
    account,
    toast: TestBed.inject(UiToast),
  };
}

const firstPage = (cursor: string | null): Observable<EntryPage> =>
  cursor === null
    ? of({ items: [entry('e1', { date: '2026-11-20' })], nextCursor: 'c2' })
    : of({ items: [entry('e2', { date: '2026-11-10' })], nextCursor: null });

describe('OperationsStore (REQ-5.5, 5.6, 5.8, 5.9, 4.9, 6.5, 7.4, 7.9)', () => {
  it('opens on the current month of the book timezone and loads page 1', async () => {
    const { api, store } = setup(firstPage);
    await store.open('b1');
    expect(store.filters()?.from).toMatch(/^\d{4}-\d{2}-01$/);
    expect(store.entries().map((e) => e.id)).toEqual(['e1']);
    expect(store.status()).toBe('ready');
    expect(api.page).toHaveBeenCalledTimes(1);
  });

  it('appends the next page, then stops at the end', async () => {
    const { api, store } = setup(firstPage);
    await store.open('b1');
    await store.loadMore();
    expect(store.entries().map((e) => e.id)).toEqual(['e1', 'e2']);
    expect(store.pages()).toBe(2);
    await store.loadMore();
    expect(api.page).toHaveBeenCalledTimes(2);
  });

  it('drops an older answer when the filters change during a load', async () => {
    const slow = new Subject<EntryPage>();
    let calls = 0;
    const { store } = setup(() => (++calls === 1 ? slow : of({ items: [entry('fresh')], nextCursor: null })));
    const first = store.open('b1');
    await store.setFilters({ type: 'income' });
    slow.next({ items: [entry('stale')], nextCursor: null });
    slow.complete();
    await first;
    expect(store.entries().map((e) => e.id)).toEqual(['fresh']);
  });

  it('resets the filters and shows a toast when the list refuses them', async () => {
    let calls = 0;
    const { store, toast } = setup(() => (++calls === 2 ? throwError(() => error('validation.failed')) : of({ items: [], nextCursor: null })));
    await store.open('b1');
    await store.setFilters({ category: 'gone' });
    expect(store.filters()?.category).toBeNull();
    expect(toast.toasts().map((t) => t.message)).toEqual(['Filtres réinitialisés']);
  });

  it('keeps loaded rows when a next page fails', async () => {
    const offline = new ApiError('offline', 0, 'http.offline', {}, null, 'r1');
    const { store } = setup((cursor) => (cursor === null ? firstPage(null) : throwError(() => offline)));
    await store.open('b1');
    const result = await store.loadMore();
    expect(result.outcome).toBe('error');
    expect(store.pageStatus()).toBe('error');
    expect(store.entries()).toHaveLength(1);
  });

  it('inserts a created entry when it matches, in date order', async () => {
    const { api, store } = setup(() =>
      of({
        items: [entry('e1', { date: '2026-11-20' }), entry('e3', { date: '2026-11-05' })],
        nextCursor: null,
      }),
    );
    await store.open('b1');
    await store.setFilters(NOVEMBER);
    api.create.mockReturnValue(of(entry('new', { date: '2026-11-12' })));
    const result = await store.create('b1', {
      id: 'new',
      amount: 1,
      date: '2026-11-12',
      category: 'x',
      otherName: null,
      comment: null,
    });
    expect(result).toMatchObject({ outcome: 'done', entry: { id: 'new' } });
    expect(store.entries().map((e) => e.id)).toEqual(['e1', 'new', 'e3']);
    api.create.mockReturnValue(of(entry('other-type', { type: 'income', date: '2026-11-12' })));
    await store.setFilters({ type: 'expense' });
    await store.create('b1', {
      id: 'other-type',
      amount: 1,
      date: '2026-11-12',
      category: 'x',
      otherName: null,
      comment: null,
    });
    expect(store.entries().some((e) => e.id === 'other-type')).toBe(false);
  });

  it('replaces an updated row and removes a deleted one', async () => {
    const { api, store } = setup(() => of({ items: [entry('e1', { date: '2026-11-20' })], nextCursor: null }));
    await store.open('b1');
    await store.setFilters(NOVEMBER);
    api.update.mockReturnValue(of(entry('e1', { date: '2026-11-20', amount: 999 })));
    await store.update('b1', 'e1', { amount: 999 });
    expect(store.entries()[0].amount).toBe(999);
    api.remove.mockReturnValue(of(undefined));
    await store.remove('b1', 'e1');
    expect(store.entries()).toEqual([]);
  });

  it('opens with filters asked by a drill-down in place of the defaults (spec 008 REQ-1.3)', async () => {
    const { api, store } = setup(() => of({ items: [], nextCursor: null }));
    await store.open('b1');
    await store.setFilters({ type: 'income', author: 'u2' });
    await store.open('b1', { from: '2026-10-01', to: '2026-10-31', category: 'food' });
    expect(store.filters()).toEqual({ from: '2026-10-01', to: '2026-10-31', type: null, category: 'food', author: null });
    expect(api.page).toHaveBeenLastCalledWith('b1', store.filters());
  });

  describe('ledger changes (spec 008 REQ-8.3)', () => {
    const input = { id: 'n1', amount: 1, date: '2026-11-12', category: 'x', otherName: null, comment: null };

    it('signals the month of a created entry', async () => {
      const { api, store } = setup(() => of({ items: [], nextCursor: null }));
      await store.open('b1');
      api.create.mockReturnValue(of(entry('n1', { date: '2026-10-31' })));
      await store.create('b1', input);
      expect(TestBed.inject(LedgerChanges).last()).toMatchObject({ kind: 'ledger', bookId: 'b1', months: ['2026-10'] });
    });

    it('signals both months when an edit moves an entry across months', async () => {
      const { api, store } = setup(() => of({ items: [entry('e1', { date: '2026-11-20' })], nextCursor: null }));
      await store.open('b1');
      api.update.mockReturnValue(of(entry('e1', { date: '2026-10-02' })));
      await store.update('b1', 'e1', { date: '2026-10-02' });
      expect(TestBed.inject(LedgerChanges).last()?.months).toEqual(['2026-10', '2026-11']);
      api.update.mockReturnValue(of(entry('e1', { date: '2026-10-02', amount: 5 })));
      await store.update('b1', 'e1', { amount: 5 });
      expect(TestBed.inject(LedgerChanges).last()?.months).toEqual(['2026-10']);
    });

    it('signals every month when the previous date is unknown', async () => {
      const { api, store } = setup(() => of({ items: [], nextCursor: null }));
      await store.open('b1');
      api.update.mockReturnValue(of(entry('far', { date: '2026-10-02' })));
      await store.update('b1', 'far', { date: '2026-10-02' });
      expect(TestBed.inject(LedgerChanges).last()?.months).toBe('all');
    });

    it('signals the month of a removed entry, and nothing on failure', async () => {
      const { api, store } = setup(() => of({ items: [entry('e1', { date: '2026-11-20' })], nextCursor: null }));
      await store.open('b1');
      api.remove.mockReturnValue(throwError(() => error('request.throttled', 429)));
      await store.remove('b1', 'e1');
      expect(TestBed.inject(LedgerChanges).last()).toBeNull();
      api.remove.mockReturnValue(of(undefined));
      await store.remove('b1', 'e1');
      expect(TestBed.inject(LedgerChanges).last()?.months).toEqual(['2026-11']);
    });
  });

  it('removes the row when the entry is gone', async () => {
    const { api, store } = setup(() => of({ items: [entry('e1', { date: '2026-11-20' })], nextCursor: null }));
    await store.open('b1');
    api.update.mockReturnValue(throwError(() => error('transaction.not_found', 404)));
    const result = await store.update('b1', 'e1', { amount: 1 });
    expect(result).toMatchObject({
      outcome: 'error',
      error: { code: 'transaction.not_found' },
    });
    expect(store.entries()).toEqual([]);
  });

  it('reloads for a new book while the page is active, keeping month and type', async () => {
    const { api, store, selectedBookId } = setup(() => of({ items: [], nextCursor: null }));
    await store.open('b1');
    await store.setFilters({
      type: 'income',
      category: 'salary',
      author: 'u2',
    });
    store.setActive(true);
    selectedBookId.set('b2');
    TestBed.tick();
    expect(store.bookId()).toBe('b2');
    expect(store.filters()).toMatchObject({
      type: 'income',
      category: null,
      author: null,
    });
    expect(api.page).toHaveBeenLastCalledWith('b2', expect.objectContaining({ type: 'income' }));
  });

  it('does not follow the book while the page is not shown', async () => {
    const { store, selectedBookId } = setup(() => of({ items: [], nextCursor: null }));
    await store.open('b1');
    selectedBookId.set('b2');
    TestBed.tick();
    expect(store.bookId()).toBe('b1');
  });

  it('resets on account change', async () => {
    const { store, account } = setup(firstPage);
    await store.open('b1');
    account.set({ id: 'u2', name: 'Autre' });
    TestBed.tick();
    expect(store.bookId()).toBeNull();
    expect(store.entries()).toEqual([]);
  });
});
