import { Summary, SummaryNode } from '../../dashboard/data/models';

export interface OffPlanCategory {
  readonly code: string;
  readonly total: number;
}

function plannedBelow(node: SummaryNode, planned: ReadonlySet<string>): number {
  return node.children.reduce((sum, child) => sum + (planned.has(child.category) ? child.total : plannedBelow(child, planned)), 0);
}

export function offPlanCategories(summary: Summary, plannedCodes: Iterable<string>): OffPlanCategory[] {
  const planned = new Set(plannedCodes);
  return summary.categories
    .filter((node) => node.type === 'expense' && !planned.has(node.category))
    .map((node, index) => ({ code: node.category, total: node.total - plannedBelow(node, planned), index }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total || a.index - b.index)
    .map(({ code, total }) => ({ code, total }));
}
