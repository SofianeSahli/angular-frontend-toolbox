import { safeReturnUrl } from './return-url';

describe('safeReturnUrl', () => {
  it.each(['/', '/compte', '/compte?tab=2#top'])('keeps the internal path %s', (value) => {
    expect(safeReturnUrl(value)).toBe(value);
  });

  it.each(['', '//evil.example', '/\\evil.example', 'https://evil.example', 'javascript:alert(1)', 'compte', null, undefined, 42])(
    'refuses %s',
    (value) => {
      expect(safeReturnUrl(value)).toBeNull();
    },
  );
});
