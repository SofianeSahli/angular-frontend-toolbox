import ar from '../../../public/i18n/ar.json';
import en from '../../../public/i18n/en.json';
import fr from '../../../public/i18n/fr.json';

function leaves(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key));
}

describe('translation files (spec 007 REQ-8.1)', () => {
  it.each(['categories', 'operations', 'shell'] as const)('have the same %s keys in fr, en and ar', (subtree) => {
    const keys = leaves(fr[subtree]).sort();
    expect(leaves(en[subtree]).sort()).toEqual(keys);
    expect(leaves(ar[subtree]).sort()).toEqual(keys);
  });

  it('hold the 11 tops, 33 groups and 126 leaves from the backend', () => {
    const labels = leaves(fr.categories).filter((key) => key.endsWith('.label'));
    const depth = (n: number) => labels.filter((key) => key.split('.').length === n + 1).length;
    expect([depth(1), depth(2), depth(3)]).toEqual([11, 33, 126]);
  });
});
