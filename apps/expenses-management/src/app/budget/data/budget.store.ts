import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { ApiError } from '@shared/http-data-access';
import { todayIn } from '@shared/util-format';
import { Observable, firstValueFrom } from 'rxjs';
import { Summary } from '../../dashboard/data/models';
import { SummaryApi } from '../../dashboard/data/summary-api';
import { BooksStore } from '../../households/data/books.store';
import { DONE, StoreResult, toApiError } from '../../households/data/store-result';
import { LedgerChanges } from '../../ledger/ledger-changes';
import { addMonths } from '../../ledger/month-context';
import { BudgetApi } from './budget-api';
import { Budget, BudgetInput } from './models';

export type BudgetStatus = 'idle' | 'loading' | 'ready' | 'error';
export type BudgetBusy = 'idle' | 'saving' | 'copying';

export type BudgetWriteResult = { readonly outcome: 'done'; readonly budget: Budget } | { readonly outcome: 'error'; readonly error: ApiError };

interface BudgetState {
  bookId: string | null;
  month: string | null;
  status: BudgetStatus;
  budget: Budget | null;
  summary: Summary | null;
  previous: Summary | null;
  error: ApiError | null;
  busy: BudgetBusy;
  active: boolean;
}

const initialState: BudgetState = { bookId: null, month: null, status: 'idle', budget: null, summary: null, previous: null, error: null, busy: 'idle', active: false };

const DEFAULT_TIMEZONE = 'Africa/Tunis';

export function refusesMonth(error: ApiError): boolean {
  return error.code === 'validation.failed' && error.fields['month'] !== undefined;
}

export const BudgetStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, api = inject(BudgetApi), summaries = inject(SummaryApi), books = inject(BooksStore), ledger = inject(LedgerChanges)) => {
    let generation = 0;
    let extras = 0;

    const currentMonth = (bookId: string): string =>
      todayIn(books.books().find((book) => book.id === bookId)?.timezone ?? DEFAULT_TIMEZONE).slice(0, 7);

    function loadExtras(bookId: string, month: string, quiet: boolean): void {
      const started = ++extras;
      if (!quiet) patchState(store, { summary: null, previous: null });
      const settle = (request: Observable<Summary>, write: (value: Summary | null) => void): void => {
        firstValueFrom(request).then(
          (data) => {
            if (started === extras) write(data);
          },
          () => {
            if (started === extras) write(null);
          },
        );
      };
      settle(summaries.get(bookId, { month }), (data) => patchState(store, { summary: data }));
      settle(summaries.get(bookId, { month: addMonths(month, -1) }), (data) => patchState(store, { previous: data }));
    }

    async function load(options: { quiet?: boolean; fallback?: boolean } = {}): Promise<StoreResult> {
      const bookId = store.bookId();
      const month = store.month();
      if (bookId === null || month === null) return DONE;
      const started = ++generation;
      if (options.quiet !== true) patchState(store, { status: 'loading', error: null });
      loadExtras(bookId, month, options.quiet === true);
      try {
        const budget = await firstValueFrom(api.get(bookId, month));
        if (started !== generation) return DONE;
        patchState(store, { budget, status: 'ready', error: null });
        return DONE;
      } catch (caught) {
        if (started !== generation) return DONE;
        const error = toApiError(caught);
        if (refusesMonth(error) && options.fallback !== false && month !== currentMonth(bookId)) {
          patchState(store, { month: currentMonth(bookId) });
          return load({ fallback: false });
        }
        if (error.code === 'book.not_found') {
          void books.load({ force: true });
          patchState(store, { status: 'loading' });
          return DONE;
        }
        patchState(store, { status: 'error', error });
        return { outcome: 'error', error };
      }
    }

    async function write(busy: BudgetBusy, call: (bookId: string, month: string) => Observable<Budget>): Promise<BudgetWriteResult> {
      const bookId = store.bookId();
      const month = store.month();
      if (bookId === null || month === null || store.busy() !== 'idle') {
        return { outcome: 'error', error: new ApiError('server', 0, 'http.unknown', {}, null, '') };
      }
      const started = ++generation;
      patchState(store, { busy });
      try {
        const budget = await firstValueFrom(call(bookId, month));
        patchState(store, { busy: 'idle' });
        if (started === generation) patchState(store, { budget, status: 'ready', error: null });
        ledger.budgetChanged(bookId, month);
        return { outcome: 'done', budget };
      } catch (caught) {
        patchState(store, { busy: 'idle' });
        const error = toApiError(caught);
        if (error.code === 'book.not_found') void books.load({ force: true });
        return { outcome: 'error', error };
      }
    }

    return {
      open(bookId: string, month: string): Promise<StoreResult> {
        if (store.bookId() !== bookId) patchState(store, { budget: null, summary: null, previous: null });
        patchState(store, { bookId, month });
        return load();
      },

      reload(options: { quiet?: boolean } = {}): Promise<StoreResult> {
        return load(options);
      },

      save(input: BudgetInput): Promise<BudgetWriteResult> {
        return write('saving', (bookId, month) => api.save(bookId, month, input));
      },

      copy(replace: boolean): Promise<BudgetWriteResult> {
        return write('copying', (bookId, month) => api.copy(bookId, month, replace));
      },

      setActive(active: boolean): void {
        patchState(store, { active });
      },

      clear(): void {
        generation += 1;
        extras += 1;
        patchState(store, { bookId: null, budget: null, summary: null, previous: null, status: 'idle', error: null, busy: 'idle' });
      },

      reset(): void {
        generation += 1;
        extras += 1;
        patchState(store, initialState);
      },
    };
  }),
);
