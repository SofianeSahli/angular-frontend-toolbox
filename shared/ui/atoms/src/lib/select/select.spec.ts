import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiSelect } from './select';

describe('uiSelect', () => {
  it('keeps its options and binds to an Angular form control', async () => {
    const category = new FormControl('food');
    await render(
      `<label for="c">Catégorie</label>
       <select uiSelect id="c" [formControl]="category">
         <option value="food">Alimentation</option>
         <option value="transport">Transport</option>
       </select>`,
      { imports: [UiSelect, ReactiveFormsModule], componentProperties: { category } },
    );
    const select = screen.getByRole('combobox', { name: 'Catégorie' });
    expect(screen.getAllByRole('option')).toHaveLength(2);
    await userEvent.selectOptions(select, 'Transport');
    expect(category.value).toBe('transport');
  });

  it('can be disabled', async () => {
    await render('<select uiSelect aria-label="Membre" disabled><option>Sofiane</option></select>', { imports: [UiSelect] });
    expect(screen.getByRole('combobox', { name: 'Membre' })).toHaveProperty('disabled', true);
  });
});
