import { formatMinor } from '@shared/util-format';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TND, renderPart, visibleText } from '../../../testing/render-part';
import { budget } from '../../testing';
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
});
