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
  });
});
