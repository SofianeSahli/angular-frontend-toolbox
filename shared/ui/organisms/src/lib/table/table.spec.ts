import { render, screen } from '@testing-library/angular';
import { UiTable, UiTableGroup, UiTableNumber } from './table';

describe('table[uiTable]', () => {
  it('keeps native table semantics and marks group rows and number cells', async () => {
    await render(
      `<table uiTable>
         <thead><tr><th>Libellé</th><th class="ui-table__secondary">Catégorie</th><th uiNum>Montant</th></tr></thead>
         <tbody>
           <tr uiTableGroup><td colspan="3">Dimanche 22 novembre</td></tr>
           <tr><td>Carrefour Market</td><td class="ui-table__secondary">Alimentation</td><td uiNum>48,350 DT</td></tr>
         </tbody>
       </table>`,
      { imports: [UiTable, UiTableGroup, UiTableNumber] },
    );
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Montant' }).classList).toContain('ui-table__num');
    expect(screen.getByRole('cell', { name: '48,350 DT' }).classList).toContain('ui-table__num');
    expect(screen.getByRole('row', { name: 'Dimanche 22 novembre' }).classList).toContain('ui-table__group');
  });
});
