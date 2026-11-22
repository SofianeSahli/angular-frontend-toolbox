import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UiCheckbox } from '../checkbox/checkbox';
import { UiCheckRow } from './check-row';

describe('uiCheckRow', () => {
  it('names the control it wraps and makes the whole row toggle it', async () => {
    await render('<label uiCheckRow><input type="checkbox" uiCheckbox />Récurrent</label>', { imports: [UiCheckRow, UiCheckbox] });
    const checkbox = screen.getByRole('checkbox', { name: 'Récurrent' });
    await userEvent.click(screen.getByText('Récurrent'));
    expect(checkbox).toHaveProperty('checked', true);
  });
});
