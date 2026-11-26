import { TND } from '@shared/util-format';
import { entry } from '../testing';
import { dayGroups, dayTotal, longDate, uiLocale } from './day-groups';

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

  it('totals each day as income then outflow (spec 009 REQ-7.3)', () => {
    const income = entry('i', { type: 'income', amount: 2800000 });
    const expense = entry('e', { amount: 85000 });
    const saving = entry('s', { type: 'saving', amount: 15000 });
    const clean = (text: string) => text.replace(/\s/g, ' ');
    expect(clean(dayTotal([income, expense, saving], TND))).toBe(clean(`+2 800,000 DT · 100,000 DT`));
    expect(clean(dayTotal([expense], TND))).toBe(clean('85,000 DT'));
  });

  it('leaves the total of the last day out until all its rows are loaded (spec 009 REQ-7.3)', () => {
    const rows = [entry('a', { date: '2026-11-25' }), entry('b', { date: '2026-11-24' })];
    const partial = dayGroups(rows, '2026-11-25', LABELS, { currency: TND, lastDayComplete: false });
    expect(partial.map((group) => group.total !== undefined)).toEqual([true, false]);
    const complete = dayGroups(rows, '2026-11-25', LABELS, { currency: TND, lastDayComplete: true });
    expect(complete.map((group) => group.total !== undefined)).toEqual([true, true]);
  });
});
