import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ApiError } from '@shared/http-data-access';
import { SessionStore } from '@shared/identity-data-access';
import { Observable, Subject, of, throwError } from 'rxjs';
import { Summary, SummaryPeriod } from '../../dashboard/data/models';
import { SummaryApi } from '../../dashboard/data/summary-api';
import { summary } from '../../dashboard/testing';
import { BooksStore } from '../../households/data/books.store';
import { book } from '../../households/testing';
import { LedgerChanges } from '../../ledger/ledger-changes';
import { NO_PLAN, budget } from '../testing';
import { BudgetApi } from './budget-api';
import { BudgetStore } from './budget.store';
import { Budget } from './models';
import { provideBudget } from './provide-budget';

const error = (code: string, status = 422, fields: Record<string, string[]> = {}) =>
  new ApiError(status === 422 ? 'validation' : status === 409 ? 'conflict' : 'not-found', status, code, fields, null, 'r1');

function setup() {
  const api = {
    get: vi.fn<(bookId: string, month: string) => Observable<Budget>>().mockReturnValue(of(budget())),
    save: vi.fn<(bookId: string, month: string, input: unknown) => Observable<Budget>>(),
    copy: vi.fn<(bookId: string, month: string, replace: boolean) => Observable<Budget>>(),
  };
  const summaries = { get: vi.fn<(bookId: string, period: SummaryPeriod) => Observable<Summary>>().mockReturnValue(of(summary())) };
  const selectedBookId = signal<string | null>('b1');
  const account = signal<{ id: string; name: string } | null>({ id: 'u1', name: 'Moi' });
  const load = vi.fn().mockResolvedValue({ outcome: 'done' });
  TestBed.configureTestingModule({
    providers: [
      { provide: BudgetApi, useValue: api },
      { provide: SummaryApi, useValue: summaries },
      { provide: BooksStore, useValue: { books: signal([book('b1'), book('b2')]), selectedBookId, load } },
      { provide: SessionStore, useValue: { account } },
      provideBudget(),
    ],
  });
  const store = TestBed.inject(BudgetStore);
  TestBed.tick();
  return { api, summaries, store, selectedBookId, account, load, ledger: TestBed.inject(LedgerChanges) };
}

const INPUT = { expectedIncome: null, plannedSaving: null, lines: [] };

describe('BudgetStore (spec 008 REQ-5.6, 5.9, 5.10, 8.2–8.4, 8.10)', () => {
  it('opens a month and keeps the answer', async () => {
    const { api, store } = setup();
    await store.open('b1', '2026-11');
    expect(api.get).toHaveBeenCalledWith('b1', '2026-11');
    expect(store.status()).toBe('ready');
    expect(store.budget()?.hasPlan).toBe(true);
  });

  it('loads the month summary and the previous month beside the budget (REQ-9.13, 9.14)', async () => {
    const { summaries, store } = setup();
    await store.open('b1', '2026-01');
    await Promise.resolve();
    expect(summaries.get).toHaveBeenCalledWith('b1', { month: '2026-01' });
    expect(summaries.get).toHaveBeenCalledWith('b1', { month: '2025-12' });
    expect(store.summary()).not.toBeNull();
    expect(store.previous()).not.toBeNull();
  });

  it('keeps the budget ready and the summaries empty when they fail', async () => {
    const { summaries, store } = setup();
    summaries.get.mockReturnValue(throwError(() => error('http.offline', 0)));
    await store.open('b1', '2026-11');
    await new Promise((resolve) => setTimeout(resolve));
    expect(store.status()).toBe('ready');
    expect(store.summary()).toBeNull();
    expect(store.previous()).toBeNull();
  });

  it('drops a stale summary after a month change', async () => {
    const { summaries, store } = setup();
    const slow = new Subject<Summary>();
    summaries.get.mockReturnValueOnce(slow);
    await store.open('b1', '2026-10');
    await store.open('b1', '2026-11');
    slow.next(summary({ totals: { income: 0, expense: 777, saving: 0, balance: 0, entries: 1 } }));
    slow.complete();
    await new Promise((resolve) => setTimeout(resolve));
    expect(store.summary()?.totals.expense).not.toBe(777);
  });

  it('refreshes the summaries on a quiet reload, but not after a save', async () => {
    const { summaries, store, ledger } = setup();
    await store.open('b1', '2026-11');
    await new Promise((resolve) => setTimeout(resolve));
    summaries.get.mockClear();
    ledger.changed('b1', ['2026-11']);
    TestBed.tick();
    expect(summaries.get).toHaveBeenCalledTimes(2);
    summaries.get.mockClear();
    ledger.budgetChanged('b1', '2026-11');
    TestBed.tick();
    expect(summaries.get).not.toHaveBeenCalled();
  });

  it('drops an older answer when the month changes during a load', async () => {
    const { api, store } = setup();
    const slow = new Subject<Budget>();
    api.get.mockReturnValueOnce(slow);
    const first = store.open('b1', '2026-10');
    await store.open('b1', '2026-11');
    slow.next(NO_PLAN);
    slow.complete();
    await first;
    expect(store.month()).toBe('2026-11');
    expect(store.budget()?.hasPlan).toBe(true);
  });

  it('falls back to the current month when the month is refused', async () => {
    const { api, store } = setup();
    api.get.mockReturnValueOnce(throwError(() => error('validation.failed', 422, { month: ['month.before_or_equal'] })));
    await store.open('b1', '2099-01');
    expect(store.month()).not.toBe('2099-01');
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(store.status()).toBe('ready');
  });

  it('refetches the books and shows no error when the book is gone', async () => {
    const { api, store, load } = setup();
    api.get.mockReturnValueOnce(throwError(() => error('book.not_found', 404)));
    const result = await store.open('b1', '2026-11');
    expect(result.outcome).toBe('done');
    expect(load).toHaveBeenCalledWith({ force: true });
    expect(store.error()).toBeNull();
  });

  it('keeps the error of a failed load', async () => {
    const { api, store } = setup();
    api.get.mockReturnValueOnce(throwError(() => error('http.offline', 0)));
    await store.open('b1', '2026-11');
    expect(store.status()).toBe('error');
    expect(store.error()?.code).toBe('http.offline');
  });

  it('saves, shows its own answer and signals a budget change', async () => {
    const { api, store, ledger } = setup();
    await store.open('b1', '2026-11');
    api.save.mockReturnValue(of(NO_PLAN));
    const result = await store.save(INPUT);
    expect(result).toEqual({ outcome: 'done', budget: NO_PLAN });
    expect(store.budget()).toBe(NO_PLAN);
    expect(ledger.last()).toMatchObject({ kind: 'budget', bookId: 'b1', months: ['2026-11'] });
  });

  it('returns the error of a refused save and keeps the last answer', async () => {
    const { api, store, ledger } = setup();
    await store.open('b1', '2026-11');
    api.save.mockReturnValue(throwError(() => error('validation.failed', 422, { 'lines.0.planned': ['lines.planned.min'] })));
    const result = await store.save(INPUT);
    expect(result).toMatchObject({ outcome: 'error', error: { code: 'validation.failed' } });
    expect(store.budget()?.hasPlan).toBe(true);
    expect(store.busy()).toBe('idle');
    expect(ledger.last()).toBeNull();
  });

  it('copies with replace and surfaces both 409 codes', async () => {
    const { api, store } = setup();
    await store.open('b1', '2026-11');
    api.copy.mockReturnValueOnce(throwError(() => error('budget.not_empty', 409)));
    expect(await store.copy(false)).toMatchObject({ outcome: 'error', error: { code: 'budget.not_empty' } });
    api.copy.mockReturnValueOnce(throwError(() => error('budget.nothing_to_copy', 409)));
    expect(await store.copy(true)).toMatchObject({ outcome: 'error', error: { code: 'budget.nothing_to_copy' } });
    api.copy.mockReturnValueOnce(of(budget()));
    expect((await store.copy(true)).outcome).toBe('done');
    expect(api.copy).toHaveBeenLastCalledWith('b1', '2026-11', true);
  });

  it('reloads quietly when an entry of the shown month changes, not for other months or budget writes', async () => {
    const { api, store, ledger } = setup();
    await store.open('b1', '2026-11');
    api.get.mockClear();
    ledger.changed('b1', ['2026-10']);
    TestBed.tick();
    ledger.budgetChanged('b1', '2026-11');
    TestBed.tick();
    expect(api.get).not.toHaveBeenCalled();
    ledger.changed('b1', ['2026-11']);
    TestBed.tick();
    expect(api.get).toHaveBeenCalledWith('b1', '2026-11');
    expect(store.status()).toBe('ready');
  });

  it('follows the book while the page is shown and clears it otherwise', async () => {
    const { api, store, selectedBookId } = setup();
    store.setActive(true);
    await store.open('b1', '2026-11');
    selectedBookId.set('b2');
    TestBed.tick();
    expect(api.get).toHaveBeenLastCalledWith('b2', '2026-11');
    store.setActive(false);
    selectedBookId.set('b1');
    TestBed.tick();
    expect(store.bookId()).toBeNull();
    expect(store.budget()).toBeNull();
  });

  it('resets on account change', async () => {
    const { store, account } = setup();
    await store.open('b1', '2026-11');
    account.set({ id: 'u2', name: 'Autre' });
    TestBed.tick();
    expect(store.bookId()).toBeNull();
    expect(store.month()).toBeNull();
  });
});
