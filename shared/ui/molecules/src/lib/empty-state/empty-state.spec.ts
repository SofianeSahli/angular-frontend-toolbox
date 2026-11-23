import { render, screen } from '@testing-library/angular';
import { UiEmptyState } from './empty-state';

describe('ui-empty-state', () => {
  it('shows a decorative icon tile, a title, a text and one action', async () => {
    const { container } = await render(
      '<ui-empty-state icon="inbox" title="Aucune dépense ce mois-ci" text="Vos dépenses apparaîtront ici."><button>Ajouter une dépense</button></ui-empty-state>',
      { imports: [UiEmptyState] },
    );
    expect(screen.getByRole('heading', { name: 'Aucune dépense ce mois-ci' })).toBeTruthy();
    expect(screen.getByText('Vos dépenses apparaîtront ici.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ajouter une dépense' })).toBeTruthy();
    expect(container.querySelector('ui-icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('leaves out the text when there is none', async () => {
    const { container } = await render('<ui-empty-state icon="inbox" title="Rien ici" />', { imports: [UiEmptyState] });
    expect(container.querySelector('p')).toBeNull();
  });
});
