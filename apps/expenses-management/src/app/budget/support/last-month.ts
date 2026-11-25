import { Summary, SummaryNode } from '../../dashboard/data/models';

function find(nodes: readonly SummaryNode[], code: string): SummaryNode | null {
  for (const node of nodes) {
    if (node.category === code) return node;
    const inside = find(node.children, code);
    if (inside !== null) return inside;
  }
  return null;
}

export function lastMonthActual(previous: Summary | null, code: string): number | null {
  if (previous === null) return null;
  return find(previous.categories, code)?.total ?? 0;
}
