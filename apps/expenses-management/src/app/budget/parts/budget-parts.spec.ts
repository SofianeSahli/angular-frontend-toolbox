import { formatMinor } from '@shared/util-format';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TND, renderPart, visibleText } from '../../testing/render-part';
import { budget, lineDto } from '../testing';
import { BudgetTotals } from './budget-totals';
import { OffPlanList } from './off-plan-list';
import { PlanLineRow } from './plan-line-row';

describe('budget parts (spec 008 REQ-5.2, 5.4, 5.5, 9.13–9.15)', () => {
  describe('PlanLineRow', () => {
    const answer = budget().lines[2];

    it('shows the category, the planned field, the actual amount, the percent, the status and a meter', async () => {
      await renderPart(PlanLineRow, { line: { category: 'transport', text: '100,000', retired: false }, answer, currency: TND });
      expect((screen.getByLabelText('Prévu') as HTMLInputElement).value).toBe('100,000');
      expect(screen.getByRole('meter', { name: 'Nom transport' }).getAttribute('aria-valuenow')).toBe('160000');
      expect(visibleText()).toContain(formatMinor(160000, TND));
      expect(visibleText()).toContain('160 %');
      expect(visibleText()).toContain('Dépassé');
    });

    it('shows no percent for a planned 0', async () => {
      await renderPart(PlanLineRow, { line: { category: 'x', text: '0', retired: false }, answer: budget().lines[3], currency: TND });
      expect(visibleText()).not.toContain(' %');
      expect(visibleText()).toContain('Dépassé');
    });

    it('marks a retired line and still lets it be removed and edited', async () => {
      const remove = vi.fn();
      const textChange = vi.fn();
      await renderPart(
        PlanLineRow,
        { line: { category: 'old', text: '5', retired: true }, answer: budget({ lines: [lineDto('old', { retired: true })] }).lines[0], currency: TND },
        { remove, textChange },
      );
      expect(visibleText()).toContain('Retirée');
      await userEvent.type(screen.getByLabelText('Prévu'), '0');
      expect(textChange).toHaveBeenLastCalledWith('50');
      await userEvent.click(screen.getByRole('button', { name: 'Retirer Nom old' }));
      expect(remove).toHaveBeenCalled();
    });

    it('shows an error on the field', async () => {
      await renderPart(PlanLineRow, { line: { category: 'food', text: 'abc', retired: false }, currency: TND, error: 'Montant invalide' });
      const field = screen.getByLabelText('Prévu');
      expect(field.getAttribute('aria-invalid')).toBe('true');
      expect(document.getElementById(field.getAttribute('aria-describedby') ?? '')?.textContent).toContain('Montant invalide');
    });
  });

  describe('BudgetTotals', () => {
    it('shows the local planned total and the answer totals', async () => {
      await renderPart(BudgetTotals, { budget: budget(), plannedTotal: 1234000, currency: TND });
      expect(visibleText()).toContain(formatMinor(1234000, TND));
      expect(visibleText()).toContain(formatMinor(47500, TND));
      expect(visibleText()).toContain(`${formatMinor(100000, TND)} / ${formatMinor(300000, TND)}`);
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

  describe('PlanLineRow last month (REQ-9.14)', () => {
    it('shows last month as plain text, zero included', async () => {
      const view = await renderPart(PlanLineRow, { line: { category: 'food', text: '600', retired: false }, currency: TND, lastMonth: 450000 });
      expect(visibleText()).toContain(`Le mois dernier : ${formatMinor(450000, TND)}`);
      view.fixture.componentRef.setInput('lastMonth', 0);
      view.detectChanges();
      expect(visibleText()).toContain(`Le mois dernier : ${formatMinor(0, TND)}`);
    });

    it('hides it when last month is unknown', async () => {
      await renderPart(PlanLineRow, { line: { category: 'food', text: '600', retired: false }, currency: TND, lastMonth: null });
      expect(visibleText()).not.toContain('Le mois dernier');
    });
  });

  describe('BudgetTotals meters (REQ-9.15)', () => {
    it('shows a meter of received over expected and saved over planned, keeping the text', async () => {
      await renderPart(BudgetTotals, { budget: budget(), plannedTotal: 1100000, currency: TND });
      const income = screen.getByRole('meter', { name: /Revenus/ });
      expect(income.getAttribute('aria-valuenow')).toBe('2500000');
      expect(income.getAttribute('aria-valuemax')).toBe('2500000');
      expect(screen.getByRole('meter', { name: /Épargne/ }).getAttribute('aria-valuenow')).toBe('100000');
      expect(visibleText()).toContain(`${formatMinor(100000, TND)} / ${formatMinor(300000, TND)}`);
    });

    it.each([
      ['unset', null],
      ['zero', 0],
    ])('keeps the text only when the planned amount is %s', async (_name, planned) => {
      await renderPart(BudgetTotals, {
        budget: budget({ income: { expected: planned, actual: 500 }, saving: { planned, actual: 100 } }),
        plannedTotal: 0,
        currency: TND,
      });
      expect(screen.queryAllByRole('meter')).toHaveLength(0);
      expect(visibleText()).toContain(formatMinor(500, TND));
    });
  });
});
