import { render, screen } from '@testing-library/angular';
import { provideUiText } from '@shared/ui-tokens';
import { UiSpinner } from './spinner';

describe('ui-spinner', () => {
  it('is a status named by UI_TEXT by default', async () => {
    await render('<ui-spinner />', { imports: [UiSpinner] });
    expect(screen.getByRole('status', { name: 'Chargement' })).toBeTruthy();
  });

  it('uses an overridden UI_TEXT, or its own label', async () => {
    await render('<ui-spinner /><ui-spinner label="Enregistrement" [size]="24" />', {
      imports: [UiSpinner],
      providers: [provideUiText({ loading: 'Loading' })],
    });
    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();
    expect(screen.getByRole('status', { name: 'Enregistrement' }).classList).toContain('ui-spinner--24');
  });
});
