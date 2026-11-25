import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ApiError } from '@shared/http-data-access';
import { SessionStore } from '@shared/identity-data-access';
import { Observable, Subject, of, throwError } from 'rxjs';
import { BudgetApi } from '../../budget/data/budget-api';
import { Budget } from '../../budget/data/models';
import { NO_PLAN, budget } from '../../budget/testing';
import { BooksStore } from '../../households/data/books.store';
import { book } from '../../households/testing';
import { LedgerChanges } from '../../ledger/ledger-changes';
import { EntriesApi } from '../../operations/data/entries-api';
import { EntryFilters, EntryPage } from '../../operations/data/models';
import { entry } from '../../operations/testing';
import { RecurringRule } from '../../recurring/data/models';
import { RecurringApi } from '../../recurring/data/recurring-api';
import { rule } from '../../recurring/testing';
import { summary } from '../testing';
import { DashboardStore } from './dashboard.store';
import { Summary, SummaryPeriod } from './models';
import { provideDashboard } from './provide-dashboard';
import { SummaryApi } from './summary-api';

const error = (code: string, status = 0, fields: Record<string, string[]> = {}) =>
  new ApiError(status === 0 ? 'offline' : status === 422 ? 'validation' : 'not-found', status, code, fields, null, 'r1');

const flush = () => new Promise((resolve) => setTimeout(resolve));

function setup() {
  const apis = {
    budget: { get: vi.fn<(bookId: string, month: string) => Observable<Budget>>().mockReturnValue(of(budget())) },
    summary: { get: vi.fn<(bookId: string, period: SummaryPeriod) => Observable<Summary>>().mockReturnValue(of(summary())) },
    recurring: { list: vi.fn<(bookId: string) => Observable<RecurringRule[]>>().mockReturnValue(of([rule('r1')])) },
    entries: {
      page: vi
        .fn<(bookId: string, filters: EntryFilters) => Observable<EntryPage>>()
        .mockReturnValue(of({ items: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'].map((id) => entry(id)), nextCursor: 'c2' })),
    },
  };
  const selectedBookId = signal<string | null>('b1');
  const account = signal<{ id: string; name: string } | null>({ id: 'u1', name: 'Moi' });
  const load = vi.fn().mockResolvedValue({ outcome: 'done' });
  TestBed.configureTestingModule({
    providers: [
      { provide: BudgetApi, useValue: apis.budget },
      { provide: SummaryApi, useValue: apis.summary },
      { provide: RecurringApi, useValue: apis.recurring },
      { provide: EntriesApi, useValue: apis.entries },
      { provide: BooksStore, useValue: { books: signal([book('b1'), book('b2')]), selectedBookId, load } },
      { provide: SessionStore, useValue: { account } },
      provideDashboard(),
    ],
  });
  const store = TestBed.inject(DashboardStore);
  TestBed.tick();
  return { apis, store, selectedBookId, account, load, ledger: TestBed.inject(LedgerChanges) };
}

describe('DashboardStore (spec 008 REQ-3.7, 3.8, 4.1–4.4, 8.2–8.5)', () => {
  it('loads every card from its own request', async () => {
    const { apis, store } = setup();
    store.open('b1', '2026-11');
    await flush();
    expect(apis.budget.get).toHaveBeenCalledWith('b1', '2026-11');
    expect(apis.summary.get).toHaveBeenCalledWith('b1', { month: '2026-11' });
    expect(apis.recurring.list).toHaveBeenCalledWith('b1');
    expect(apis.entries.page).toHaveBeenCalledWith('b1', { from: '2026-11-01', to: '2026-11-30', type: null, category: null, author: null });
    expect([store.budget().status, store.summary().status, store.upcoming().status, store.recent().status]).toEqual(['ready', 'ready', 'ready', 'ready']);
    expect(store.recent().data?.length).toBe(5);
    expect(store.firstUse()).toBe('no');
    expect(store.comparison().status).toBe('idle');
  });

  it('keeps the other cards when one fails', async () => {
    const { apis, store } = setup();
    apis.summary.get.mockReturnValue(throwError(() => error('http.offline')));
    store.open('b1', '2026-11');
    await flush();
    expect(store.summary()).toMatchObject({ status: 'error', error: { code: 'http.offline' } });
    expect(store.budget().status).toBe('ready');
    expect(store.recent().status).toBe('ready');
  });

  it('retries one card', async () => {
    const { apis, store } = setup();
    apis.summary.get.mockReturnValueOnce(throwError(() => error('http.offline')));
    store.open('b1', '2026-11');
    await flush();
    await store.reload('summary');
    expect(store.summary().status).toBe('ready');
  });

  it('compares with the previous month only without a plan', async () => {
    const { apis, store } = setup();
    apis.budget.get.mockReturnValue(of(NO_PLAN));
    apis.summary.get.mockImplementation((_book, period) =>
      of(summary({ totals: { income: 0, expense: 'month' in period ? 1 : period.from.startsWith('2026-10') ? 300 : 500, saving: 0, balance: 0, entries: 1 } })),
    );
    store.open('b1', '2026-10');
    await flush();
    expect(store.comparison()).toMatchObject({ status: 'ready', data: { current: 300, previous: 500 } });
  });

  it('shows the current amount alone when the previous month fails', async () => {
    const { apis, store } = setup();
    apis.budget.get.mockReturnValue(of(NO_PLAN));
    apis.summary.get.mockImplementation((_book, period) =>
      'from' in period && period.from.startsWith('2026-09') ? throwError(() => error('http.offline')) : of(summary()),
    );
    store.open('b1', '2026-10');
    await flush();
    expect(store.comparison()).toMatchObject({ status: 'ready', data: { current: 1000000, previous: null } });
  });

  it('detects a book never used with a request not limited to the month', async () => {
    const { apis, store } = setup();
    apis.entries.page.mockReturnValue(of({ items: [], nextCursor: null }));
    store.open('b1', '2026-11');
    await flush();
    expect(store.firstUse()).toBe('yes');
    const wide = apis.entries.page.mock.calls[1][1];
    expect(wide.from).toBe('2000-01-01');
  });

  it('keeps the normal cards for an empty month in a used book', async () => {
    const { apis, store } = setup();
    apis.entries.page.mockReturnValueOnce(of({ items: [], nextCursor: null })).mockReturnValueOnce(of({ items: [entry('old')], nextCursor: null }));
    store.open('b1', '2026-11');
    await flush();
    expect(store.firstUse()).toBe('no');
    expect(store.recent().data).toEqual([]);
  });

  it('drops a stale answer after a month change', async () => {
    const { apis, store } = setup();
    const slow = new Subject<Budget>();
    apis.budget.get.mockReturnValueOnce(slow);
    store.open('b1', '2026-10');
    store.setMonth('2026-11');
    await flush();
    slow.next(NO_PLAN);
    slow.complete();
    await flush();
    expect(store.budget().data?.hasPlan).toBe(true);
  });

  it('refetches the books and shows no error when the book is gone', async () => {
    const { apis, store, load } = setup();
    apis.budget.get.mockReturnValue(throwError(() => error('book.not_found', 404)));
    store.open('b1', '2026-11');
    await flush();
    expect(load).toHaveBeenCalledWith({ force: true });
    expect(store.budget().status).not.toBe('error');
  });

  it('falls back to the current month when the month is refused', async () => {
    const { apis, store } = setup();
    apis.budget.get.mockReturnValueOnce(throwError(() => error('validation.failed', 422, { month: ['month.before_or_equal'] })));
    store.open('b1', '2099-01');
    await flush();
    expect(store.month()).not.toBe('2099-01');
    expect(store.budget().status).toBe('ready');
  });

  it('refetches quietly on a ledger change for the shown month only', async () => {
    const { apis, store, ledger } = setup();
    store.open('b1', '2026-11');
    await flush();
    apis.budget.get.mockClear();
    apis.summary.get.mockClear();
    ledger.changed('b1', ['2026-10']);
    TestBed.tick();
    ledger.changed('b2', ['2026-11']);
    TestBed.tick();
    expect(apis.budget.get).not.toHaveBeenCalled();
    ledger.changed('b1', ['2026-11']);
    TestBed.tick();
    expect(apis.budget.get).toHaveBeenCalled();
    expect(apis.summary.get).toHaveBeenCalled();
    expect(store.summary().status).toBe('ready');
  });

  it('loads the previous month and the six-month summary beside the others (REQ-9.11)', async () => {
    const { apis, store } = setup();
    store.open('b1', '2026-11');
    await flush();
    expect(apis.summary.get).toHaveBeenCalledWith('b1', { month: '2026-10' });
    expect(apis.summary.get).toHaveBeenCalledWith('b1', { from: '2026-06-01', to: '2026-11-30' });
    expect([store.previous().status, store.trend().status]).toEqual(['ready', 'ready']);
  });

  it('keeps the hero and the other cards when the previous month or the trend fails (REQ-9.11)', async () => {
    const { apis, store } = setup();
    apis.summary.get.mockImplementation((_book, period) =>
      'month' in period && period.month === '2026-10'
        ? throwError(() => error('http.offline'))
        : 'from' in period && period.from === '2026-06-01'
          ? throwError(() => error('http.unknown', 500))
          : of(summary()),
    );
    store.open('b1', '2026-11');
    await flush();
    expect(store.previous().status).toBe('error');
    expect(store.trend().status).toBe('error');
    expect([store.budget().status, store.summary().status, store.recent().status]).toEqual(['ready', 'ready', 'ready']);
    apis.summary.get.mockReturnValue(of(summary()));
    await store.reload('trend');
    expect(store.trend().status).toBe('ready');
  });

  it('refetches the previous month and the trend when an earlier month of the window changes', async () => {
    const { apis, store, ledger } = setup();
    store.open('b1', '2026-11');
    await flush();
    apis.budget.get.mockClear();
    apis.summary.get.mockClear();
    ledger.changed('b1', ['2026-08']);
    TestBed.tick();
    expect(apis.budget.get).not.toHaveBeenCalled();
    expect(apis.summary.get).toHaveBeenCalledTimes(2);
    apis.summary.get.mockClear();
    ledger.changed('b1', ['2026-03']);
    TestBed.tick();
    expect(apis.summary.get).not.toHaveBeenCalled();
  });

  it('refetches only the budget after a budget write', async () => {
    const { apis, store, ledger } = setup();
    store.open('b1', '2026-11');
    await flush();
    apis.budget.get.mockClear();
    apis.summary.get.mockClear();
    ledger.budgetChanged('b1', '2026-11');
    TestBed.tick();
    expect(apis.budget.get).toHaveBeenCalledTimes(1);
    expect(apis.summary.get).not.toHaveBeenCalled();
  });

  it('reloads every card for a new book while shown, keeping the month', async () => {
    const { apis, store, selectedBookId } = setup();
    store.setActive(true);
    store.open('b1', '2026-11');
    await flush();
    selectedBookId.set('b2');
    TestBed.tick();
    await flush();
    expect(store.bookId()).toBe('b2');
    expect(store.month()).toBe('2026-11');
    expect(apis.recurring.list).toHaveBeenLastCalledWith('b2');
  });

  it('resets on account change', async () => {
    const { store, account } = setup();
    store.open('b1', '2026-11');
    await flush();
    account.set({ id: 'u2', name: 'Autre' });
    TestBed.tick();
    expect(store.bookId()).toBeNull();
    expect(store.budget().status).toBe('idle');
  });
});
