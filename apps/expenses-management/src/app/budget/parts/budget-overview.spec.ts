import { formatMinor } from '@shared/util-format';
import { screen } from '@testing-library/angular';
import { TND, renderPart, visibleText } from '../../testing/render-part';
import { toBudget } from '../data/mappers';
import { NO_PLAN_DTO, budget, budgetDto, lineDto } from '../testing';
import { BudgetOverview } from './budget-overview';

describe('BudgetOverview (spec 008 REQ-9.12)', () => {
  it('shows one big meter of spent over planned in the budget states', async () => {
    await renderPart(BudgetOverview, { budget: budget(), currency: TND });
    const total = screen.getByRole('meter', { name: 'Dépensé / prévu' });
    expect(total.getAttribute('aria-valuenow')).toBe('1212500');
    expect(total.getAttribute('aria-valuemax')).toBe('1100000');
    expect(total.classList).toContain('ui-meter--over');
    expect(visibleText()).toContain(`${formatMinor(1212500, TND)} / ${formatMinor(1100000, TND)}`);
    expect(visibleText()).toContain('110 %');
  });

  it('is warning from 85 % and ok below', async () => {
    const view = await renderPart(BudgetOverview, {
      budget: toBudget(budgetDto({ expenses: { planned: 1000000, actual: 850000, off_plan: 0, remaining: 150000 } })),
      currency: TND,
    });
    expect(screen.getByRole('meter', { name: 'Dépensé / prévu' }).classList).toContain('ui-meter--warning');
    view.fixture.componentRef.setInput('budget', toBudget(budgetDto({ expenses: { planned: 1000000, actual: 100000, off_plan: 0, remaining: 900000 } })));
    view.detectChanges();
    const classes = screen.getByRole('meter', { name: 'Dépensé / prévu' }).classList;
    expect(classes).not.toContain('ui-meter--warning');
    expect(classes).not.toContain('ui-meter--over');
  });

  it('lists the lines by percent used, highest first, each with a meter, X / Y and its percent', async () => {
    await renderPart(BudgetOverview, { budget: budget(), currency: TND });
    const meters = screen.getAllByRole('meter');
    expect(meters.map((meter) => meter.getAttribute('aria-label'))).toEqual([
      'Dépensé / prévu',
      'Nom entertainment.outings',
      'Nom transport',
      'Nom home.housing',
      'Nom food',
    ]);
    expect(visibleText()).toContain(`${formatMinor(160000, TND)} / ${formatMinor(100000, TND)}`);
    expect(visibleText()).toContain('160 %');
    expect(visibleText()).toContain('90 %');
  });

  it('is read-only: no field and no button', async () => {
    await renderPart(BudgetOverview, { budget: budget(), currency: TND });
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('is hidden when the plan has no lines', async () => {
    await renderPart(BudgetOverview, { budget: toBudget(NO_PLAN_DTO), currency: TND });
    expect(screen.queryByRole('heading', { name: "Vue d'ensemble" })).toBeNull();
    expect(screen.queryByRole('meter')).toBeNull();
  });

  it('shows the block as soon as the plan has one line', async () => {
    await renderPart(BudgetOverview, { budget: toBudget(budgetDto({ lines: [lineDto('food')] })), currency: TND });
    expect(screen.getByRole('heading', { name: "Vue d'ensemble" })).toBeTruthy();
  });
});
