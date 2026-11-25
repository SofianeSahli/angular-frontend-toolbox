import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TND, renderPart, visibleText } from '../../testing/render-part';
import { rule } from '../testing';
import { RuleRow } from './rule-row';

describe('RuleRow (spec 008 REQ-6.1, 6.2, 6.8)', () => {
  it('shows the category, comment, frequency, next date and author', async () => {
    await renderPart(RuleRow, { rule: rule('r1', { interval: 2, created_by: { id: 'u9', name: 'Ancien membre' } }), currency: TND });
    expect(visibleText()).toContain('Nom food.groceries.supermarket');
    expect(visibleText()).toContain('Loyer');
    expect(visibleText()).toContain('Tous les 2 mois');
    expect(visibleText()).toContain('Prochaine');
    expect(visibleText()).toContain('par Ancien membre');
  });

  it('shows the Other name and an ended rule', async () => {
    await renderPart(RuleRow, { rule: rule('r1', { other_name: 'Garage', next_date: null }), currency: TND });
    expect(visibleText()).toContain('Garage');
    expect(visibleText()).toContain('Terminée');
  });

  it('emits edit and remove', async () => {
    const edit = vi.fn();
    const remove = vi.fn();
    const value = rule('r1');
    await renderPart(RuleRow, { rule: value, currency: TND }, { edit, remove });
    await userEvent.click(screen.getByRole('button', { name: /Modifier/ }));
    await userEvent.click(screen.getByRole('button', { name: /Supprimer/ }));
    expect(edit).toHaveBeenCalledWith(value);
    expect(remove).toHaveBeenCalledWith(value);
  });
});
