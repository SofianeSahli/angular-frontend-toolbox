import { pushRecentCategory, readRecentCategories, recentCategoriesKey } from './recent-categories';

describe('recent categories (REQ-3.4)', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('keeps the most recent first, without duplicates, per account and book', () => {
    pushRecentCategory('u1', 'b1', 'a');
    pushRecentCategory('u1', 'b1', 'b');
    pushRecentCategory('u1', 'b1', 'a');
    expect(readRecentCategories('u1', 'b1')).toEqual(['a', 'b']);
    expect(readRecentCategories('u1', 'b2')).toEqual([]);
    expect(readRecentCategories('u2', 'b1')).toEqual([]);
    expect(localStorage.getItem(recentCategoriesKey('u1', 'b1'))).toBe('["a","b"]');
  });

  it('caps the list at 6', () => {
    for (const code of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) pushRecentCategory('u1', 'b1', code);
    expect(readRecentCategories('u1', 'b1')).toEqual(['g', 'f', 'e', 'd', 'c', 'b']);
  });

  it('ignores a corrupt value and a storage that throws', () => {
    localStorage.setItem(recentCategoriesKey('u1', 'b1'), '{oops');
    expect(readRecentCategories('u1', 'b1')).toEqual([]);
    localStorage.setItem(recentCategoriesKey('u1', 'b1'), '[1,"a"]');
    expect(readRecentCategories('u1', 'b1')).toEqual(['a']);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(pushRecentCategory('u1', 'b1', 'z')).toEqual(['z', 'a']);
  });
});
