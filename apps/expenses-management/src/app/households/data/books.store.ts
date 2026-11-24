import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { handling } from '@shared/http-data-access';
import { SessionStore } from '@shared/identity-data-access';
import { firstValueFrom } from 'rxjs';
import { BooksApi } from './books-api';
import { HouseholdStore } from './household.store';
import { Book, NewBook } from './models';
import { clearSelectedBook, readSelectedBook, writeSelectedBook } from './selected-book-storage';
import { DONE, StoreResult, toApiError, toResult } from './store-result';

export type BooksStatus = 'idle' | 'loading' | 'ready' | 'error';

interface BooksState {
  books: readonly Book[];
  selectedBookId: string | null;
  status: BooksStatus;
}

const initialState: BooksState = { books: [], selectedBookId: null, status: 'idle' };

export const MAX_PERSONAL_BOOKS = 5;

export const BooksStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    selectedBook: computed(() => store.books().find((book) => book.id === store.selectedBookId()) ?? null),
    householdBook: computed(() => store.books().find((book) => book.owner.type === 'household') ?? null),
    personalBooks: computed(() => store.books().filter((book) => book.owner.type === 'account')),
  })),
  withComputed((store) => ({
    canCreatePersonalBook: computed(() => store.personalBooks().length < MAX_PERSONAL_BOOKS),
  })),
  withMethods((store, api = inject(BooksApi), household = inject(HouseholdStore), session = inject(SessionStore)) => {
    let loadPromise: Promise<StoreResult> | null = null;
    let generation = 0;

    const accountId = (): string | null => session.account()?.id ?? null;

    function reconcileSelection(books: readonly Book[]): void {
      const id = accountId();
      const stored = id === null ? null : readSelectedBook(id);
      const has = (bookId: string | null): bookId is string => bookId !== null && books.some((book) => book.id === bookId);
      if (id !== null && stored !== null && !has(stored)) clearSelectedBook(id);
      const current = store.selectedBookId();
      const householdBook = books.find((book) => book.owner.type === 'household')?.id ?? null;
      const selected = [current, stored, householdBook, books[0]?.id ?? null].find(has) ?? null;
      patchState(store, { selectedBookId: selected });
    }

    async function fetch(started: number): Promise<StoreResult> {
      if (started !== generation) return DONE;
      if (store.status() !== 'ready') patchState(store, { status: 'loading' });
      try {
        const [books, householdResult] = await Promise.all([firstValueFrom(api.list()), household.loadHousehold()]);
        if (started !== generation) return DONE;
        if (householdResult.outcome === 'error') throw householdResult.error;
        patchState(store, { books, status: 'ready' });
        reconcileSelection(books);
        return DONE;
      } catch (error) {
        if (started !== generation) return DONE;
        patchState(store, { status: 'error' });
        return { outcome: 'error', error: toApiError(error) };
      }
    }

    return {
      load(options: { force?: boolean } = {}): Promise<StoreResult> {
        if (loadPromise !== null && options.force !== true) return loadPromise;
        if (loadPromise === null && options.force !== true && store.status() === 'ready') return Promise.resolve(DONE);
        const started = generation;
        const run = loadPromise === null ? fetch(started) : loadPromise.then(() => fetch(started));
        loadPromise = run;
        void run.finally(() => {
          if (loadPromise === run) loadPromise = null;
        });
        return run;
      },

      select(bookId: string): void {
        if (!store.books().some((book) => book.id === bookId)) return;
        patchState(store, { selectedBookId: bookId });
        const id = accountId();
        if (id !== null) writeSelectedBook(id, bookId);
      },

      create(input: NewBook): Promise<StoreResult> {
        return toResult(async () => {
          const book = await firstValueFrom(
            api.create(input, handling('book.limit_reached', 'household.forbidden', 'book.household_has_book', 'household_id.not_found', 'request.throttled')),
          );
          patchState(store, { books: [...store.books(), book], selectedBookId: book.id, status: 'ready' });
          const id = accountId();
          if (id !== null) writeSelectedBook(id, book.id);
        });
      },

      reset(): void {
        generation += 1;
        loadPromise = null;
        patchState(store, initialState);
      },
    };
  }),
);
