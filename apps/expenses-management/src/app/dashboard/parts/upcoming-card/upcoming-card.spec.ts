import { screen } from '@testing-library/angular';
import { rule } from '../../../recurring/testing';
import { TND, renderPart, visibleText } from '../../testing';
import { UpcomingCard, upcomingRules } from './upcoming-card';

describe('UpcomingCard (spec 008 REQ-3.5)', () => {
  const rules = [
    rule('later', { next_date: '2026-11-30' }),
    rule('today', { next_date: '2026-11-25' }),
    rule('soon', { next_date: '2026-11-27', other_name: 'Garage' }),
    rule('december', { next_date: '2026-12-01' }),
    rule('ended', { next_date: null }),
  ];

  it('keeps rules due after today and by the end of the month, soonest first', () => {
    expect(upcomingRules(rules, '2026-11-25', '2026-11').map((r) => r.id)).toEqual(['soon', 'later']);
  });

  it('keeps at most five rows', () => {
    const many = [26, 27, 28, 29, 30, 30].map((day, index) => rule(`r${index}`, { next_date: `2026-11-${day}` }));
    expect(upcomingRules(many, '2026-11-25', '2026-11')).toHaveLength(5);
  });

  it('is empty for a past month and links to the rules', async () => {
    await renderPart(UpcomingCard, { rules, today: '2026-11-25', month: '2026-10', currency: TND });
    expect(visibleText()).toContain("Rien de prévu d'ici la fin du mois");
    expect(screen.getByRole('link', { name: 'Voir les récurrentes' }).getAttribute('href')).toBe('/recurrentes');
  });

  it('shows the other name or the category name', async () => {
    await renderPart(UpcomingCard, { rules, today: '2026-11-25', month: '2026-11', currency: TND });
    expect(screen.getAllByRole('listitem').map((row) => row.textContent)).toEqual([expect.stringContaining('Garage'), expect.stringContaining('Nom food')]);
  });
});
