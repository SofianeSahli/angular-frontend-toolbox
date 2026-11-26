import { screen } from '@testing-library/angular';
import { budget, lineDto } from '../../../budget/testing';
import { TND, renderPart, visibleText } from '../../testing';
import { formatWhole } from '../../support/whole-units';
import { HeroCard } from './hero-card';

const text = () => visibleText();

describe('HeroCard (spec 008 REQ-2.1–2.5)', () => {
  it('shows the remainder and the spent amount in whole units, with the per-day amount', async () => {
    await renderPart(HeroCard, { budget: budget(), currency: TND, month: '2026-11' });
    expect(screen.getByRole('heading', { name: 'Reste à dépenser' })).toBeTruthy();
    expect(text()).toContain(formatWhole(47500, TND));
    expect(text()).toContain(formatWhole(1212500, TND));
    expect(text()).toContain(`${formatWhole(7000, TND)} par jour`);
  });

  it('shows "less than 1 per day" when the per-day amount floors to 0', async () => {
    await renderPart(HeroCard, { budget: budget({ expenses: { planned: 1, actual: 0, off_plan: 0, remaining: 5000 } }), currency: TND, month: '2026-11' });
    expect(text()).toContain(`moins de ${formatWhole(1000, TND)} par jour`);
  });

  it('shows no per-day amount for a past or future month', async () => {
    await renderPart(HeroCard, { budget: budget({ days_left: null }), currency: TND, month: '2026-10' });
    expect(text()).not.toContain('par jour');
  });

  it('shows "Budget épuisé" with the over style instead of a zero balance', async () => {
    await renderPart(HeroCard, {
      budget: budget({ expenses: { planned: 100, actual: 200, off_plan: 0, remaining: 0 }, lines: [lineDto('food', { status: 'over' })] }),
      currency: TND,
      month: '2026-11',
    });
    expect(screen.getByText('Budget épuisé').classList).toContain('dashboard-card__over');
    expect(text()).not.toContain('par jour');
  });

  it('links to the budget of the month', async () => {
    await renderPart(HeroCard, { budget: budget(), currency: TND, month: '2026-11' });
    expect(screen.getByRole('link', { name: 'Gérer le budget' }).getAttribute('href')).toBe('/budget?mois=2026-11');
  });

  it('wraps amounts in bdi', async () => {
    await renderPart(HeroCard, { budget: budget(), currency: TND, month: '2026-11' });
    expect(document.querySelector('.dashboard-card__amount bdi')?.textContent).toBe(formatWhole(47500, TND));
  });
});
