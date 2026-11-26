import { formatMinor } from '@shared/util-format';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TND, renderPart, visibleText } from '../../testing/render-part';
import { budget } from '../testing';
import { BudgetSummary } from './budget-summary';
import { KnownRulesCard } from './known-rules-card';
import { rule } from '../../recurring/testing';
import { OffPlanList } from './off-plan-list';
import { PlanLineRow } from './plan-line-row';

describe('budget parts (spec 008 REQ-5.2, 5.4, 5.5, 9.13–9.15)', () => {
  describe('PlanLineRow (spec 009 REQ-9.3, 9.4)', () => {
    const answer = budget().lines[2];

    it('shows the category, spent over planned and a meter, and opens on tap', async () => {
      const open = vi.fn();
      await renderPart(PlanLineRow, { line: { category: 'transport', text: '100,000', retired: false }, answer, currency: TND }, { open });
      expect(screen.getByRole('meter', { name: 'Nom transport' }).getAttribute('aria-valuenow')).toBe('160000');
      expect(visibleText()).toContain(`${formatMinor(160000, TND)} / ${formatMinor(100000, TND)}`);
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toMatch(/^Nom transport, prévu .*, dépensé .*, Dépassé$/);
      await userEvent.click(button);
      expect(open).toHaveBeenCalled();
    });

    it('shows last month as plain text, zero included, and nothing when unknown (spec 008 REQ-9.14)', async () => {
      const view = await renderPart(PlanLineRow, { line: { category: 'food', text: '600', retired: false }, currency: TND, lastMonth: 0 });
      expect(visibleText()).toContain(`Le mois dernier : ${formatMinor(0, TND)}`);
      view.fixture.componentRef.setInput('lastMonth', null);
      view.detectChanges();
      expect(visibleText()).not.toContain('Le mois dernier');
    });

    it('marks a retired line and shows a line error', async () => {
      await renderPart(PlanLineRow, { line: { category: 'old', text: 'abc', retired: true }, currency: TND, error: 'Montant invalide' });
      expect(visibleText()).toContain('Retirée');
      expect(visibleText()).toContain('Montant invalide');
    });
  });

  describe('BudgetSummary (spec 009 REQ-9.3)', () => {
    it('shows planned, spent and left with a meter and the copy action', async () => {
      const copy = vi.fn();
      await renderPart(BudgetSummary, { budget: budget(), plannedTotal: 1500000, currency: TND, copyLabel: "Copier le budget d'octobre" }, { copyPrevious: copy });
      expect(visibleText()).toContain(formatMinor(1500000, TND));
      expect(visibleText()).toContain(formatMinor(1212500, TND));
      expect(visibleText()).toContain(formatMinor(287500, TND));
      expect(screen.getByRole('meter')).toBeTruthy();
      await userEvent.click(screen.getByRole('button', { name: "Copier le budget d'octobre" }));
      expect(copy).toHaveBeenCalled();
    });
  });

  describe('KnownRulesCard (spec 009 REQ-9.7)', () => {
    it('lists the live rules due in the month with their dates and totals the expenses', async () => {
      const rules = [
        rule('rent', { comment: 'Loyer', amount: 650000, starts_on: '2026-10-01' }),
        rule('salary', { comment: 'Salaire', amount: 2800000, type: 'income', starts_on: '2026-10-28' }),
        rule('ended', { comment: 'Ancien', next_date: null }),
      ];
      await renderPart(KnownRulesCard, { rules, month: '2027-01', monthName: 'janvier', currency: TND });
      const rows = screen.getAllByRole('listitem').map((row) => row.textContent ?? '');
      expect(rows).toHaveLength(2);
      expect(rows[0]).toContain('Loyer');
      expect(visibleText()).toContain(formatMinor(650000, TND));
    });
  });

  describe('OffPlanList (REQ-9.13)', () => {
    const rows = [
      { code: 'health', total: 9000, canAdd: true },
      { code: 'food', total: 3500, canAdd: false },
    ];

    it('shows the off-plan total alone when the detail is unknown', async () => {
      await renderPart(OffPlanList, { budget: budget(), currency: TND });
      expect(visibleText()).toContain('Hors budget');
      expect(visibleText()).toContain(formatMinor(12500, TND));
      expect(screen.queryByRole('button')).toBeNull();
    });

    it.each([null, 0])('is hidden at %s', async (offPlan) => {
      await renderPart(OffPlanList, { budget: budget({ expenses: { planned: 1, actual: 0, off_plan: offPlan, remaining: 1 } }), rows, currency: TND });
      expect(visibleText()).not.toContain('Hors budget');
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('expands to the unplanned categories in the given order and collapses again', async () => {
      await renderPart(OffPlanList, { budget: budget(), rows, currency: TND });
      const toggle = screen.getByRole('button', { name: 'Voir le détail' });
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(screen.queryByRole('list')).toBeNull();
      await userEvent.click(toggle);
      expect(screen.getByRole('button', { name: 'Masquer le détail' }).getAttribute('aria-expanded')).toBe('true');
      expect(screen.getAllByRole('listitem').map((row) => row.textContent)).toEqual([
        expect.stringContaining('Nom health'),
        expect.stringContaining('Nom food'),
      ]);
      expect(visibleText()).toContain(formatMinor(9000, TND));
      await userEvent.click(screen.getByRole('button', { name: 'Masquer le détail' }));
      expect(screen.queryByRole('list')).toBeNull();
    });

    it('offers to add a category to the budget, except an overlapping one', async () => {
      const add = vi.fn();
      await renderPart(OffPlanList, { budget: budget(), rows, currency: TND }, { add });
      await userEvent.click(screen.getByRole('button', { name: 'Voir le détail' }));
      expect(screen.getAllByRole('button', { name: /Ajouter .* au budget/ })).toHaveLength(1);
      await userEvent.click(screen.getByRole('button', { name: 'Ajouter Nom health au budget' }));
      expect(add).toHaveBeenCalledWith(expect.objectContaining({ code: 'health', total: 9000 }));
    });
  });
});
