import { toRule } from './data/mappers';
import { RecurringRule, RecurringRuleDto } from './data/models';

export function ruleDto(id: string, overrides: Partial<RecurringRuleDto> = {}): RecurringRuleDto {
  return {
    id,
    amount: 850000,
    currency: 'TND',
    type: 'expense',
    category: 'food.groceries.supermarket',
    other_name: null,
    comment: 'Loyer',
    frequency: 'monthly',
    interval: 1,
    starts_on: '2026-01-31',
    ends_on: null,
    next_date: '2026-11-30',
    created_by: { id: 'u1', name: 'Moi' },
    updated_by: { id: 'u1', name: 'Moi' },
    ...overrides,
  };
}

export function rule(id: string, overrides: Partial<RecurringRuleDto> = {}): RecurringRule {
  return toRule(ruleDto(id, overrides));
}
