export const MAX_RECENT_CATEGORIES = 6;

export function recentCategoriesKey(accountId: string, bookId: string): string {
  return `expenses.recentCategories.${accountId}.${bookId}`;
}

export function readRecentCategories(accountId: string, bookId: string): readonly string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(recentCategoriesKey(accountId, bookId)) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((code): code is string => typeof code === 'string').slice(0, MAX_RECENT_CATEGORIES) : [];
  } catch {
    return [];
  }
}

export function pushRecentCategory(accountId: string, bookId: string, code: string): readonly string[] {
  const next = [code, ...readRecentCategories(accountId, bookId).filter((known) => known !== code)].slice(0, MAX_RECENT_CATEGORIES);
  try {
    localStorage.setItem(recentCategoriesKey(accountId, bookId), JSON.stringify(next));
  } catch {
    // Recents are a convenience: a full or denied storage just keeps the old list.
  }
  return next;
}
