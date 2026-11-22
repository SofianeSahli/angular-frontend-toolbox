import { render, screen } from '@testing-library/angular';
import { UiFieldMessage } from './field-message';

describe('ui-field-message', () => {
  it('is a hint by default, with no icon, and describes its control', async () => {
    const { container } = await render(
      '<input aria-label="Description" aria-describedby="h" /><ui-field-message id="h">Visible par tous les membres du foyer.</ui-field-message>',
      { imports: [UiFieldMessage] },
    );
    expect(screen.getByRole('textbox', { description: 'Visible par tous les membres du foyer.' })).toBeTruthy();
    expect(container.querySelector('ui-icon')).toBeNull();
  });

  it('shows an icon for an error, so colour is not the only signal', async () => {
    const { container } = await render('<ui-field-message tone="error">Saisissez un montant supérieur à 0.</ui-field-message>', {
      imports: [UiFieldMessage],
    });
    const message = container.querySelector('ui-field-message');
    expect(message?.classList).toContain('ui-field-message--error');
    expect(message?.querySelector('ui-icon svg')).toBeTruthy();
  });
});
