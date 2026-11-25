import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiToast } from '@shared/ui-organisms';
import { firstValueFrom } from 'rxjs';
import { BooksStore } from '../../households/data/books.store';
import { DONE, StoreResult, toApiError } from '../../households/data/store-result';
import { LedgerChanges } from '../../ledger/ledger-changes';
import { EntriesApi } from './entries-api';
import { defaultFilters, insertInOrder, matches } from './filters';
import { Entry, EntryFilters, EntryInput, EntryPatch } from './models';

export type OperationsStatus = 'idle' | 'loading' | 'ready' | 'error';
export type PageStatus = 'idle' | 'loading' | 'error';

export type WriteResult = { readonly outcome: 'done'; readonly entry: Entry | null } | { readonly outcome: 'error'; readonly error: ApiError };

interface OperationsState {
  bookId: string | null;
  filters: EntryFilters | null;
  entries: readonly Entry[];
  nextCursor: string | null;
  status: OperationsStatus;
  pageStatus: PageStatus;
  pages: number;
  active: boolean;
}

const initialState: OperationsState = {
  bookId: null,
  filters: null,
  entries: [],
  nextCursor: null,
  status: 'idle',
  pageStatus: 'idle',
  pages: 0,
  active: false,
};

const DEFAULT_TIMEZONE = 'Africa/Tunis';

export const OperationsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(
    (
      store,
      api = inject(EntriesApi),
      books = inject(BooksStore),
      toast = inject(UiToast),
      translate = inject(TranslateService),
      ledger = inject(LedgerChanges),
    ) => {
    let generation = 0;

    const failed = (error: unknown): { outcome: 'error'; error: ApiError } => ({
      outcome: 'error',
      error: toApiError(error),
    });

    async function loadFirst(): Promise<StoreResult> {
      const bookId = store.bookId();
      const filters = store.filters();
      if (bookId === null || filters === null) return DONE;
      const started = ++generation;
      patchState(store, {
        status: 'loading',
        pageStatus: 'idle',
        entries: [],
        nextCursor: null,
        pages: 0,
      });
      try {
        const page = await firstValueFrom(api.page(bookId, filters));
        if (started !== generation) return DONE;
        patchState(store, {
          entries: page.items,
          nextCursor: page.nextCursor,
          status: 'ready',
          pages: 1,
        });
        return DONE;
      } catch (error) {
        if (started !== generation) return DONE;
        const result = failed(error);
        if (result.error.code === 'validation.failed') return resetAfterRefusal(filters);
        patchState(store, { status: 'error' });
        return result;
      }
    }

    function resetAfterRefusal(filters: EntryFilters): Promise<StoreResult> {
      toast.show({
        message: translate.instant('operations.toasts.filtersReset'),
      });
      patchState(store, {
        filters: { ...filters, type: null, category: null, author: null },
      });
      return loadFirst();
    }

    function removeRow(id: string): void {
      patchState(store, {
        entries: store.entries().filter((row) => row.id !== id),
      });
    }

    function isShown(bookId: string): boolean {
      return store.bookId() === bookId && store.status() === 'ready';
    }

    function knownMonth(id: string): string | null {
      return store.entries().find((row) => row.id === id)?.date.slice(0, 7) ?? null;
    }

    function signalChange(bookId: string, months: readonly (string | null)[]): void {
      ledger.changed(bookId, months.some((month) => month === null) ? 'all' : (months as string[]));
    }

    return {
      open(bookId: string, requested: Partial<EntryFilters> | null = null): Promise<StoreResult> {
        const current = store.filters();
        const timezone = books.books().find((book) => book.id === bookId)?.timezone ?? DEFAULT_TIMEZONE;
        const filters =
          requested !== null
            ? { ...defaultFilters(timezone), ...requested }
            : current === null
              ? defaultFilters(timezone)
              : store.bookId() === bookId
                ? current
                : { ...current, category: null, author: null };
        patchState(store, { bookId, filters });
        return loadFirst();
      },

      setFilters(partial: Partial<EntryFilters>): Promise<StoreResult> {
        const filters = store.filters();
        if (filters === null) return Promise.resolve(DONE);
        patchState(store, { filters: { ...filters, ...partial } });
        return loadFirst();
      },

      clearFilters(): Promise<StoreResult> {
        const filters = store.filters();
        if (filters === null) return Promise.resolve(DONE);
        patchState(store, {
          filters: { ...filters, type: null, category: null, author: null },
        });
        return loadFirst();
      },

      reload(): Promise<StoreResult> {
        return loadFirst();
      },

      async loadMore(): Promise<StoreResult> {
        const bookId = store.bookId();
        const filters = store.filters();
        const cursor = store.nextCursor();
        if (bookId === null || filters === null || cursor === null || store.status() !== 'ready' || store.pageStatus() === 'loading') return DONE;
        const started = generation;
        patchState(store, { pageStatus: 'loading' });
        try {
          const page = await firstValueFrom(api.page(bookId, filters, cursor));
          if (started !== generation) return DONE;
          patchState(store, {
            entries: [...store.entries(), ...page.items],
            nextCursor: page.nextCursor,
            pageStatus: 'idle',
            pages: store.pages() + 1,
          });
          return DONE;
        } catch (error) {
          if (started !== generation) return DONE;
          patchState(store, { pageStatus: 'error' });
          return failed(error);
        }
      },

      async create(bookId: string, input: EntryInput): Promise<WriteResult> {
        try {
          const saved = await firstValueFrom(api.create(bookId, input));
          signalChange(bookId, [saved.date.slice(0, 7)]);
          const filters = store.filters();
          if (isShown(bookId) && filters !== null && matches(saved, filters) && !store.entries().some((row) => row.id === saved.id)) {
            const entries = insertInOrder(store.entries(), saved);
            const appendedPastLoaded = entries[entries.length - 1] === saved && store.nextCursor() !== null;
            if (!appendedPastLoaded) patchState(store, { entries });
          }
          return { outcome: 'done', entry: saved };
        } catch (error) {
          return failed(error);
        }
      },

      async update(bookId: string, id: string, patch: EntryPatch): Promise<WriteResult> {
        try {
          const before = knownMonth(id);
          const saved = await firstValueFrom(api.update(bookId, id, patch));
          const after = saved.date.slice(0, 7);
          signalChange(bookId, patch.date === undefined ? [after] : [after, before]);
          const filters = store.filters();
          if (isShown(bookId)) {
            if (filters !== null && !matches(saved, filters)) removeRow(id);
            else
              patchState(store, {
                entries: store.entries().map((row) => (row.id === id ? saved : row)),
              });
          }
          return { outcome: 'done', entry: saved };
        } catch (error) {
          const result = failed(error);
          if (result.error.code === 'transaction.not_found') removeRow(id);
          return result;
        }
      },

      async remove(bookId: string, id: string): Promise<WriteResult> {
        try {
          const month = knownMonth(id);
          await firstValueFrom(api.remove(bookId, id), {
            defaultValue: undefined,
          });
          signalChange(bookId, [month]);
          removeRow(id);
          return { outcome: 'done', entry: null };
        } catch (error) {
          const result = failed(error);
          if (result.error.code === 'transaction.not_found') removeRow(id);
          return result;
        }
      },

      setActive(active: boolean): void {
        patchState(store, { active });
      },

      reset(): void {
        generation += 1;
        patchState(store, initialState);
      },
    };
    },
  ),
);
