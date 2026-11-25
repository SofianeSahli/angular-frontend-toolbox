import { signal } from '@angular/core';
import { UiBottomTabs, UiTabAction } from '@shared/ui-organisms';
import { render, screen } from '@testing-library/angular';
import { UiAppShell } from './app-shell';

describe('ui-app-shell', () => {
  it('places the rail, top bar, tabs and the routed page in a main landmark, and adds the toast region', async () => {
    const { container } = await render(
      `<ui-app-shell>
         <nav uiShellRail aria-label="Rail">rail</nav>
         <header uiShellTop>top</header>
         <nav uiShellTabs aria-label="Onglets">tabs</nav>
         <h1>Accueil</h1>
       </ui-app-shell>`,
      { imports: [UiAppShell] },
    );
    expect(screen.getByRole('main').textContent).toContain('Accueil');
    expect(container.querySelector('.ui-app-shell__rail [uiShellRail]')).toBeTruthy();
    expect(container.querySelector('.ui-app-shell__top [uiShellTop]')).toBeTruthy();
    expect(container.querySelector('.ui-app-shell__tabs [uiShellTabs]')).toBeTruthy();
    expect(container.querySelectorAll('ui-toast-region')).toHaveLength(1);
    expect(container.querySelector('ui-app-shell')?.classList).not.toContain('ui-app-shell--tab-action');
  });

  it('marks itself when the tabs hold an action, so the page keeps clear of it', async () => {
    const withAction = signal(true);
    const { container, detectChanges } = await render(
      `<ui-app-shell>
         <ui-bottom-tabs uiShellTabs ariaLabel="Onglets">
           @if (withAction()) {
             <button uiTabAction aria-label="Ajouter une dépense">+</button>
           }
         </ui-bottom-tabs>
       </ui-app-shell>`,
      { imports: [UiAppShell, UiBottomTabs, UiTabAction], componentProperties: { withAction } },
    );
    const shell = () => container.querySelector('ui-app-shell');
    expect(shell()?.classList).toContain('ui-app-shell--tab-action');
    withAction.set(false);
    detectChanges();
    expect(shell()?.classList).not.toContain('ui-app-shell--tab-action');
  });
});
