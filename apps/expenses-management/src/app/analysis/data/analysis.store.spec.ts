import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ApiError } from '@shared/http-data-access';
import { SessionStore } from '@shared/identity-data-access';
import { Observable, of, throwError } from 'rxjs';
import { BudgetApi } from '../../budget/data/budget-api';
import { Budget } from '../../budget/data/models';
import { budget } from '../../budget/testing';
import { Summary, SummaryPeriod } from '../../dashboard/data/models';
import { SummaryApi } from '../../dashboard/data/summary-api';
import { summary } from '../../dashboard/testing';
import { BooksStore } from '../../households/data/books.store';
import { book } from '../../households/testing';
import { LedgerChanges } from '../../ledger/ledger-changes';
import { EntriesApi } from '../../operations/data/entries-api';
import { EntryCollection, EntryFilters } from '../../operations/data/models';
import { entry } from '../../operations/testing';
import { AnalysisStore } from './analysis.store';
import { provideAnalysis } from './provide-analysis';

const offline = () => new ApiError('offline', 0, 'http.offline', {}, null, 'r1');
const flush = () => new Promise((resolve) => setTimeout(resolve));

function setup() {
  const apis = {
    budget: { get: vi.fn<(bookId: string, month: string) => Observable<Budget>>().mockReturnValue(of(budget())) },
    summary: { get: vi.fn<(bookId: string, period: SummaryPeriod) => Observable<Summary>>().mockReturnValue(of(summary())) },
    entries: {
      collect: vi
        .fn<(bookId: string, filters: EntryFilters, limits: { maxPages: number }) => Observable<EntryCollection>>()
        .mockReturnValue(of({ items: [entry('rent', { date: '2026-11-01', amount: 650000, recurring_rule_id: 'r1' })], complete: true })),
    },
  };
  const selectedBookId = signal<string | null>('b1');
  TestBed.configureTestingModule({
    providers: [
      { provide: BudgetApi, useValue: apis.budget },
      { provide: SummaryApi, useValue: apis.summary },
      { provide: EntriesApi, useValue: apis.entries },
      { provide: BooksStore, useValue: { books: signal([book('b1'), book('b2')]), selectedBookId, load: vi.fn() } },
      { provide: SessionStore, useValue: { account: signal({ id: 'u1', name: 'Moi' }) } },
      provideAnalysis(),
    ],
  });
  const store = TestBed.inject(AnalysisStore);
  TestBed.tick();
  return { apis, store, selectedBookId, ledger: TestBed.inject(LedgerChanges) };
}

describe('AnalysisStore (spec 009 REQ-6.1–6.3)', () => {
  it('loads the month, the previous month, six months and the fixed bills', async () => {
    const { apis, store } = setup();
    store.open('b1', '2026-11');
    await flush();
    expect(apis.summary.get).toHaveBeenCalledWith('b1', { month: '2026-11' });
    expect(apis.summary.get).toHaveBeenCalledWith('b1', { month: '2026-10' });
    expect(apis.summary.get).toHaveBeenCalledWith('b1', { from: '2026-06-01', to: '2026-11-30' });
    expect(apis.entries.collect.mock.calls[0][1]).toEqual({ from: '2026-11-01', to: '2026-11-30', type: 'expense', category: null, author: null });
    expect(apis.entries.collect.mock.calls[0][2]).toEqual({ maxPages: 20 });
    expect(store.fixed().data?.bills.total).toBe(650000);
    expect([store.budget().status, store.summary().status, store.previous().status, store.trend().status]).toEqual(['ready', 'ready', 'ready', 'ready']);
  });

  it('keeps each card apart when one fails, and retries it', async () => {
    const { apis, store } = setup();
    apis.summary.get.mockImplementation((_book, period) => ('from' in period ? throwError(offline) : of(summary())));
    store.open('b1', '2026-11');
    await flush();
    expect(store.trend().status).toBe('error');
    expect(store.summary().status).toBe('ready');
    apis.summary.get.mockReturnValue(of(summary()));
    await store.reload('trend');
    expect(store.trend().status).toBe('ready');
  });

  it('refetches the previous month and the trend when an earlier month of the window changes', async () => {
    const { apis, store, ledger } = setup();
    store.open('b1', '2026-11');
    await flush();
    apis.summary.get.mockClear();
    apis.budget.get.mockClear();
    ledger.changed('b1', ['2026-08']);
    TestBed.tick();
    expect(apis.summary.get).toHaveBeenCalledTimes(2);
    expect(apis.budget.get).not.toHaveBeenCalled();
    apis.summary.get.mockClear();
    ledger.changed('b1', ['2026-03']);
    TestBed.tick();
    expect(apis.summary.get).not.toHaveBeenCalled();
  });

  it('refetches every card quietly when the shown month changes', async () => {
    const { apis, store, ledger } = setup();
    store.open('b1', '2026-11');
    await flush();
    apis.entries.collect.mockClear();
    ledger.changed('b1', ['2026-11']);
    TestBed.tick();
    expect(apis.entries.collect).toHaveBeenCalledTimes(1);
    expect(store.summary().status).toBe('ready');
  });

  it('follows a new book while shown', async () => {
    const { apis, store, selectedBookId } = setup();
    store.setActive(true);
    store.open('b1', '2026-11');
    await flush();
    selectedBookId.set('b2');
    TestBed.tick();
    expect(apis.budget.get).toHaveBeenLastCalledWith('b2', '2026-11');
  });
});
