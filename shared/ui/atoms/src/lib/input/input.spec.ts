import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiInput } from './input';

describe('uiInput', () => {
  it('binds an Angular form control to the native input, named by its label', async () => {
    const description = new FormControl('');
    await render('<label for="d">Description</label><input uiInput id="d" [formControl]="description" />', {
      imports: [UiInput, ReactiveFormsModule],
      componentProperties: { description },
    });
    await userEvent.type(screen.getByRole('textbox', { name: 'Description' }), 'Carrefour');
    expect(description.value).toBe('Carrefour');
  });

  it('works on a textarea', async () => {
    await render('<label for="n">Note</label><textarea uiInput id="n"></textarea>', { imports: [UiInput] });
    expect(screen.getByRole('textbox', { name: 'Note' }).tagName).toBe('TEXTAREA');
  });

  it('follows the form control when disabled', async () => {
    const currency = new FormControl({ value: 'TND', disabled: true });
    await render('<input uiInput aria-label="Devise" [formControl]="currency" />', {
      imports: [UiInput, ReactiveFormsModule],
      componentProperties: { currency },
    });
    expect(screen.getByRole('textbox', { name: 'Devise' })).toHaveProperty('disabled', true);
  });

  it('keeps aria-invalid from the page, which drives the invalid style', async () => {
    await render('<input uiInput aria-label="Montant" aria-invalid="true" />', { imports: [UiInput] });
    expect(screen.getByRole('textbox', { name: 'Montant' }).getAttribute('aria-invalid')).toBe('true');
  });
});
