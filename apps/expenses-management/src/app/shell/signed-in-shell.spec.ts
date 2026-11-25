import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { Account, AuthResult, IDENTITY_CONFIG, SessionStore } from '@shared/identity-data-access';
import { provideIcons } from '@shared/ui-atoms';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BooksStore } from '../households/data/books.store';
import { book, fakeStores } from '../households/testing';
import { SHELL_ICONS } from './shell-icons';
import { SHELL_BOOK_BOUND, SHELL_TITLE_KEY, SignedInShell } from './signed-in-shell';

@Component({ template: '<p>page</p>' })
class Page {}

const TEXT = {
  shell: { navigation: 'Navigation principale', addExpense: 'Ajouter une dépense', addExpenseSoon: 'Bientôt', home: 'Accueil', household: 'Foyer', account: 'Compte', signOut: 'Se déconnecter',
    books: { switcher: 'Changer de carnet', new: 'Nouveau carnet', limit: 'Limite atteinte' } },
  home: { title: 'Accueil' },
  households: { household: { title: 'Foyer' } },
  account: { title: 'Mon compte' },
};

const ACCOUNT: Account = { id: 'a1', name: 'Amira', email: 'amira@exemple.com', phone: null, locale: 'fr', twoFactorEnabled: false };

const settle = () => new Promise((resolve) => setTimeout(resolve));

async function renderShell(url = '/', books = [book('a')]) {
  const stores = fakeStores();
  stores.books.books.set(books);
  stores.books.selectedBookId.set(books[0]?.id ?? null);
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
            { path: '', component: Page, data: { [SHELL_TITLE_KEY]: 'home.title', [SHELL_BOOK_BOUND]: true } },
            { path: 'foyer', component: Page, data: { [SHELL_TITLE_KEY]: 'households.household.title' } },
            { path: 'compte', component: Page, data: { [SHELL_TITLE_KEY]: 'account.title' } },
          ],
        },
      ]),
      provideTranslateService({ lang: 'fr' }),
      provideIcons(SHELL_ICONS),
      { provide: SessionStore, useValue: store },
      { provide: BooksStore, useValue: stores.books },
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
    const navigations = screen.getAllByRole('navigation', { name: 'Navigation principale', hidden: true });
    expect(navigations).toHaveLength(2);
    for (const navigation of navigations) {
      expect(within(navigation).getAllByRole('link', { hidden: true }).map((link) => link.textContent?.trim())).toEqual(['Accueil', 'Foyer', 'Compte']);
    }
    expect(screen.queryByText(/Opérations|Budget/)).toBeNull();
  });

  it('marks the current destination and shows its title in the top bar', async () => {
    await renderShell('/compte');
    for (const link of screen.getAllByRole('link', { name: 'Compte', hidden: true })) expect(link.getAttribute('aria-current')).toBe('page');
    for (const link of screen.getAllByRole('link', { name: 'Accueil', hidden: true })) expect(link.getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('banner', { hidden: true }).textContent).toContain('Mon compte');
  });

  it('shows the book switcher instead of the title on a book-bound route', async () => {
    await renderShell('/');
    const banner = screen.getByRole('banner', { hidden: true });
    expect(within(banner).getByRole('button', { name: /Changer de carnet/, hidden: true }).textContent).toContain('Carnet a');
    expect(banner.textContent).not.toContain('Accueil');
    expect(screen.getAllByRole('button', { name: /Changer de carnet/, hidden: true })).toHaveLength(2);
  });

  it('shows the title and no switcher on a route that is not book-bound', async () => {
    await renderShell('/foyer');
    expect(screen.getByRole('banner', { hidden: true }).textContent).toContain('Foyer');
    expect(screen.queryByRole('button', { name: /Changer de carnet/, hidden: true })).toBeNull();
  });

  it('shows the title when there is no book', async () => {
    await renderShell('/', []);
    expect(screen.getByRole('banner', { hidden: true }).textContent).toContain('Accueil');
    expect(screen.queryByRole('button', { name: /Changer de carnet/, hidden: true })).toBeNull();
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
