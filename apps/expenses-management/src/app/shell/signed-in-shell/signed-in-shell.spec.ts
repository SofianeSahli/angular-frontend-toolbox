import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { Account, AuthResult, IDENTITY_CONFIG, SessionStore } from '@shared/identity-data-access';
import { provideIcons } from '@shared/ui-atoms';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BooksStore } from '../../households/data/books.store';
import { book, fakeStores } from '../../households/testing';
import { EntrySheetService } from '../../operations/entry-sheet.service';
import { NavDrawerService } from '../nav-drawer.service';
import { SHELL_ICONS } from '../shell-icons';
import { SHELL_BOOK_BOUND, SHELL_TITLE_KEY, SignedInShell } from './signed-in-shell';

@Component({ template: '<p>page</p>' })
class Page {}

const TEXT = {
  shell: { navigation: 'Navigation principale', addExpense: 'Ajouter une dépense', home: 'Accueil', operations: 'Opérations', budget: 'Budget', household: 'Foyer', account: 'Compte', signOut: 'Se déconnecter',
    menu: 'Menu', recurring: 'Récurrentes', analysis: 'Analyse du mois',
    drawer: { budgets: 'Budgets', planning: 'Prévoir', householdAndAccount: 'Foyer et compte' },
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
  const sheets = { openNew: vi.fn() };
  const menu = { open: vi.fn() };
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
      { provide: EntrySheetService, useValue: sheets },
      { provide: NavDrawerService, useValue: menu },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', TEXT);
  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  await settle();
  view.detectChanges();
  return { store, router, view, sheets, menu };
}

describe('SignedInShell (spec 009 REQ-1.1, 1.6, 1.8)', () => {
  it('lists the drawer destinations in the rail and four tabs on the phone', async () => {
    await renderShell();
    expect(screen.getByText('Olivier')).toBeTruthy();
    const navigations = screen.getAllByRole('navigation', { name: 'Navigation principale', hidden: true });
    expect(navigations).toHaveLength(2);
    const names = navigations.map((navigation) => within(navigation).getAllByRole('link', { hidden: true }).map((link) => link.textContent?.trim()));
    expect(names).toContainEqual(['Accueil', 'Opérations', 'Budgets', 'Récurrentes', 'Analyse du mois', 'Foyer', 'Compte']);
    expect(names).toContainEqual(['Accueil', 'Opérations', 'Budget', 'Récurrentes']);
  });

  it('opens the add sheet from the rail and the raised tab action', async () => {
    const { sheets, view } = await renderShell();
    const adds = screen.getAllByRole('button', { name: 'Ajouter une dépense', hidden: true });
    expect(adds).toHaveLength(2);
    for (const add of adds) await userEvent.click(add);
    expect(sheets.openNew).toHaveBeenCalledTimes(2);
    const tabs = view.container.querySelector('ui-bottom-tabs') as HTMLElement;
    expect(within(tabs).getByRole('button', { name: 'Ajouter une dépense', hidden: true }).hasAttribute('uiTabAction')).toBe(true);
  });

  it('keeps the add action on a page reached from the drawer', async () => {
    await renderShell('/foyer');
    for (const add of screen.getAllByRole('button', { name: 'Ajouter une dépense', hidden: true })) expect(add).toHaveProperty('disabled', false);
  });

  it('disables the rail add button and hides the tab action without a selected book', async () => {
    await renderShell('/', []);
    const adds = screen.getAllByRole('button', { name: 'Ajouter une dépense', hidden: true });
    expect(adds).toHaveLength(1);
    expect(adds[0]).toHaveProperty('disabled', true);
  });

  it('opens the drawer from the menu button, and on its books from the book name', async () => {
    const { menu } = await renderShell('/');
    const banner = screen.getByRole('banner', { hidden: true });
    await userEvent.click(within(banner).getByRole('button', { name: 'Menu', hidden: true }));
    expect(menu.open).toHaveBeenLastCalledWith(null);
    const bookButton = within(banner).getByRole('button', { name: /Changer de carnet/, hidden: true });
    expect(bookButton.textContent).toContain('Carnet a');
    await userEvent.click(bookButton);
    expect(menu.open).toHaveBeenLastCalledWith('books');
  });

  it('links the avatar to the account page', async () => {
    await renderShell('/');
    const banner = screen.getByRole('banner', { hidden: true });
    expect(within(banner).getByRole('link', { name: 'Compte', hidden: true }).getAttribute('href')).toBe('/compte');
  });

  it('marks no tab on a page reached only from the drawer, and shows its title', async () => {
    const { view } = await renderShell('/compte');
    const tabs = view.container.querySelector('ui-bottom-tabs') as HTMLElement;
    for (const link of within(tabs).getAllByRole('link', { hidden: true })) expect(link.getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('banner', { hidden: true }).textContent).toContain('Mon compte');
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
