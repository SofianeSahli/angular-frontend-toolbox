import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiRadio } from './radio';

describe('uiRadio', () => {
  it('picks exactly one option of a group bound to an Angular form control', async () => {
    const type = new FormControl('expense');
    await render(
      `<div role="radiogroup" aria-label="Type">
         <input type="radio" uiRadio aria-label="Dépense" value="expense" [formControl]="type" />
         <input type="radio" uiRadio aria-label="Revenu" value="income" [formControl]="type" />
         <input type="radio" uiRadio aria-label="Transfert" value="transfer" disabled />
       </div>`,
      { imports: [UiRadio, ReactiveFormsModule], componentProperties: { type } },
    );
    expect(screen.getByRole('radio', { name: 'Dépense' })).toHaveProperty('checked', true);
    await userEvent.click(screen.getByRole('radio', { name: 'Revenu' }));
    expect(type.value).toBe('income');
    expect(screen.getByRole('radio', { name: 'Dépense' })).toHaveProperty('checked', false);
    expect(screen.getByRole('radio', { name: 'Transfert' })).toHaveProperty('disabled', true);
  });

  it('moves the choice with the arrow keys', async () => {
    const type = new FormControl('expense');
    await render(
      `<input type="radio" uiRadio name="t" aria-label="Dépense" value="expense" [formControl]="type" />
       <input type="radio" uiRadio name="t" aria-label="Revenu" value="income" [formControl]="type" />`,
      { imports: [UiRadio, ReactiveFormsModule], componentProperties: { type } },
    );
    screen.getByRole('radio', { name: 'Dépense' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(type.value).toBe('income');
  });
});
