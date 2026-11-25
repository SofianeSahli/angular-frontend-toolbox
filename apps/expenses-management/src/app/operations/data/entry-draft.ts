import { parseMajor } from '@shared/util-format';
import { Entry, EntryInput, EntryPatch } from './models';

export interface EntryForm {
  readonly amount: string;
  readonly category: string | null;
  readonly otherName: string;
  readonly date: string;
  readonly comment: string;
}

export interface DraftContext {
  readonly exponent: number;
  readonly isOther: boolean;
}

export function minorToMajorText(minor: number, exponent: number): string {
  if (exponent === 0) return String(minor);
  const digits = String(minor).padStart(exponent + 1, '0');
  return `${digits.slice(0, -exponent)},${digits.slice(-exponent)}`;
}

export function formFromEntry(entry: Entry, exponent: number): EntryForm {
  return {
    amount: minorToMajorText(entry.amount, exponent),
    category: entry.category,
    otherName: entry.otherName ?? '',
    date: entry.date,
    comment: entry.comment ?? '',
  };
}

const trimmedOrNull = (text: string): string | null => text.trim() || null;

export function toInput(id: string, form: EntryForm, context: DraftContext): EntryInput | null {
  const amount = parseMajor(form.amount, context.exponent);
  if (!amount.ok || form.category === null) return null;
  return {
    id,
    amount: amount.minor,
    date: form.date,
    category: form.category,
    otherName: context.isOther ? trimmedOrNull(form.otherName) : null,
    comment: trimmedOrNull(form.comment),
  };
}

export function diff(entry: Entry, form: EntryForm, context: DraftContext): EntryPatch | null {
  const amount = parseMajor(form.amount, context.exponent);
  if (!amount.ok || form.category === null) return null;
  const patch: { -readonly [K in keyof EntryPatch]: EntryPatch[K] } = {};
  if (amount.minor !== entry.amount) patch.amount = amount.minor;
  if (form.date !== entry.date) patch.date = form.date;
  const otherName = form.otherName.trim();
  if (form.category !== entry.category) {
    patch.category = form.category;
    if (context.isOther) patch.otherName = otherName;
  } else if (context.isOther && otherName !== (entry.otherName ?? '')) {
    patch.otherName = otherName;
  }
  const comment = trimmedOrNull(form.comment);
  if (comment !== entry.comment) patch.comment = comment;
  return patch;
}

export function isEmptyPatch(patch: EntryPatch): boolean {
  return Object.keys(patch).length === 0;
}
