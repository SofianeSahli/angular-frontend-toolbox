import { screen } from '@testing-library/angular';
import { toBudget } from '../../budget/data/mappers';
import { NO_PLAN_DTO, budget, budgetDto } from '../../budget/testing';
import { TND, renderPart, summary, visibleText } from '../testing';
import { PaceCard } from './pace-card';

const day = (date: string, expense: number) => ({ date, income: 0, expense, saving: 0, balance: -expense, entries: 1 });
const november = summary({ days: [day('2026-11-02', 100000), day('2026-11-10', 250000)] });
const october = summary({ days: [day('2026-10-05', 80000), day('2026-10-20', 120000)] });
const noPlan = toBudget(NO_PLAN_DTO);

function inputs(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { summary: november, previous: october, budget: budget(), month: '2026-11', today: '2026-11-12', currency: TND, ...overrides };
}

function chart(): Element | null {
  return document.querySelector('ui-pace-chart');
}

function part(name: string): Element | null {
  return document.querySelector(`.ui-pace-chart__${name}`);
}

describe('PaceCard (spec 008 REQ-9.7)', () => {
  it('draws the cumulative line up to today with the planned total as target', async () => {
    await renderPart(PaceCard, inputs({ budget: toBudget(budgetDto({ expenses: { planned: 1100000, actual: 350000, off_plan: 0, remaining: 750000 } })) }));
    expect(screen.getByRole('img', { name: /dépensés sur .* prévus, après 12 jours/ })).toBeTruthy();
    expect(part('line')?.getAttribute('d')?.split('L')).toHaveLength(13);
    expect(part('today')).not.toBeNull();
    expect(part('target')).not.toBeNull();
    expect(part('reference')).toBeNull();
    expect(visibleText()).toContain('Prévu');
    expect(visibleText()).toContain('Aujourd');
    expect(visibleText()).not.toContain('Le mois dernier');
  });

  it('shows last month as the reference when there is no plan', async () => {
    await renderPart(PaceCard, inputs({ budget: noPlan }));
    expect(part('target')).toBeNull();
    expect(part('reference')).not.toBeNull();
    expect(screen.getByRole('img', { name: /contre .* le mois dernier/ })).toBeTruthy();
    expect(visibleText()).toContain('Le mois dernier');
  });

  it('shows no reference and no error when the previous month failed', async () => {
    await renderPart(PaceCard, inputs({ budget: noPlan, previous: null }));
    expect(part('reference')).toBeNull();
    expect(part('line')).not.toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows neither target nor reference while the budget is unknown', async () => {
    await renderPart(PaceCard, inputs({ budget: null }));
    expect(part('target')).toBeNull();
    expect(part('reference')).toBeNull();
  });

  it('shows the whole line of a past month without a today marker', async () => {
    await renderPart(PaceCard, inputs({ summary: october, previous: null, month: '2026-10', budget: noPlan }));
    expect(part('today')).toBeNull();
    expect(part('line')?.getAttribute('d')?.split('L')).toHaveLength(32);
  });

  it('shows the empty state for a future month and for a month without expense', async () => {
    const view = await renderPart(PaceCard, inputs({ month: '2026-12' }));
    expect(chart()).toBeNull();
    expect(visibleText()).toContain('Pas encore de dépenses');
    view.fixture.componentRef.setInput('month', '2026-11');
    view.fixture.componentRef.setInput('summary', summary());
    view.detectChanges();
    expect(chart()).toBeNull();
  });

  it('says that fixed bills are included', async () => {
    await renderPart(PaceCard, inputs());
    expect(visibleText()).toContain('Dépenses fixes incluses');
  });

  it('shows loading and error states with a retry', async () => {
    const retry = vi.fn();
    const view = await renderPart(PaceCard, inputs({ summary: null, status: 'loading' }), { retry });
    expect(screen.getByRole('status')).toBeTruthy();
    view.fixture.componentRef.setInput('status', 'error');
    view.detectChanges();
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeTruthy();
  });
});
