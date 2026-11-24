import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { Account, AuthResult, IDENTITY_CONFIG, SessionStore } from '@shared/identity-data-access';
import { provideIcons } from '@shared/ui-atoms';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { SHELL_ICONS } from './shell-icons';
import { SHELL_TITLE_KEY, SignedInShell } from './signed-in-shell';

@Component({ template: '<p>page</p>' })
class Page {}

const TEXT = {
  shell: { navigation: 'Navigation principale', addExpense: 'Ajouter une dépense', addExpenseSoon: 'Bientôt', home: 'Accueil', account: 'Compte', signOut: 'Se déconnecter' },
  home: { title: 'Accueil' },
  account: { title: 'Mon compte' },
};

const ACCOUNT: Account = { id: 'a1', name: 'Amira', email: 'amira@exemple.com', phone: null, locale: 'fr', twoFactorEnabled: false };

const settle = () => new Promise((resolve) => setTimeout(resolve));

async function renderShell(url = '/') {
  const store = {
    account: signal<Account | null>(ACCOUNT),
    signOut: vi.fn(async (): Promise<AuthResult> => ({ outcome: 'done' })),
  };
  const view = await render('<router-outlet />', {
    imports: [RouterOutlet],
    providers: [
      provideRouter([
        { path: 'connexion', component: Page },
        {
          path: '',
          component: SignedInShell,
          children: [
            { path: '', component: Page, data: { [SHELL_TITLE_KEY]: 'home.title' } },
            { path: 'compte', component: Page, data: { [SHELL_TITLE_KEY]: 'account.title' } },
          ],
        },
      ]),
      provideTranslateService({ lang: 'fr' }),
      provideIcons(SHELL_ICONS),
      { provide: SessionStore, useValue: store },
      { provide: IDENTITY_CONFIG, useValue: { paths: { signIn: '/connexion' } } },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', TEXT);
  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  await settle();
  view.detectChanges();
  return { store, router, view };
}

describe('SignedInShell', () => {
  it('shows the brand, a disabled add button, Accueil and Compte in the rail and the tabs', async () => {
    await renderShell();
    expect(screen.getByText('Olivier')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ajouter une dépense' })).toHaveProperty('disabled', true);
    const navigations = screen.getAllByRole('navigation', { name: 'Navigation principale' });
    expect(navigations).toHaveLength(2);
    for (const navigation of navigations) {
      expect(within(navigation).getAllByRole('link').map((link) => link.textContent?.trim())).toEqual(['Accueil', 'Compte']);
    }
    expect(screen.queryByText(/Opérations|Budget|Foyer/)).toBeNull();
  });

  it('marks the current destination and shows its title in the top bar', async () => {
    await renderShell('/compte');
    for (const link of screen.getAllByRole('link', { name: 'Compte' })) expect(link.getAttribute('aria-current')).toBe('page');
    for (const link of screen.getAllByRole('link', { name: 'Accueil' })) expect(link.getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('banner').textContent).toContain('Mon compte');
  });

  it('shows the account name and signs out to the sign-in page', async () => {
    const { store, router } = await renderShell();
    expect(screen.getByText('Amira')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Se déconnecter' }));
    await settle();
    expect(store.signOut).toHaveBeenCalled();
    expect(router.url).toBe('/connexion');
  });
});
