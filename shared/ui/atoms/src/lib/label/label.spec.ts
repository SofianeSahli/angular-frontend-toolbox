import { render, screen } from '@testing-library/angular';
import { provideUiText } from '@shared/ui-tokens';
import { UiLabel } from './label';

describe('uiLabel', () => {
  it('names its control', async () => {
    await render('<label uiLabel for="m">Montant</label><input id="m" />', { imports: [UiLabel] });
    expect(screen.getByRole('textbox', { name: 'Montant' })).toBeTruthy();
  });

  it('appends the optional text from UI_TEXT, part of the name', async () => {
    await render('<label uiLabel for="n" optional>Note</label><input id="n" />', {
      imports: [UiLabel],
      providers: [provideUiText({ optional: '(optional)' })],
    });
    expect(screen.getByRole('textbox', { name: 'Note (optional)' })).toBeTruthy();
  });

  it('shows a required asterisk hidden from assistive technology', async () => {
    await render('<label uiLabel for="e" required>E-mail</label><input id="e" required />', { imports: [UiLabel] });
    expect(screen.getByRole('textbox', { name: 'E-mail' })).toBeTruthy();
    expect(screen.getByText('*').getAttribute('aria-hidden')).toBe('true');
  });
});
