import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { todayIn } from '@shared/util-format';
import { Observable, firstValueFrom, map } from 'rxjs';
import { BudgetApi } from '../../budget/data/budget-api';
import { refusesMonth } from '../../budget/data/budget.store';
import { Budget } from '../../budget/data/models';
import { Card, idleCard } from '../../dashboard/data/card';
import { Summary } from '../../dashboard/data/models';
import { SummaryApi } from '../../dashboard/data/summary-api';
import { BooksStore } from '../../households/data/books.store';
import { toApiError } from '../../households/data/store-result';
import { addMonths, currentMonth } from '../../ledger/month-context';
import { quietReads } from '../../ledger/quiet-reads';
import { EntriesApi } from '../../operations/data/entries-api';
import { monthRange } from '../../operations/data/filters';
import { FixedBills, fixedBills } from '../support/fixed-bills';
import { trendRange } from '../support/trend-series';

export type AnalysisCardName = 'budget' | 'summary' | 'previous' | 'trend' | 'fixed';

export interface FixedCard {
  readonly bills: FixedBills;
  readonly complete: boolean;
}

export const FIXED_MAX_PAGES = 20;

const DEFAULT_TIMEZONE = 'Africa/Tunis';

interface AnalysisState {
  bookId: string | null;
  month: string | null;
  today: string | null;
  budget: Card<Budget>;
  summary: Card<Summary>;
  previous: Card<Summary>;
  trend: Card<Summary>;
  fixed: Card<FixedCard>;
  active: boolean;
}

const cards = {
  budget: idleCard<Budget>(),
  summary: idleCard<Summary>(),
  previous: idleCard<Summary>(),
  trend: idleCard<Summary>(),
  fixed: idleCard<FixedCard>(),
};

const initialState: AnalysisState = { bookId: null, month: null, today: null, ...cards, active: false };

export const AnalysisStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(
    (store, budgetApi = inject(BudgetApi), summaryApi = inject(SummaryApi), entriesApi = inject(EntriesApi), books = inject(BooksStore)) => {
      const generations: Record<AnalysisCardName, number> = { budget: 0, summary: 0, previous: 0, trend: 0, fixed: 0 };

      const todayFor = (bookId: string): string => todayIn(books.books().find((book) => book.id === bookId)?.timezone ?? DEFAULT_TIMEZONE);

      function bump(): void {
        for (const name of Object.keys(generations) as AnalysisCardName[]) generations[name] += 1;
      }

      function context(): { bookId: string; month: string; today: string } | null {
        const bookId = store.bookId();
        const month = store.month();
        const today = store.today();
        return bookId === null || month === null || today === null ? null : { bookId, month, today };
      }

      function setCard(name: AnalysisCardName, card: Card<unknown>): void {
        patchState(store, { [name]: card } as unknown as Partial<AnalysisState>);
      }

      async function run<T>(name: AnalysisCardName, quiet: boolean, request: () => Observable<T>): Promise<void> {
        const started = ++generations[name];
        const card = store[name]() as unknown as Card<T>;
        if (!quiet || card.status !== 'ready') setCard(name, { status: 'loading', data: quiet ? card.data : null, error: null });
        try {
          const data = await firstValueFrom(request());
          if (started === generations[name]) setCard(name, { status: 'ready', data, error: null });
        } catch (caught) {
          if (started !== generations[name]) return;
          const error = toApiError(caught);
          if (error.code === 'book.not_found') {
            void books.load({ force: true });
            return;
          }
          if (name === 'budget' && refusesMonth(error)) {
            fallBackToCurrentMonth();
            return;
          }
          setCard(name, { status: 'error', data: null, error });
        }
      }

      function fallBackToCurrentMonth(): void {
        const at = context();
        if (at === null || at.month === currentMonth(at.today)) return;
        patchState(store, { month: currentMonth(at.today) });
        loadAll(false);
      }

      const loaders: Record<AnalysisCardName, (quiet: boolean) => Promise<void>> = {
        budget: (quiet) => withContext((at) => run('budget', quiet, () => budgetApi.get(at.bookId, at.month))),
        summary: (quiet) => withContext((at) => run('summary', quiet, () => summaryApi.get(at.bookId, { month: at.month }))),
        previous: (quiet) => withContext((at) => run('previous', quiet, () => summaryApi.get(at.bookId, { month: addMonths(at.month, -1) }))),
        trend: (quiet) => withContext((at) => run('trend', quiet, () => summaryApi.get(at.bookId, trendRange(at.month)))),
        fixed: (quiet) =>
          withContext((at) =>
            run('fixed', quiet, () =>
              entriesApi
                .collect(at.bookId, { ...monthRange(at.month), type: 'expense', category: null, author: null }, { maxPages: FIXED_MAX_PAGES }, quietReads())
                .pipe(map((collection): FixedCard => ({ bills: fixedBills(collection.items, at.month), complete: collection.complete }))),
            ),
          ),
      };

      function withContext(action: (at: { bookId: string; month: string; today: string }) => Promise<void>): Promise<void> {
        const at = context();
        return at === null ? Promise.resolve() : action(at);
      }

      function loadAll(quiet: boolean): void {
        for (const load of Object.values(loaders)) void load(quiet);
      }

      function open(bookId: string, month: string): void {
        if (store.bookId() !== bookId) {
          bump();
          patchState(store, cards);
        }
        patchState(store, { bookId, month, today: todayFor(bookId) });
        loadAll(false);
      }

      return {
        open,

        reload(card: AnalysisCardName): Promise<void> {
          return loaders[card](false);
        },

        refresh(kind: 'ledger' | 'budget' | 'history'): void {
          if (context() === null) return;
          if (kind === 'budget') {
            void loaders.budget(true);
            return;
          }
          if (kind === 'history') {
            void loaders.previous(true);
            void loaders.trend(true);
            return;
          }
          loadAll(true);
        },

        setActive(active: boolean): void {
          patchState(store, { active });
        },

        clear(): void {
          bump();
          patchState(store, { bookId: null, ...cards });
        },

        reset(): void {
          bump();
          patchState(store, initialState);
        },
      };
    },
  ),
);
