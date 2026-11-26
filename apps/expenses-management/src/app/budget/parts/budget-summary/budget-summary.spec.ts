import { formatMinor } from '@shared/util-format';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TND, renderPart, visibleText } from '../../../testing/render-part';
import { budget } from '../../testing';
import { BudgetSummary } from './budget-summary';

describe('budget parts (spec 008 REQ-5.2, 5.4, 5.5, 9.13–9.15)', () => {
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
});
