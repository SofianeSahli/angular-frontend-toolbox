import { entry } from '../testing';
import { dayGroups, longDate, uiLocale } from './day-groups';

const LABELS = { today: "Aujourd'hui", yesterday: 'Hier', locale: 'fr-TN' };

describe('day groups (REQ-5.2)', () => {
  it('groups consecutive entries by day, keeping the API order', () => {
    const groups = dayGroups(
      [
        entry('a', { date: '2026-11-25' }),
        entry('b', { date: '2026-11-25' }),
        entry('c', { date: '2026-11-24' }),
        entry('d', { date: '2026-11-02' }),
      ],
      '2026-11-25',
      LABELS,
    );
    expect(groups.map((g) => [g.key, g.label, g.items.map((e) => e.id)])).toEqual([
      ['2026-11-25', "Aujourd'hui", ['a', 'b']],
      ['2026-11-24', 'Hier', ['c']],
      ['2026-11-02', longDate('2026-11-02', 'fr-TN'), ['d']],
    ]);
  });

  it('writes other days in full in the UI language, whatever the device timezone', () => {
    expect(longDate('2026-11-02', 'fr-TN').toLowerCase()).toContain('lundi 2 novembre 2026');
    expect(longDate('2026-11-02', 'en-GB')).toContain('Monday');
  });

  it('decides "today" from the given book day, not the device clock', () => {
    expect(dayGroups([entry('a', { date: '2026-01-01' })], '2026-01-02', LABELS)[0].label).toBe('Hier');
  });

  it('maps UI languages to locales', () => {
    expect([uiLocale('fr'), uiLocale('en'), uiLocale('ar'), uiLocale(undefined)]).toEqual(['fr-TN', 'en-GB', 'ar-TN', 'fr-TN']);
  });
});
