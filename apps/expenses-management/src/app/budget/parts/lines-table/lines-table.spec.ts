import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../../../../public/i18n/fr.json';
import { TND, renderPart, visibleText } from '../../../testing/render-part';
import { withoutUnit } from '../../support/amounts';
import { budget } from '../../testing';
import { LinesTable } from './lines-table';

const inputs = {
  lines: [{ category: 'food', text: '600', retired: false }],
  answers: new Map(budget().lines.map((line) => [line.category, line])),
  savingText: '300',
  savingActual: 100000,
  offPlan: 12500,
  offPlanCount: 1,
  totals: { planned: 900000, actual: 652500, left: 247500 },
  currency: TND,
  copyLabel: "Copier le budget d'octobre",
};

describe('LinesTable', () => {
  it('shows the headers, the saving, off-plan and total rows and the note', async () => {
    await renderPart(LinesTable, inputs);
    expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent?.trim())).toEqual(['Catégorie', 'Prévu', 'Réel', 'Écart']);
    expect(screen.getByText(fr.budget.table.savingTag)).toBeTruthy();
    expect(screen.getByRole('rowheader', { name: 'Hors budget · 1 opération' })).toBeTruthy();
    expect(visibleText()).toContain(withoutUnit(247500, TND));
    expect(visibleText()).toContain('Montants en DT.');
  });

  it('opens a line or the saving from its row', async () => {
    const editLine = vi.fn();
    const editSaving = vi.fn();
    await renderPart(LinesTable, inputs, { editLine, editSaving });
    await userEvent.click(screen.getByRole('button', { name: /^Nom food,/ }));
    await userEvent.click(screen.getByRole('button', { name: /^Épargne prévue,/ }));
    expect(editLine).toHaveBeenCalledWith('food');
    expect(editSaving).toHaveBeenCalled();
  });

  it('focuses the first row from "Modifier le budget"', async () => {
    await renderPart(LinesTable, inputs);
    await userEvent.click(screen.getByRole('button', { name: fr.budget.table.edit }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Nom food,/ }));
  });

  it('adds a line from the header button only, and highlights the added row', async () => {
    const addLine = vi.fn();
    await renderPart(LinesTable, { ...inputs, added: 'food' }, { addLine });
    expect(screen.getAllByRole('button', { name: fr.budget.lines.add })).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: fr.budget.lines.add }));
    expect(addLine).toHaveBeenCalled();
    expect(document.querySelector('tr.lines__row--new')?.textContent).toContain('Nom food');
  });

  it('copies the previous month from the "more actions" menu', async () => {
    const copyPrevious = vi.fn();
    await renderPart(LinesTable, inputs, { copyPrevious });
    expect(screen.queryByRole('menuitem')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: fr.ui.moreActions }));
    await userEvent.click(screen.getByRole('menuitem', { name: "Copier le budget d'octobre" }));
    expect(copyPrevious).toHaveBeenCalled();
  });
});
