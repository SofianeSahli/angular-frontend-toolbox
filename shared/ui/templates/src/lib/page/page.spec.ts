import { render, screen } from '@testing-library/angular';
import { UiPage, UiPageAside } from './page';

describe('ui-page', () => {
  it('has an h1 title, an eyebrow, actions and content, without an aside', async () => {
    const { container } = await render(
      '<ui-page title="Novembre 2026" eyebrow="Carnet du foyer"><button uiPageActions>Exporter</button><p>Contenu</p></ui-page>',
      { imports: [UiPage] },
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Novembre 2026' })).toBeTruthy();
    expect(screen.getByText('Carnet du foyer')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Exporter' })).toBeTruthy();
    expect(container.querySelector('ui-page')?.classList).not.toContain('ui-page--with-aside');
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('switches to two columns when an aside is projected', async () => {
    const { container } = await render('<ui-page title="Accueil"><p>Contenu</p><div uiPageAside>À surveiller</div></ui-page>', {
      imports: [UiPage, UiPageAside],
    });
    expect(container.querySelector('ui-page')?.classList).toContain('ui-page--with-aside');
    expect(screen.getByRole('complementary').textContent).toContain('À surveiller');
  });
});
