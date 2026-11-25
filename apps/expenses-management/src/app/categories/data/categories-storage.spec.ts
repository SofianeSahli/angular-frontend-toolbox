import { TREE } from '../testing';
import { CATEGORIES_STORAGE_KEY, clearStoredTree, readStoredTree, writeStoredTree } from './categories-storage';

describe('categories storage (REQ-2.2)', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('round-trips the tree and its ETag under expenses.categories', () => {
    writeStoredTree({ tops: TREE, etag: '"v1"' });
    expect(localStorage.getItem(CATEGORIES_STORAGE_KEY)).not.toBeNull();
    expect(readStoredTree()).toEqual({ tops: TREE, etag: '"v1"' });
  });

  it('gives nothing when there is no copy', () => {
    expect(readStoredTree()).toBeNull();
  });

  it.each([['not json'], ['{"etag":"x"}'], ['{"tops":[{"code":1}],"etag":null}'], ['[]'], ['{"tops":[],"etag":3}']])(
    'drops a copy that cannot be used: %s',
    (raw) => {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, raw);
      expect(readStoredTree()).toBeNull();
      expect(localStorage.getItem(CATEGORIES_STORAGE_KEY)).toBeNull();
    },
  );

  it('survives a storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(readStoredTree()).toBeNull();
    expect(() => writeStoredTree({ tops: TREE, etag: null })).not.toThrow();
    expect(() => clearStoredTree()).not.toThrow();
  });
});
