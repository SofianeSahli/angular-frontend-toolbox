import { formatMinor } from '@shared/util-format';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TND, renderPart, visibleText } from '../../../testing/render-part';
import { budget } from '../../testing';
import { OffPlanList } from './off-plan-list';

describe('budget parts (spec 008 REQ-5.2, 5.4, 5.5, 9.13–9.15)', () => {
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
