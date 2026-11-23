import { render, screen, within } from '@testing-library/angular';
import { UiBottomTabs, UiTab, UiTabAction } from './bottom-tabs';

describe('ui-bottom-tabs', () => {
  it('is a navigation landmark with labelled tabs and a central action', async () => {
    await render(
      `<ui-bottom-tabs ariaLabel="Navigation principale">
         <a uiTab href="#home" aria-current="page">Accueil</a>
         <a uiTab href="#operations">Opérations</a>
         <a uiTab href="#budgets">Budgets</a>
         <a uiTab href="#profile">Profil</a>
         <button uiTabAction aria-label="Ajouter une dépense">+</button>
       </ui-bottom-tabs>`,
      { imports: [UiBottomTabs, UiTab, UiTabAction] },
    );
    const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
    expect(within(nav).getAllByRole('link').map((tab) => tab.textContent?.trim())).toEqual(['Accueil', 'Opérations', 'Budgets', 'Profil']);
    expect(screen.getByRole('link', { name: 'Accueil' }).getAttribute('aria-current')).toBe('page');
    expect(within(nav).getByRole('button', { name: 'Ajouter une dépense' }).getAttribute('type')).toBe('button');
  });
});
