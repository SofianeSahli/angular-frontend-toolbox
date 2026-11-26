import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { entry } from '../../operations/testing';
import { TND, renderPart, visibleText } from '../testing';
import { RecentCard } from './recent-card';

describe('RecentCard (spec 008 REQ-3.6)', () => {
  const entries = [
    entry('e1', { date: '2026-11-25', created_by: { id: 'u2', name: 'Sami' }, recurring_rule_id: 'r1' }),
    entry('e2', { date: '2026-11-24' }),
  ];

  it('groups the entries by day, with the author and the recurring badge', async () => {
    await renderPart(RecentCard, { entries, currency: TND, month: '2026-11', today: '2026-11-25' });
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(["Aujourd'hui", 'Hier']);
    expect(visibleText()).toContain('par Sami');
    expect(visibleText()).toContain('récurrent');
  });

  it('gives the day heading its own class, smaller than the card title (REQ-9.10)', async () => {
    await renderPart(RecentCard, { entries, currency: TND, month: '2026-11', today: '2026-11-25' });
    for (const heading of screen.getAllByRole('heading', { level: 3 })) expect(heading.classList).toContain('dashboard-card__day');
    expect(screen.getByRole('heading', { level: 2 }).classList).toContain('dashboard-card__title');
  });

  it('opens an entry and links to every entry of the month', async () => {
    const open = vi.fn();
    await renderPart(RecentCard, { entries, currency: TND, month: '2026-11', today: '2026-11-25' }, { open });
    await userEvent.click(screen.getAllByRole('button')[1]);
    expect(open).toHaveBeenCalledWith(entries[1]);
    expect(screen.getByRole('link', { name: 'Tout voir' }).getAttribute('href')).toBe('/operations?mois=2026-11');
  });

  it('shows the empty state', async () => {
    await renderPart(RecentCard, { entries: [], currency: TND, month: '2026-11', today: '2026-11-25' });
    expect(visibleText()).toContain('Aucune opération ce mois-ci');
  });

  it("lists today's entries without day headings and offers to add one when there are none (spec 009 REQ-2.2)", async () => {
    const add = vi.fn();
    await renderPart(RecentCard, { entries: [], currency: TND, month: '2026-11', today: '2026-11-25', todayOnly: true }, { add });
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain("Aujourd'hui");
    await userEvent.click(screen.getByRole('button', { name: /Ajouter/ }));
    expect(add).toHaveBeenCalled();
  });
});
