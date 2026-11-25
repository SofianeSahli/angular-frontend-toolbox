import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { ApiError } from '@shared/http-data-access';
import { addYears, todayIn } from '@shared/util-format';
import { Observable, firstValueFrom } from 'rxjs';
import { BudgetApi } from '../../budget/data/budget-api';
import { refusesMonth } from '../../budget/data/budget.store';
import { Budget } from '../../budget/data/models';
import { BooksStore } from '../../households/data/books.store';
import { toApiError } from '../../households/data/store-result';
import { EntriesApi } from '../../operations/data/entries-api';
import { monthRange } from '../../operations/data/filters';
import { Entry, EntryFilters } from '../../operations/data/models';
import { RecurringRule } from '../../recurring/data/models';
import { RecurringApi } from '../../recurring/data/recurring-api';
import { comparisonRanges } from '../support/same-day';
import { trendRange } from '../support/trend-series';
import { MIN_MONTH, addMonths, currentMonth } from '../../ledger/month-context';
import { SummaryApi } from './summary-api';
import { Summary } from './models';

export type CardStatus = 'idle' | 'loading' | 'ready' | 'error';
export type CardName = 'budget' | 'summary' | 'comparison' | 'previous' | 'trend' | 'upcoming' | 'recent';
export type FirstUse = 'unknown' | 'yes' | 'no';

export interface Card<T> {
  readonly status: CardStatus;
  readonly data: T | null;
  readonly error: ApiError | null;
}

export interface Comparison {
  readonly current: number;
  readonly previous: number | null;
}

export const RECENT_SIZE = 5;

const DEFAULT_TIMEZONE = 'Africa/Tunis';

const idle = <T>(): Card<T> => ({ status: 'idle', data: null, error: null });

interface DashboardState {
  bookId: string | null;
  month: string | null;
  today: string | null;
  budget: Card<Budget>;
  summary: Card<Summary>;
  comparison: Card<Comparison>;
  previous: Card<Summary>;
  trend: Card<Summary>;
  upcoming: Card<readonly RecurringRule[]>;
  recent: Card<readonly Entry[]>;
  firstUse: FirstUse;
  active: boolean;
}

const cards = {
  budget: idle<Budget>(),
  summary: idle<Summary>(),
  comparison: idle<Comparison>(),
  previous: idle<Summary>(),
  trend: idle<Summary>(),
  upcoming: idle<readonly RecurringRule[]>(),
  recent: idle<readonly Entry[]>(),
};

const initialState: DashboardState = { bookId: null, month: null, today: null, ...cards, firstUse: 'unknown', active: false };

function filtersFor(from: string, to: string): EntryFilters {
  return { from, to, type: null, category: null, author: null };
}

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(
    (
      store,
      budgetApi = inject(BudgetApi),
      summaryApi = inject(SummaryApi),
      recurringApi = inject(RecurringApi),
      entriesApi = inject(EntriesApi),
      books = inject(BooksStore),
    ) => {
      const generations: Record<CardName | 'firstUse', number> = { budget: 0, summary: 0, comparison: 0, previous: 0, trend: 0, upcoming: 0, recent: 0, firstUse: 0 };

      const todayFor = (bookId: string): string => todayIn(books.books().find((book) => book.id === bookId)?.timezone ?? DEFAULT_TIMEZONE);

      function bump(): void {
        for (const name of Object.keys(generations) as (keyof typeof generations)[]) generations[name] += 1;
      }

      function context(): { bookId: string; month: string; today: string } | null {
        const bookId = store.bookId();
        const month = store.month();
        const today = store.today();
        return bookId === null || month === null || today === null ? null : { bookId, month, today };
      }

      function setCard(name: CardName, card: Card<unknown>): void {
        patchState(store, { [name]: card } as unknown as Partial<DashboardState>);
      }

      async function run<T>(name: CardName, quiet: boolean, request: () => Observable<T> | Promise<T>, after?: (data: T) => void): Promise<void> {
        const started = ++generations[name];
        const card = store[name]() as unknown as Card<T>;
        if (!quiet || card.status !== 'ready') setCard(name, { status: 'loading', data: quiet ? card.data : null, error: null });
        try {
          const pending = request();
          const data = pending instanceof Promise ? await pending : await firstValueFrom(pending);
          if (started !== generations[name]) return;
          setCard(name, { status: 'ready', data, error: null });
          after?.(data);
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
        loadMonth(false);
      }

      function loadBudget(quiet: boolean): Promise<void> {
        const at = context();
        if (at === null) return Promise.resolve();
        return run('budget', quiet, () => budgetApi.get(at.bookId, at.month), (budget) => {
          if (budget.hasPlan) {
            generations.comparison += 1;
            patchState(store, { comparison: idle<Comparison>() });
          } else void loadComparison(quiet);
        });
      }

      function loadComparison(quiet: boolean): Promise<void> {
        const at = context();
        if (at === null) return Promise.resolve();
        const ranges = comparisonRanges(at.month, at.today);
        return run('comparison', quiet, async () => {
          const previous = firstValueFrom(summaryApi.get(at.bookId, ranges.previous)).then(
            (summary) => summary.totals.expense,
            () => null,
          );
          const current = await firstValueFrom(summaryApi.get(at.bookId, ranges.current));
          return { current: current.totals.expense, previous: await previous };
        });
      }

      function loadSummary(quiet: boolean): Promise<void> {
        const at = context();
        if (at === null) return Promise.resolve();
        return run('summary', quiet, () => summaryApi.get(at.bookId, { month: at.month }));
      }

      function loadPrevious(quiet: boolean): Promise<void> {
        const at = context();
        if (at === null) return Promise.resolve();
        return run('previous', quiet, () => summaryApi.get(at.bookId, { month: addMonths(at.month, -1) }));
      }

      function loadTrend(quiet: boolean): Promise<void> {
        const at = context();
        if (at === null) return Promise.resolve();
        return run('trend', quiet, () => summaryApi.get(at.bookId, trendRange(at.month)));
      }

      function loadUpcoming(quiet: boolean): Promise<void> {
        const at = context();
        if (at === null) return Promise.resolve();
        return run('upcoming', quiet, () => recurringApi.list(at.bookId));
      }

      function loadRecent(quiet: boolean): Promise<void> {
        const at = context();
        if (at === null) return Promise.resolve();
        const range = monthRange(at.month);
        return run(
          'recent',
          quiet,
          async () => (await firstValueFrom(entriesApi.page(at.bookId, filtersFor(range.from, range.to)))).items.slice(0, RECENT_SIZE),
          (entries) => {
            if (entries.length > 0) {
              generations.firstUse += 1;
              patchState(store, { firstUse: 'no' });
            } else if (store.firstUse() !== 'no') void checkFirstUse();
          },
        );
      }

      async function checkFirstUse(): Promise<void> {
        const at = context();
        if (at === null) return;
        const started = ++generations.firstUse;
        try {
          const page = await firstValueFrom(entriesApi.page(at.bookId, filtersFor(`${MIN_MONTH}-01`, addYears(at.today, 1))));
          if (started === generations.firstUse) patchState(store, { firstUse: page.items.length === 0 ? 'yes' : 'no' });
        } catch {
          if (started === generations.firstUse) patchState(store, { firstUse: 'no' });
        }
      }

      function loadMonth(quiet: boolean): void {
        void loadBudget(quiet);
        void loadSummary(quiet);
        void loadPrevious(quiet);
        void loadTrend(quiet);
        void loadRecent(quiet);
      }

      const loaders: Record<CardName, (quiet: boolean) => Promise<void>> = {
        budget: loadBudget,
        summary: loadSummary,
        comparison: loadComparison,
        previous: loadPrevious,
        trend: loadTrend,
        upcoming: loadUpcoming,
        recent: loadRecent,
      };

      function open(bookId: string, month: string): void {
        const sameBook = store.bookId() === bookId;
        if (!sameBook) {
          bump();
          patchState(store, { ...cards, firstUse: 'unknown' });
        }
        patchState(store, { bookId, month, today: todayFor(bookId) });
        loadMonth(false);
        if (!sameBook || store.upcoming().status !== 'ready') void loadUpcoming(false);
      }

      return {
        open,

        setMonth(month: string): void {
          const bookId = store.bookId();
          if (bookId !== null && month !== store.month()) open(bookId, month);
        },

        reload(card: CardName): Promise<void> {
          return loaders[card](false);
        },

        refresh(kind: 'ledger' | 'budget' | 'history'): void {
          if (context() === null) return;
          if (kind === 'history') {
            void loadPrevious(true);
            void loadTrend(true);
            return;
          }
          if (kind === 'budget') {
            void loadBudget(true);
            return;
          }
          if (store.firstUse() === 'yes') patchState(store, { firstUse: 'unknown' });
          loadMonth(true);
          void loadUpcoming(true);
        },

        recheckFirstUse(): void {
          if (store.firstUse() === 'yes') void checkFirstUse();
        },

        setActive(active: boolean): void {
          patchState(store, { active });
        },

        clear(): void {
          bump();
          patchState(store, { bookId: null, ...cards, firstUse: 'unknown' });
        },

        reset(): void {
          bump();
          patchState(store, initialState);
        },
      };
    },
  ),
);
