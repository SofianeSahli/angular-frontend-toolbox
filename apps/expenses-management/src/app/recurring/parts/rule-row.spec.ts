import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TND, renderPart, visibleText } from '../../testing/render-part';
import { rule } from '../testing';
import { RuleRow } from './rule-row';

describe('RuleRow (spec 009 REQ-10.2)', () => {
  it('shows the name from the comment, the frequency and the next date', async () => {
    await renderPart(RuleRow, { rule: rule('r1', { interval: 2 }), currency: TND });
    expect(visibleText()).toContain('Loyer');
    expect(visibleText()).toContain('Tous les 2 mois');
    expect(visibleText()).toContain('Prochaine');
  });

  it('falls back to the Other name, then the category, and shows an ended rule', async () => {
    await renderPart(RuleRow, { rule: rule('r1', { comment: null, other_name: 'Garage', next_date: null }), currency: TND });
    expect(visibleText()).toContain('Garage');
    expect(visibleText()).toContain('Terminée');
  });

  it('opens the rule on tap', async () => {
    const edit = vi.fn();
    const value = rule('r1');
    await renderPart(RuleRow, { rule: value, currency: TND }, { edit });
    await userEvent.click(screen.getByRole('button', { name: /Loyer/ }));
    expect(edit).toHaveBeenCalledWith(value);
  });
});
