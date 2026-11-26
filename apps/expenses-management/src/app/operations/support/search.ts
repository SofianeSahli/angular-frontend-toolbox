import { CurrencyFormat, formatMinor } from '@shared/util-format';
import { normalizeForSearch } from '../../categories/data/category-labels';
import { minorToMajorText } from '../data/entry-draft';
import { Entry } from '../data/models';

const SPACES = /\s/g;

function compactAmount(text: string): string {
  return text.replace(SPACES, '').replace('.', ',');
}

export function matchesSearch(entry: Entry, query: string, categoryName: (code: string) => string, currency: CurrencyFormat): boolean {
  const needle = normalizeForSearch(query);
  if (needle === '') return true;
  const texts = [entry.comment ?? '', entry.otherName ?? '', categoryName(entry.category)];
  if (texts.some((text) => normalizeForSearch(text).includes(needle))) return true;
  const amountNeedle = compactAmount(needle);
  if (!/\d/.test(amountNeedle)) return false;
  const amounts = [minorToMajorText(entry.amount, currency.exponent), formatMinor(entry.amount, currency)];
  return amounts.some((amount) => compactAmount(amount).includes(amountNeedle));
}
