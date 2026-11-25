function keyOf(accountId: string): string {
  return `expenses.book.${accountId}`;
}

export function readSelectedBook(accountId: string): string | null {
  try {
    return localStorage.getItem(keyOf(accountId));
  } catch {
    return null;
  }
}

export function writeSelectedBook(accountId: string, bookId: string): void {
  try {
    localStorage.setItem(keyOf(accountId), bookId);
  } catch {
    return;
  }
}

export function clearSelectedBook(accountId: string): void {
  try {
    localStorage.removeItem(keyOf(accountId));
  } catch {
    return;
  }
}
