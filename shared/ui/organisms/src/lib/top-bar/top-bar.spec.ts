import { render, screen } from '@testing-library/angular';
import { UiTopBar, UiTopBarTitle } from './top-bar';

describe('ui-top-bar', () => {
  it('is a banner with the page title as its heading and leading and trailing actions', async () => {
    await render(
      '<ui-top-bar title="Dépenses"><button uiTopBarLeading aria-label="Retour">←</button><button uiTopBarTrailing aria-label="Rechercher">o</button></ui-top-bar>',
      { imports: [UiTopBar] },
    );
    const bar = screen.getByRole('banner');
    expect(screen.getByRole('heading', { level: 1, name: 'Dépenses' })).toBeTruthy();
    expect(bar.querySelector('.ui-top-bar__leading button')?.getAttribute('aria-label')).toBe('Retour');
    expect(bar.querySelector('.ui-top-bar__trailing button')?.getAttribute('aria-label')).toBe('Rechercher');
  });

  it('accepts a projected title instead, aligned to the start', async () => {
    await render('<ui-top-bar align="start"><button uiTopBarTitle>Carnet du foyer ▾</button></ui-top-bar>', { imports: [UiTopBar, UiTopBarTitle] });
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByRole('button', { name: 'Carnet du foyer ▾' })).toBeTruthy();
    expect(screen.getByRole('banner').classList).toContain('ui-top-bar--start');
  });
});
