import { RecurringRule, RecurringRuleDto, RuleInput, RulePatch } from './models';

export function toRule(dto: RecurringRuleDto): RecurringRule {
  return {
    id: dto.id,
    amount: dto.amount,
    currency: dto.currency,
    type: dto.type,
    category: dto.category,
    otherName: dto.other_name,
    comment: dto.comment,
    frequency: dto.frequency,
    interval: dto.interval,
    startsOn: dto.starts_on,
    endsOn: dto.ends_on,
    nextDate: dto.next_date,
    createdBy: { id: dto.created_by.id, name: dto.created_by.name },
    updatedBy: { id: dto.updated_by.id, name: dto.updated_by.name },
  };
}

type Body = Record<string, string | number | null>;

export function toRuleBody(input: RuleInput): Body {
  const body: Body = {
    amount: input.amount,
    category: input.category,
    frequency: input.frequency,
    interval: input.interval,
    starts_on: input.startsOn,
    ends_on: input.endsOn,
  };
  if (input.otherName !== null) body['other_name'] = input.otherName;
  if (input.comment !== null) body['comment'] = input.comment;
  return body;
}

const API_NAMES: Readonly<Record<keyof RuleInput, string>> = {
  amount: 'amount',
  category: 'category',
  otherName: 'other_name',
  comment: 'comment',
  frequency: 'frequency',
  interval: 'interval',
  startsOn: 'starts_on',
  endsOn: 'ends_on',
};

export function toRulePatchBody(patch: RulePatch): Body {
  const body: Body = {};
  for (const key of Object.keys(API_NAMES) as (keyof RuleInput)[]) {
    const value = patch[key];
    if (value !== undefined) body[API_NAMES[key]] = value;
  }
  return body;
}
