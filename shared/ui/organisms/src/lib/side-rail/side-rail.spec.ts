import { render, screen, within } from '@testing-library/angular';
import { UiRailItem, UiRailSection, UiSideRail } from './side-rail';

describe('ui-side-rail', () => {
  it('is a navigation landmark with brand, action, items, sections and footer', async () => {
    await render(
      `<ui-side-rail ariaLabel="Navigation principale">
         <span uiRailBrand>Olivier</span>
         <button uiRailAction>Ajouter une dépense</button>
         <a uiRailItem href="#home" aria-current="page">Accueil</a>
         <a uiRailItem href="#operations">Opérations</a>
         <ui-rail-section label="Carnets"><a uiRailItem href="#foyer">Foyer</a></ui-rail-section>
         <span uiRailFooter>Sofiane</span>
       </ui-side-rail>`,
      { imports: [UiSideRail, UiRailItem, UiRailSection] },
    );
    const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
    expect(within(nav).getAllByRole('link')).toHaveLength(3);
    expect(within(nav).getByRole('group', { name: 'Carnets' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Accueil' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: 'Ajouter une dépense' })).toBeTruthy();
    expect(screen.getByText('Sofiane')).toBeTruthy();
  });
});
