import { TestBed } from '@angular/core/testing';
import { ApiError } from '@shared/http-data-access';
import { Subject, of, throwError } from 'rxjs';
import { TREE } from '../testing';
import { CategoriesApi, TreeAnswer } from './categories-api';
import { CATEGORIES_STORAGE_KEY, readStoredTree, writeStoredTree } from './categories-storage';
import { CategoriesStore } from './categories.store';

const offline = new ApiError('offline', 0, 'http.offline', {}, null, 'r1');

function setup(answer: () => ReturnType<CategoriesApi['tree']>) {
  const api = { tree: vi.fn(answer) };
  TestBed.configureTestingModule({
    providers: [{ provide: CategoriesApi, useValue: api }],
  });
  return { api, store: TestBed.inject(CategoriesStore) };
}

describe('CategoriesStore (REQ-2.2, 2.3)', () => {
  afterEach(() => localStorage.clear());

  it('shows the stored copy at once, then revalidates with its ETag', async () => {
    writeStoredTree({ tops: TREE.slice(0, 1), etag: '"v1"' });
    const answer = new Subject<TreeAnswer>();
    const { api, store } = setup(() => answer);
    const loading = store.load();
    expect(store.status()).toBe('ready');
    expect(store.tops().map((top) => top.code)).toEqual(['salary']);
    expect(api.tree).toHaveBeenCalledWith('"v1"');
    answer.next({ tops: TREE, etag: '"v2"' });
    answer.complete();
    expect(await loading).toEqual({ outcome: 'done' });
    expect(store.tops()).toHaveLength(3);
    expect(readStoredTree()).toEqual({ tops: TREE, etag: '"v2"' });
  });

  it('keeps the copy on 304', async () => {
    writeStoredTree({ tops: TREE, etag: '"v1"' });
    const { store } = setup(() => of<TreeAnswer>('notModified'));
    await store.load();
    expect(store.tops()).toHaveLength(3);
    expect(store.etag()).toBe('"v1"');
  });

  it('revalidates once per session and de-duplicates concurrent loads', async () => {
    const { api, store } = setup(() => of<TreeAnswer>({ tops: TREE, etag: '"v1"' }));
    await Promise.all([store.load(), store.load()]);
    await store.load();
    expect(api.tree).toHaveBeenCalledTimes(1);
    await store.load({ force: true });
    expect(api.tree).toHaveBeenCalledTimes(2);
  });

  it('drops a corrupt copy and loads from the API', async () => {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, '{broken');
    const { api, store } = setup(() => of<TreeAnswer>({ tops: TREE, etag: null }));
    await store.load();
    expect(api.tree).toHaveBeenCalledWith(null);
    expect(store.status()).toBe('ready');
  });

  it('is in error with no copy when the call fails (REQ-2.5)', async () => {
    const { store } = setup(() => throwError(() => offline));
    expect(await store.load()).toEqual({ outcome: 'error', error: offline });
    expect(store.status()).toBe('error');
  });

  it('stays ready on a failure when a copy exists', async () => {
    writeStoredTree({ tops: TREE, etag: '"v1"' });
    const { store } = setup(() => throwError(() => offline));
    await store.load();
    expect(store.status()).toBe('ready');
  });

  it('orders tops expense, income, saving, then API order, and indexes every code', async () => {
    const { store } = setup(() => of<TreeAnswer>({ tops: TREE, etag: null }));
    await store.load();
    expect(store.orderedTops().map((top) => top.code)).toEqual(['food', 'salary', 'savings']);
    expect(store.node('food.groceries.bakery')).toMatchObject({
      level: 'leaf',
      type: 'expense',
      emoji: '🏪',
      isOther: false,
    });
    expect(store.node('food.groceries')).toMatchObject({
      level: 'group',
      type: 'expense',
      emoji: '🏪',
    });
    expect(store.node('salary')).toMatchObject({
      level: 'top',
      type: 'income',
    });
    expect(store.node('nope')).toBeNull();
  });

  it('offers only leaves that are not retired', async () => {
    const { store } = setup(() => of<TreeAnswer>({ tops: TREE, etag: null }));
    await store.load();
    const offerable = store.offerableLeaves().map((node) => node.code);
    expect(offerable).toContain('food.groceries.other');
    expect(offerable).not.toContain('food.groceries.old');
    expect(store.isOfferable('food.groceries.old')).toBe(false);
    expect(store.isOfferable('food.groceries')).toBe(false);
  });
});
