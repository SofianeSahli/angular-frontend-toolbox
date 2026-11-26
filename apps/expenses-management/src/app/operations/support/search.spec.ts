import { TND } from '@shared/util-format';
import { entry } from '../testing';
import { matchesSearch } from './search';

const names: Record<string, string> = { 'food.groceries.supermarket': 'Supermarché', 'transport.taxi': 'Taxi' };
const name = (code: string) => names[code] ?? code;

describe('matchesSearch (spec 009 REQ-7.2)', () => {
  const row = entry('e1', { comment: 'Retour du marché', other_name: 'Épicerie Ben Ali', amount: 48350 });

  it('matches the comment, the other name and the category label without accents or case', () => {
    expect(matchesSearch(row, 'MARCHE', name, TND)).toBe(true);
    expect(matchesSearch(row, 'epicerie', name, TND)).toBe(true);
    expect(matchesSearch(row, 'supermarche', name, TND)).toBe(true);
    expect(matchesSearch(row, 'taxi', name, TND)).toBe(false);
  });

  it('matches the amount text with a comma or a dot', () => {
    expect(matchesSearch(row, '48,35', name, TND)).toBe(true);
    expect(matchesSearch(row, '48.350', name, TND)).toBe(true);
    expect(matchesSearch(row, '12', name, TND)).toBe(false);
  });

  it('lets everything through for a blank query', () => {
    expect(matchesSearch(row, '  ', name, TND)).toBe(true);
  });
});
