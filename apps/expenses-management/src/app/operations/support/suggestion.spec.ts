import { entry } from '../testing';
import { minuteOfDay, suggestCategory, templatesFrom } from './suggestion';

const TUNIS = 'Africa/Tunis';
const any = () => true;

function at(id: string, category: string, createdAt: string, amount = 12500, otherName: string | null = null) {
  return entry(id, { category, created_at: createdAt, amount, other_name: otherName });
}

describe('suggestion (spec 009 REQ-3.3, 3.5)', () => {
  it('reads the time of day in the book timezone', () => {
    expect(minuteOfDay(new Date('2026-11-25T07:30:00Z'), TUNIS)).toBe(8 * 60 + 30);
  });

  it('suggests the most frequent leaf within two hours of now, wrapping at midnight', () => {
    const entries = [
      at('1', 'food.bakery', '2026-11-20T22:50:00Z'),
      at('2', 'food.bakery', '2026-11-19T23:30:00Z'),
      at('3', 'transport.taxi', '2026-11-18T12:00:00Z'),
      at('4', 'transport.taxi', '2026-11-17T12:00:00Z'),
      at('5', 'transport.taxi', '2026-11-16T12:00:00Z'),
    ];
    expect(suggestCategory(entries, new Date('2026-11-25T23:10:00Z'), TUNIS, any)).toBe('food.bakery');
  });

  it('falls back to the most frequent leaf overall, then to none', () => {
    const entries = [at('1', 'food.bakery', '2026-11-20T08:00:00Z'), at('2', 'transport.taxi', '2026-11-19T09:00:00Z'), at('3', 'transport.taxi', '2026-11-18T09:00:00Z')];
    expect(suggestCategory(entries, new Date('2026-11-25T17:00:00Z'), TUNIS, any)).toBe('transport.taxi');
    expect(suggestCategory([], new Date(), TUNIS, any)).toBeNull();
  });

  it('breaks ties with the most recent entry and never suggests a retired leaf', () => {
    const entries = [at('1', 'food.bakery', '2026-11-18T09:00:00Z'), at('2', 'transport.taxi', '2026-11-19T09:00:00Z')];
    expect(suggestCategory(entries, new Date('2026-11-25T09:00:00Z'), TUNIS, any)).toBe('transport.taxi');
    expect(suggestCategory(entries, new Date('2026-11-25T09:00:00Z'), TUNIS, (code) => code !== 'transport.taxi')).toBe('food.bakery');
  });

  it('offers the three most recent distinct entries as templates', () => {
    const entries = [
      at('1', 'food.bakery', '2026-11-20T08:00:00Z', 1500),
      at('2', 'food.bakery', '2026-11-21T08:00:00Z', 1500),
      at('3', 'transport.taxi', '2026-11-19T08:00:00Z', 12000),
      at('4', 'food.cafe', '2026-11-18T08:00:00Z', 3500, 'Café Saf Saf'),
      at('5', 'health.pharmacy', '2026-11-17T08:00:00Z', 9000),
    ];
    expect(templatesFrom(entries, any)).toEqual([
      { category: 'food.bakery', otherName: null, amount: 1500 },
      { category: 'transport.taxi', otherName: null, amount: 12000 },
      { category: 'food.cafe', otherName: 'Café Saf Saf', amount: 3500 },
    ]);
  });
});
