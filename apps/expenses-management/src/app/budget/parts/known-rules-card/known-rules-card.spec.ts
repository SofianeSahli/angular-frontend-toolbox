import { formatMinor } from '@shared/util-format';
import { screen } from '@testing-library/angular';
import { TND, renderPart, visibleText } from '../../../testing/render-part';
import { rule } from '../../../recurring/testing';
import { KnownRulesCard } from './known-rules-card';

describe('budget parts (spec 008 REQ-5.2, 5.4, 5.5, 9.13–9.15)', () => {
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
});
