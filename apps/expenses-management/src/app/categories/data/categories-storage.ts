import { CategoryTree, Top } from './models';

export const CATEGORIES_STORAGE_KEY = 'expenses.categories';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTop(value: unknown): value is Top {
  return (
    isRecord(value) &&
    typeof value['code'] === 'string' &&
    typeof value['key'] === 'string' &&
    typeof value['type'] === 'string' &&
    Array.isArray(value['groups']) &&
    value['groups'].every((group) => isRecord(group) && typeof group['code'] === 'string' && Array.isArray(group['leaves']))
  );
}

function isTree(value: unknown): value is CategoryTree {
  return (
    isRecord(value) && (value['etag'] === null || typeof value['etag'] === 'string') && Array.isArray(value['tops']) && value['tops'].every(isTop)
  );
}

export function readStoredTree(): CategoryTree | null {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isTree(parsed)) return { tops: parsed.tops, etag: parsed.etag };
  } catch {
    // An unreadable copy is dropped below, like a malformed one.
  }
  clearStoredTree();
  return null;
}

export function writeStoredTree(tree: CategoryTree): void {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(tree));
  } catch {
    // Storage full or denied: the tree is fetched again next session.
  }
}

export function clearStoredTree(): void {
  try {
    localStorage.removeItem(CATEGORIES_STORAGE_KEY);
  } catch {
    // Nothing to clean when storage is denied.
  }
}
