import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiSwitch } from './switch';

describe('uiSwitch', () => {
  it('is a switch bound to an Angular form control, toggled with Space', async () => {
    const reminder = new FormControl(false);
    await render('<input type="checkbox" uiSwitch aria-label="Rappel du soir" [formControl]="reminder" />', {
      imports: [UiSwitch, ReactiveFormsModule],
      componentProperties: { reminder },
    });
    const control = screen.getByRole('switch', { name: 'Rappel du soir' });
    control.focus();
    await userEvent.keyboard(' ');
    expect(reminder.value).toBe(true);
    expect(control).toHaveProperty('checked', true);
  });

  it('can be disabled', async () => {
    await render('<input type="checkbox" uiSwitch aria-label="Désactivé" disabled />', { imports: [UiSwitch] });
    expect(screen.getByRole('switch', { name: 'Désactivé' })).toHaveProperty('disabled', true);
  });
});
