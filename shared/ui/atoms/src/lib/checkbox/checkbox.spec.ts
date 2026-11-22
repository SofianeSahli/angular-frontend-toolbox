import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiCheckbox } from './checkbox';

describe('uiCheckbox', () => {
  it('binds to an Angular form control and toggles with Space', async () => {
    const recurring = new FormControl(false);
    await render('<input type="checkbox" uiCheckbox aria-label="Récurrent" [formControl]="recurring" />', {
      imports: [UiCheckbox, ReactiveFormsModule],
      componentProperties: { recurring },
    });
    const checkbox = screen.getByRole('checkbox', { name: 'Récurrent' });
    await userEvent.click(checkbox);
    expect(recurring.value).toBe(true);
    checkbox.focus();
    await userEvent.keyboard(' ');
    expect(recurring.value).toBe(false);
  });

  it('shows the indeterminate state, which HTML has no attribute for', async () => {
    await render('<input type="checkbox" uiCheckbox aria-label="Partiel" indeterminate />', { imports: [UiCheckbox] });
    expect(screen.getByRole('checkbox', { name: 'Partiel' })).toHaveProperty('indeterminate', true);
  });

  it('can be disabled', async () => {
    await render('<input type="checkbox" uiCheckbox aria-label="Désactivé" disabled />', { imports: [UiCheckbox] });
    expect(screen.getByRole('checkbox', { name: 'Désactivé' })).toHaveProperty('disabled', true);
  });
});
