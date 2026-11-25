import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpContext } from '@angular/common/http';
import { ApiError, HANDLED_ERROR_CODES } from '@shared/http-data-access';
import { SessionStore } from '@shared/identity-data-access';
import { Observable, Subject, of, throwError } from 'rxjs';
import { BooksApi } from './books-api';
import { BooksStore } from './books.store';
import { HouseholdStore } from './household.store';
import { Book } from './models';
import { DONE } from './store-result';

const KEY = 'expenses.book.a1';

function book(id: string, owner: 'account' | 'household' = 'account'): Book {
  return {
    id,
    name: id,
    currency: { code: 'TND', exponent: 3 },
    timezone: 'Africa/Tunis',
    owner: { type: owner, id: owner === 'account' ? 'a1' : 'h1' },
    canManage: true,
  };
}

describe('BooksStore', () => {
  const list = vi.fn<() => Observable<Book[]>>();
  const create = vi.fn<(input: unknown, context?: unknown) => Observable<Book>>();
  const loadHousehold = vi.fn(() => Promise.resolve(DONE));
  const account = signal<{ id: string } | null>({ id: 'a1' });

  function store(): InstanceType<typeof BooksStore> {
    return TestBed.inject(BooksStore);
  }

  beforeEach(() => {
    localStorage.clear();
    list.mockReset();
    create.mockReset();
    loadHousehold.mockClear();
    account.set({ id: 'a1' });
    list.mockReturnValue(of([book('p1'), book('p2')]));
    TestBed.configureTestingModule({
      providers: [
        { provide: BooksApi, useValue: { list, create } },
        { provide: HouseholdStore, useValue: { loadHousehold } },
        { provide: SessionStore, useValue: { account } },
      ],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  describe('load', () => {
    it('waits for the running load instead of sending another request', async () => {
      const pending = new Subject<Book[]>();
      list.mockReturnValue(pending);
      const first = store().load();
      const second = store().load();
      expect(store().status()).toBe('loading');
      pending.next([book('p1')]);
      pending.complete();
      await Promise.all([first, second]);
      expect(list).toHaveBeenCalledTimes(1);
      expect(loadHousehold).toHaveBeenCalledTimes(1);
      expect(store().status()).toBe('ready');
    });

    it('does nothing once ready, and refetches with force', async () => {
      await store().load();
      await store().load();
      expect(list).toHaveBeenCalledTimes(1);
      await store().load({ force: true });
      expect(list).toHaveBeenCalledTimes(2);
    });

    it('sets the error status and returns the error when the books fail', async () => {
      const error = new ApiError('server', 500, 'http.500', {}, null, 'r1');
      list.mockReturnValue(throwError(() => error));
      const result = await store().load();
      expect(result).toEqual({ outcome: 'error', error });
      expect(store().status()).toBe('error');
    });

    it('sets the error status when the household fails to load', async () => {
      const error = new ApiError('offline', 0, 'http.offline', {}, null, 'r1');
      loadHousehold.mockResolvedValueOnce({ outcome: 'error', error } as never);
      expect((await store().load()).outcome).toBe('error');
      expect(store().status()).toBe('error');
    });

    it('can load again after an error', async () => {
      list.mockReturnValueOnce(throwError(() => new ApiError('server', 500, 'http.500', {}, null, 'r1')));
      await store().load();
      expect((await store().load()).outcome).toBe('done');
      expect(store().status()).toBe('ready');
    });
  });

  describe('selection fallback', () => {
    it('selects the stored book when it is in the list', async () => {
      localStorage.setItem(KEY, 'p2');
      list.mockReturnValue(of([book('p1'), book('h', 'household'), book('p2')]));
      await store().load();
      expect(store().selectedBookId()).toBe('p2');
    });

    it('falls back to the household book, then clears an unknown stored id', async () => {
      localStorage.setItem(KEY, 'gone');
      list.mockReturnValue(of([book('p1'), book('h', 'household')]));
      await store().load();
      expect(store().selectedBookId()).toBe('h');
      expect(localStorage.getItem(KEY)).toBeNull();
    });

    it('falls back to the oldest book when there is no household book', async () => {
      await store().load();
      expect(store().selectedBookId()).toBe('p1');
    });

    it('selects nothing when there is no book', async () => {
      list.mockReturnValue(of([]));
      await store().load();
      expect(store().selectedBookId()).toBeNull();
      expect(store().selectedBook()).toBeNull();
    });

    it('falls back and clears the stored id when the selected book disappears on reload', async () => {
      list.mockReturnValue(of([book('p1'), book('h', 'household')]));
      await store().load();
      store().select('h');
      expect(localStorage.getItem(KEY)).toBe('h');
      list.mockReturnValue(of([book('p1')]));
      await store().load({ force: true });
      expect(store().selectedBookId()).toBe('p1');
      expect(localStorage.getItem(KEY)).toBeNull();
    });

    it('keeps the current selection on reload when it still exists', async () => {
      await store().load();
      store().select('p2');
      await store().load({ force: true });
      expect(store().selectedBookId()).toBe('p2');
    });

    it('works when localStorage throws', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('denied');
      });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('denied');
      });
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('denied');
      });
      await store().load();
      expect(store().selectedBookId()).toBe('p1');
      store().select('p2');
      expect(store().selectedBookId()).toBe('p2');
    });

    it('ignores select for an unknown book', async () => {
      await store().load();
      store().select('nope');
      expect(store().selectedBookId()).toBe('p1');
    });
  });

  describe('create', () => {
    it('appends the new book, selects it and remembers it', async () => {
      await store().load();
      create.mockReturnValue(of(book('p3')));
      const result = await store().create({ name: 'p3' });
      expect(result).toEqual(DONE);
      expect(store().books().map((b) => b.id)).toEqual(['p1', 'p2', 'p3']);
      expect(store().selectedBookId()).toBe('p3');
      expect(localStorage.getItem(KEY)).toBe('p3');
    });

    it('declares the codes the new-book page handles', async () => {
      await store().load();
      create.mockReturnValue(of(book('p3')));
      await store().create({ name: 'p3' });
      const context = (create.mock.calls[0] as unknown[])[1] as HttpContext;
      expect([...context.get(HANDLED_ERROR_CODES)].sort()).toEqual(
        ['book.household_has_book', 'book.limit_reached', 'household.forbidden', 'household_id.not_found', 'request.throttled'].sort(),
      );
    });

    it('returns the error and leaves the books unchanged', async () => {
      await store().load();
      const error = new ApiError('validation', 422, 'book.limit_reached', {}, null, 'r1');
      create.mockReturnValue(throwError(() => error));
      expect(await store().create({ name: 'x' })).toEqual({ outcome: 'error', error });
      expect(store().books()).toHaveLength(2);
    });
  });

  describe('derived state', () => {
    it('splits household and personal books and caps personal books at five', async () => {
      list.mockReturnValue(of([book('h', 'household'), book('p1'), book('p2'), book('p3'), book('p4')]));
      await store().load();
      expect(store().householdBook()?.id).toBe('h');
      expect(store().personalBooks()).toHaveLength(4);
      expect(store().canCreatePersonalBook()).toBe(true);
      create.mockReturnValue(of(book('p5')));
      await store().create({ name: 'p5' });
      expect(store().canCreatePersonalBook()).toBe(false);
    });
  });

  describe('reset', () => {
    it('returns to the initial state', async () => {
      await store().load();
      store().reset();
      expect(store().books()).toEqual([]);
      expect(store().status()).toBe('idle');
      expect(store().selectedBookId()).toBeNull();
    });

    it('drops the result of a load that was running during the reset', async () => {
      const pending = new Subject<Book[]>();
      list.mockReturnValue(pending);
      const running = store().load();
      store().reset();
      pending.next([book('other')]);
      pending.complete();
      await running;
      expect(store().books()).toEqual([]);
      expect(store().status()).toBe('idle');
    });
  });
});
