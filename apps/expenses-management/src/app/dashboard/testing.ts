import { CategoryType } from '../categories/data/models';
import { toSummary } from './data/mappers';
import { MemberTotalsDto, Summary, SummaryDto, SummaryNodeDto } from './data/models';

export function nodeDto(category: string, total: number, type: CategoryType = 'expense', children: readonly SummaryNodeDto[] = []): SummaryNodeDto {
  return { category, type, total, entries: 1, children };
}

export function memberDto(id: string, name: string, expense: number): MemberTotalsDto {
  return { account: { id, name }, income: 0, expense, saving: 0, balance: -expense, entries: 1 };
}

export function summaryDto(overrides: Partial<SummaryDto> = {}): SummaryDto {
  return {
    from: '2026-11-01',
    to: '2026-11-30',
    currency: 'TND',
    totals: { income: 2500000, expense: 1000000, saving: 0, balance: 1500000, entries: 6 },
    categories: [
      nodeDto('salary', 2500000, 'income'),
      nodeDto('food', 600000, 'expense', [nodeDto('food.groceries', 600000)]),
      nodeDto('transport', 400000),
    ],
    members: [memberDto('u1', 'Moi', 700000), memberDto('u2', 'Sami', 300000)],
    ...overrides,
  };
}

export function summary(overrides: Partial<SummaryDto> = {}): Summary {
  return toSummary(summaryDto(overrides));
}

export { FAKE_LABELS, TND, renderPart, visibleText } from '../testing/render-part';
