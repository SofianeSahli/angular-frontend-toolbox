import { parseMajor } from '@shared/util-format';
import { minorToMajorText } from '../../operations/data/entry-draft';
import { Frequency, RecurringRule, RuleInput, RulePatch } from './models';

export interface RuleForm {
  readonly amount: string;
  readonly category: string | null;
  readonly otherName: string;
  readonly comment: string;
  readonly frequency: Frequency;
  readonly interval: number;
  readonly startsOn: string;
  readonly endsOn: string;
}

export interface RuleDraftContext {
  readonly exponent: number;
  readonly isOther: boolean;
}

export function emptyRuleForm(today: string): RuleForm {
  return { amount: '', category: null, otherName: '', comment: '', frequency: 'monthly', interval: 1, startsOn: today, endsOn: '' };
}

export function formFromRule(rule: RecurringRule, exponent: number): RuleForm {
  return {
    amount: minorToMajorText(rule.amount, exponent),
    category: rule.category,
    otherName: rule.otherName ?? '',
    comment: rule.comment ?? '',
    frequency: rule.frequency,
    interval: rule.interval,
    startsOn: rule.startsOn,
    endsOn: rule.endsOn ?? '',
  };
}

const trimmedOrNull = (text: string): string | null => text.trim() || null;

export function toRuleInput(form: RuleForm, context: RuleDraftContext): RuleInput | null {
  const amount = parseMajor(form.amount, context.exponent);
  if (!amount.ok || form.category === null) return null;
  return {
    amount: amount.minor,
    category: form.category,
    otherName: context.isOther ? trimmedOrNull(form.otherName) : null,
    comment: trimmedOrNull(form.comment),
    frequency: form.frequency,
    interval: form.interval,
    startsOn: form.startsOn,
    endsOn: form.endsOn || null,
  };
}

export function diffRule(rule: RecurringRule, form: RuleForm, context: RuleDraftContext): RulePatch | null {
  const input = toRuleInput(form, context);
  if (input === null) return null;
  const patch: RulePatch = {};
  if (input.amount !== rule.amount) patch.amount = input.amount;
  if (input.category !== rule.category) {
    patch.category = input.category;
    if (context.isOther) patch.otherName = input.otherName;
  } else if (context.isOther && input.otherName !== rule.otherName) {
    patch.otherName = input.otherName;
  }
  if (input.comment !== rule.comment) patch.comment = input.comment;
  if (input.frequency !== rule.frequency) patch.frequency = input.frequency;
  if (input.interval !== rule.interval) patch.interval = input.interval;
  if (input.startsOn !== rule.startsOn) patch.startsOn = input.startsOn;
  if (input.endsOn !== rule.endsOn) patch.endsOn = input.endsOn;
  return patch;
}

export function isEmptyRulePatch(patch: RulePatch): boolean {
  return Object.keys(patch).length === 0;
}
