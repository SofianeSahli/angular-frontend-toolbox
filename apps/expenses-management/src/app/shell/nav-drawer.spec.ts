import { DIALOG_DATA } from '@angular/cdk/dialog';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { Account, IDENTITY_CONFIG, SessionStore } from '@shared/identity-data-access';
import { provideIcons } from '@shared/ui-atoms';
import { UI_DRAWER_CONTEXT } from '@shared/ui-organisms';
import { UiThemeService } from '@shared/ui-tokens';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of, throwError } from 'rxjs';
import fr from '../../../public/i18n/fr.json';
import { BudgetApi } from '../budget/data/budget-api';
import { budget } from '../budget/testing';
import { BooksStore } from '../households/data/books.store';
import { HouseholdStore } from '../households/data/household.store';
import { HouseholdsApi } from '../households/data/households-api';
import { book, fakeStores } from '../households/testing';
import { LanguageService } from '../i18n/language.service';
import { RecurringApi } from '../recurring/data/recurring-api';
import { rule } from '../recurring/testing';
import { NavDrawer, currentDestination } from './nav-drawer';
import { SHELL_ICONS } from './shell-icons';

@Component({ template: '' })
class Page {}

const ACCOUNT: Account = { id: 'u1', name: 'Sofiane', email: 'sofiane@exemple.tn', phone: null, locale: 'fr', twoFactorEnabled: false };
const settle = () => new Promise((resolve) => setTimeout(resolve));

async function renderDrawer(options: { failHints?: boolean; url?: string } = {}) {
  const stores = fakeStores();
  stores.books.books.set([book('p1'), { ...book('h1', 'household'), name: 'Dépenses du foyer' }]);
  stores.books.selectedBookId.set('h1');
  stores.household.household.set({ id: 'f1', name: 'Foyer', role: 'owner' });
  const close = vi.fn();
  const language = signal<'fr' | 'en' | 'ar'>('fr');
  const languages = { language, use: vi.fn((value: 'fr' | 'en' | 'ar') => language.set(value)) };
  const session = { account: signal<Account | null>(ACCOUNT), signOut: vi.fn().mockResolvedValue({ outcome: 'done' }) };
  const fail = () => throwError(() => new Error('offline'));
  const view = await render(NavDrawer, {
    providers: [
      provideRouter([{ path: '**', component: Page }]),
      provideTranslateService({ lang: 'fr' }),
      provideIcons(SHELL_ICONS),
      { provide: UI_DRAWER_CONTEXT, useValue: { title: 'Menu', close } },
      { provide: DIALOG_DATA, useValue: { focus: null } },
      { provide: SessionStore, useValue: session },
      { provide: BooksStore, useValue: stores.books },
      { provide: HouseholdStore, useValue: stores.household },
      { provide: IDENTITY_CONFIG, useValue: { paths: { signIn: '/connexion' } } },
      { provide: LanguageService, useValue: languages },
      { provide: BudgetApi, useValue: { get: vi.fn(() => (options.failHints ? fail() : of(budget()))) } },
      { provide: RecurringApi, useValue: { list: vi.fn(() => (options.failHints ? fail() : of([rule('r1'), rule('r2'), rule('r3', { next_date: null })]))) } },
      { provide: HouseholdsApi, useValue: { members: vi.fn(() => (options.failHints ? fail() : of([{ id: 'u1' }, { id: 'u2' }]))) } },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  await TestBed.inject(Router).navigateByUrl(options.url ?? '/budget?mois=2026-11');
  await settle();
  view.detectChanges();
  return { view, close, stores, languages, session };
}

describe('NavDrawer (spec 009 REQ-1.2–1.5)', () => {
  it('shows the account, the books, the destinations in order, theme, language and sign out', async () => {
    await renderDrawer();
    expect(screen.getByText('Sofiane')).toBeTruthy();
    const links = screen.getAllByRole('link').map((link) => link.textContent?.replace(/\s+/g, ' ').trim().split(' ')[0]);
    expect(links).toEqual(['Nouveau', 'Accueil', 'Opérations', 'Budgets', 'Récurrentes', 'Analyse', 'Foyer', 'Compte']);
    const books = screen.getAllByRole('button').filter((button) => button.hasAttribute('data-book'));
    expect(books.map((button) => button.textContent)).toEqual([expect.stringContaining('Dépenses du foyer'), expect.stringContaining('Carnet p1')]);
    expect(books[0].getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('radiogroup', { name: 'Apparence' })).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: 'Langue' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Se déconnecter/ })).toBeTruthy();
  });

  it('marks the current destination', async () => {
    await renderDrawer();
    expect(screen.getByRole('link', { name: /Budgets/ }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: /Accueil/ }).getAttribute('aria-current')).toBeNull();
  });

  it('shows the hints once loaded, and hides them when they fail', async () => {
    const { view } = await renderDrawer();
    const text = view.container.textContent ?? '';
    expect(text).toContain('2 règles');
    expect(text).toContain('2 membres');
    expect(screen.getByRole('link', { name: /Budgets/ }).textContent).toMatch(/restants/);
  });

  it('keeps every destination when the hints fail', async () => {
    await renderDrawer({ failHints: true });
    expect(screen.getByRole('link', { name: /Budgets/ }).textContent).not.toMatch(/restants/);
    expect(screen.getByRole('link', { name: /Récurrentes/ }).textContent?.trim()).toBe('Récurrentes');
  });

  it('closes with the destination to navigate to', async () => {
    const { close } = await renderDrawer();
    await userEvent.click(screen.getByRole('link', { name: /Analyse du mois/ }));
    expect(close).toHaveBeenCalledWith({ navigate: '/analyse' });
  });

  it('selects a book and closes', async () => {
    const { close, stores } = await renderDrawer();
    await userEvent.click(screen.getAllByRole('button').find((button) => button.textContent?.includes('Carnet p1')) as HTMLElement);
    expect(stores.books.select).toHaveBeenCalledWith('p1');
    expect(close).toHaveBeenCalledWith();
  });

  it('applies the theme and the language without closing', async () => {
    const { close, languages } = await renderDrawer();
    await userEvent.click(within(screen.getByRole('radiogroup', { name: 'Apparence' })).getByRole('radio', { name: 'Sombre' }));
    expect(TestBed.inject(UiThemeService).choice()).toBe('dark');
    await userEvent.click(within(screen.getByRole('radiogroup', { name: 'Langue' })).getByRole('radio', { name: 'English' }));
    expect(languages.use).toHaveBeenCalledWith('en');
    expect(close).not.toHaveBeenCalled();
    TestBed.inject(UiThemeService).setChoice('system');
  });

  it('signs out and goes to the sign-in page', async () => {
    const { close, session } = await renderDrawer();
    await userEvent.click(screen.getByRole('button', { name: /Se déconnecter/ }));
    await settle();
    expect(session.signOut).toHaveBeenCalled();
    expect(close).toHaveBeenCalledWith({ navigate: '/connexion' });
  });
});

describe('currentDestination', () => {
  it('matches the longest destination and the home page exactly', () => {
    expect(currentDestination('/')).toBe('/');
    expect(currentDestination('/budget?mois=2026-11')).toBe('/budget');
    expect(currentDestination('/operations')).toBe('/operations');
    expect(currentDestination('/carnets/nouveau')).toBeNull();
  });
});
