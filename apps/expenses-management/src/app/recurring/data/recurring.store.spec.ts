import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ApiError } from '@shared/http-data-access';
import { SessionStore } from '@shared/identity-data-access';
import { Observable, Subject, of, throwError } from 'rxjs';
import { BooksStore } from '../../households/data/books.store';
import { book } from '../../households/testing';
import { LedgerChanges } from '../../ledger/ledger-changes';
import { rule } from '../testing';
import { RecurringRule, RuleInput } from './models';
import { RecurringApi } from './recurring-api';
import { RecurringStore } from './recurring.store';
import { provideRecurring } from './provide-recurring';

const error = (code: string, status = 422) => new ApiError(status === 422 ? 'validation' : 'not-found', status, code, {}, null, 'r1');

const INPUT: RuleInput = {
  amount: 1000,
  category: 'food.groceries.supermarket',
  otherName: null,
  comment: null,
  frequency: 'monthly',
  interval: 1,
  startsOn: '2026-11-01',
  endsOn: null,
};

function setup() {
  const api = {
    list: vi.fn<(bookId: string) => Observable<RecurringRule[]>>().mockReturnValue(of([rule('r1'), rule('r2')])),
    create: vi.fn<(bookId: string, input: RuleInput) => Observable<RecurringRule>>(),
    update: vi.fn<(bookId: string, id: string, patch: unknown) => Observable<RecurringRule>>(),
    remove: vi.fn<(bookId: string, id: string) => Observable<void>>(),
  };
  const selectedBookId = signal<string | null>('b1');
  const account = signal<{ id: string; name: string } | null>({ id: 'u1', name: 'Moi' });
  const load = vi.fn().mockResolvedValue({ outcome: 'done' });
  TestBed.configureTestingModule({
    providers: [
      { provide: RecurringApi, useValue: api },
      { provide: BooksStore, useValue: { books: signal([book('b1'), book('b2')]), selectedBookId, load } },
      { provide: SessionStore, useValue: { account } },
      provideRecurring(),
    ],
  });
  const store = TestBed.inject(RecurringStore);
  TestBed.tick();
  return { api, store, selectedBookId, account, load, ledger: TestBed.inject(LedgerChanges) };
}

describe('RecurringStore (spec 008 REQ-6.1, 6.5, 6.6, 6.9, 8.2, 8.4)', () => {
  it('lists the rules of the book in API order', async () => {
    const { store } = setup();
    await store.open('b1');
    expect(store.rules().map((r) => r.id)).toEqual(['r1', 'r2']);
    expect(store.status()).toBe('ready');
  });

  it('drops an older answer after a book switch', async () => {
    const { api, store } = setup();
    const slow = new Subject<RecurringRule[]>();
    api.list.mockReturnValueOnce(slow);
    const first = store.open('b1');
    api.list.mockReturnValueOnce(of([rule('r9')]));
    await store.open('b2');
    slow.next([rule('old')]);
    slow.complete();
    await first;
    expect(store.rules().map((r) => r.id)).toEqual(['r9']);
  });

  it('creates, reloads the list and marks the ledger stale for every month', async () => {
    const { api, store, ledger } = setup();
    await store.open('b1');
    api.create.mockReturnValue(of(rule('r3')));
    api.list.mockReturnValue(of([rule('r1'), rule('r2'), rule('r3')]));
    const result = await store.create('b1', INPUT);
    expect(result).toMatchObject({ outcome: 'done', rule: { id: 'r3' } });
    expect(ledger.last()).toMatchObject({ kind: 'ledger', bookId: 'b1', months: 'all' });
    await Promise.resolve();
    expect(api.list).toHaveBeenCalledTimes(2);
  });

  it('returns the limit code without signalling a change', async () => {
    const { api, store, ledger } = setup();
    await store.open('b1');
    api.create.mockReturnValue(throwError(() => error('recurring_rule.limit_reached')));
    expect(await store.create('b1', INPUT)).toMatchObject({ outcome: 'error', error: { code: 'recurring_rule.limit_reached' } });
    expect(ledger.last()).toBeNull();
  });

  it('drops the row when the rule is gone', async () => {
    const { api, store } = setup();
    await store.open('b1');
    api.update.mockReturnValue(throwError(() => error('recurring_rule.not_found', 404)));
    await store.update('b1', 'r1', { amount: 5 });
    expect(store.rules().map((r) => r.id)).toEqual(['r2']);
  });

  it('removes a deleted rule and signals the change', async () => {
    const { api, store, ledger } = setup();
    await store.open('b1');
    api.remove.mockReturnValue(of(undefined));
    api.list.mockReturnValue(of([rule('r2')]));
    expect((await store.remove('b1', 'r1')).outcome).toBe('done');
    expect(store.rules().map((r) => r.id)).toEqual(['r2']);
    expect(ledger.last()?.months).toBe('all');
  });

  it('refetches the books when the book is gone', async () => {
    const { api, store, load } = setup();
    api.list.mockReturnValueOnce(throwError(() => error('book.not_found', 404)));
    await store.open('b1');
    expect(load).toHaveBeenCalledWith({ force: true });
    expect(store.status()).not.toBe('error');
  });

  it('follows the book while shown, clears it otherwise, and resets on account change', async () => {
    const { api, store, selectedBookId, account } = setup();
    store.setActive(true);
    await store.open('b1');
    selectedBookId.set('b2');
    TestBed.tick();
    expect(api.list).toHaveBeenLastCalledWith('b2');
    store.setActive(false);
    selectedBookId.set('b1');
    TestBed.tick();
    expect(store.bookId()).toBeNull();
    await store.open('b1');
    account.set({ id: 'u2', name: 'Autre' });
    TestBed.tick();
    expect(store.rules()).toEqual([]);
    expect(store.bookId()).toBeNull();
  });
});
