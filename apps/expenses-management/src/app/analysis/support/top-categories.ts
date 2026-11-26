import { Summary } from '../../dashboard/data/models';

export const TOP_CATEGORY_ROWS = 6;

export interface CategoryShare {
  readonly code: string;
  readonly total: number;
  readonly share: number;
}

export interface TopCategories {
  readonly rows: readonly CategoryShare[];
  readonly others: { readonly total: number; readonly share: number } | null;
}

export function topCategories(summary: Summary, maxRows = TOP_CATEGORY_ROWS): TopCategories {
  const expense = summary.totals.expense;
  const shareOf = (total: number) => (expense > 0 ? total / expense : 0);
  const sorted = summary.categories
    .filter((node) => node.type === 'expense' && node.total > 0)
    .map((node, index) => ({ node, index }))
    .sort((a, b) => b.node.total - a.node.total || a.index - b.index)
    .map(({ node }) => ({ code: node.category, total: node.total, share: shareOf(node.total) }));
  if (sorted.length <= maxRows) return { rows: sorted, others: null };
  const rows = sorted.slice(0, maxRows - 1);
  const total = sorted.slice(maxRows - 1).reduce((sum, row) => sum + row.total, 0);
  return { rows, others: { total, share: shareOf(total) } };
}
