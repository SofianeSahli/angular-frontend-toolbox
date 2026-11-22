import { render, screen } from '@testing-library/angular';
import { UiBadge } from './badge';

describe('ui-badge', () => {
  it('is neutral by default and shows its text', async () => {
    await render('<ui-badge>Récurrent</ui-badge>', { imports: [UiBadge] });
    expect(screen.getByText('Récurrent').classList).toContain('ui-badge--neutral');
  });

  it.each(['accent', 'success', 'warning', 'danger'])('takes the %s tone', async (tone) => {
    await render(`<ui-badge tone="${tone}">Statut</ui-badge>`, { imports: [UiBadge] });
    expect(screen.getByText('Statut').classList).toContain(`ui-badge--${tone}`);
  });
});
