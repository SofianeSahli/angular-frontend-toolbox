import ar from '../i18n/ar.json';
import en from '../i18n/en.json';
import fr from '../i18n/fr.json';

function keysOf(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'object' && child !== null ? keysOf(child, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

describe('identity translations', () => {
  it.each([
    ['en', en],
    ['ar', ar],
  ])('has every French key in %s', (_language, translations) => {
    expect(keysOf(translations).sort()).toEqual(keysOf(fr).sort());
  });
});
