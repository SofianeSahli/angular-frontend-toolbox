import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { IDENTITY_CONFIG, SessionStore } from '@shared/identity-data-access';
import { PATHS, appRoutes } from './app.routes';
import { BooksStore } from './households/data/books.store';
import { HouseholdStore } from './households/data/household.store';
import { InvitationsStore } from './households/data/invitations.store';
import { FakeStores, book, fakeStores } from './households/testing';
import { of } from 'rxjs';
import { CategoriesApi } from './categories/data/categories-api';
import { EntriesApi } from './operations/data/entries-api';
import { BudgetApi } from './budget/data/budget-api';
import { NO_PLAN } from './budget/testing';
import { SummaryApi } from './dashboard/data/summary-api';
import { summary } from './dashboard/testing';
import { RecurringApi } from './recurring/data/recurring-api';

function navigateAs(status: 'anonymous' | 'authenticated', unavailable = false, stores: FakeStores = withBook()) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(appRoutes),
      provideTranslateService({ lang: 'fr' }),
      { provide: IDENTITY_CONFIG, useValue: { termsVersion: '2026-11', afterSignIn: '/', paths: PATHS } },
      {
        provide: SessionStore,
        useValue: {
          restoring: signal(false),
          unavailable: signal(unavailable),
          isAuthenticated: signal(status === 'authenticated'),
          account: signal(null),
          pendingEmail: signal(null),
          pendingTwoFactor: signal(null),
          returnUrl: signal(null),
          rememberReturnUrl: vi.fn(),
        },
      },
      { provide: BooksStore, useValue: stores.books },
      { provide: HouseholdStore, useValue: stores.household },
      { provide: InvitationsStore, useValue: stores.invitations },
      { provide: CategoriesApi, useValue: { tree: () => of('notModified') } },
      { provide: EntriesApi, useValue: { page: () => of({ items: [], nextCursor: null }) } },
      { provide: BudgetApi, useValue: { get: () => of(NO_PLAN) } },
      { provide: SummaryApi, useValue: { get: () => of(summary()) } },
      { provide: RecurringApi, useValue: { list: () => of([]) } },
    ],
  });
  const router = TestBed.inject(Router);
  return async (url: string) => {
    await router.navigateByUrl(url);
    return router.url;
  };
}

function withBook(): FakeStores {
  const stores = fakeStores();
  stores.books.books.set([book('a')]);
  return stores;
}

describe('app routes', () => {
  it('sends a signed-out visitor from the home page to sign-in, keeping the return URL', async () => {
    expect(await navigateAs('anonymous')('/compte')).toBe('/connexion?returnUrl=%2Fcompte');
  });

  it('sends a signed-out visitor from the root to sign-in instead of an empty auth frame', async () => {
    expect(await navigateAs('anonymous')('/')).toBe('/connexion?returnUrl=%2F');
  });

  it('sends a signed-out visitor from an unknown path to sign-in', async () => {
    expect(await navigateAs('anonymous')('/nulle-part')).toBe('/connexion?returnUrl=%2F');
  });

  it.each(['/connexion', '/inscription', '/mot-de-passe-oublie', '/conditions', '/confidentialite'])('lets a signed-out visitor open %s', async (url) => {
    expect(await navigateAs('anonymous')(url)).toBe(url);
  });

  it('opens the home page for a signed-in user and keeps them away from sign-in', async () => {
    const navigate = navigateAs('authenticated');
    expect(await navigate('/')).toBe('/');
    expect(await navigate('/connexion')).toBe('/');
  });

  it('sends unknown paths home', async () => {
    expect(await navigateAs('authenticated')('/nulle-part')).toBe('/');
  });

  it('shows the unavailable page when the service is down at start', async () => {
    expect(await navigateAs('anonymous', true)('/')).toBe('/indisponible?returnUrl=%2F');
  });

  describe('workspace', () => {
    it('sends a signed-in user without a book to the welcome page', async () => {
      expect(await navigateAs('authenticated', false, fakeStores())('/')).toBe('/bienvenue');
    });

    it('sends a user who has books away from the welcome page', async () => {
      expect(await navigateAs('authenticated')('/bienvenue')).toBe('/');
    });

    it('opens the welcome page for a user without a book', async () => {
      expect(await navigateAs('authenticated', false, fakeStores())('/bienvenue')).toBe('/bienvenue');
    });

    it('shows the unavailable page when the workspace fails to load', async () => {
      const stores = withBook();
      stores.books.status.set('error');
      expect(await navigateAs('authenticated', false, stores)('/')).toBe('/indisponible?returnUrl=%2F');
    });

    it('opens the household page in the shell', async () => {
      expect(await navigateAs('authenticated')('/foyer')).toBe('/foyer');
    });

    it('opens the household creation for a user without a household', async () => {
      expect(await navigateAs('authenticated')('/foyer/nouveau')).toBe('/foyer/nouveau');
    });

    it('sends a user who has a household from its creation to the household page', async () => {
      const stores = withBook();
      stores.household.household.set({ id: 'h1', name: 'Les Martin', role: 'member' });
      expect(await navigateAs('authenticated', false, stores)('/foyer/nouveau')).toBe('/foyer');
    });

    it('opens the book creation below the personal book limit', async () => {
      expect(await navigateAs('authenticated')('/carnets/nouveau')).toBe('/carnets/nouveau');
    });

    it('opens the operations page in the shell (spec 007 REQ-5.1)', async () => {
      expect(await navigateAs('authenticated')('/operations')).toBe('/operations');
    });

    it('sends a user without a book from the operations page to the welcome page', async () => {
      expect(await navigateAs('authenticated', false, fakeStores())('/operations')).toBe('/bienvenue');
    });

    it('opens the dashboard with a month (spec 008 REQ-1.1)', async () => {
      expect(await navigateAs('authenticated')('/?mois=2026-10')).toBe('/?mois=2026-10');
    });

    it('opens the budget in the shell (spec 008 REQ-5.1)', async () => {
      expect(await navigateAs('authenticated')('/budget?mois=2026-11')).toBe('/budget?mois=2026-11');
    });

    it('opens the recurring operations, not the operations page (spec 008 REQ-6.1)', async () => {
      const navigate = navigateAs('authenticated');
      expect(await navigate('/operations/recurrentes')).toBe('/operations/recurrentes');
      const route = TestBed.inject(Router).routerState.snapshot.root.firstChild?.firstChild;
      expect(route?.routeConfig?.path).toBe('operations/recurrentes');
      expect(route?.data['titleKey']).toBe('recurring.title');
    });

    it('declares the recurring operations before the operations page', () => {
      const children = appRoutes.find((route) => route.children?.some((child) => child.path === 'operations'))?.children ?? [];
      const paths = children.map((child) => child.path);
      expect(paths.indexOf('operations/recurrentes')).toBeLessThan(paths.indexOf('operations'));
      expect(paths).toContain('budget');
    });

    it('sends a user without a book from the budget to the welcome page', async () => {
      expect(await navigateAs('authenticated', false, fakeStores())('/budget')).toBe('/bienvenue');
    });

    it.each(['/bienvenue', '/foyer', '/foyer/nouveau', '/carnets/nouveau', '/operations', '/budget', '/operations/recurrentes'])('sends a signed-out visitor from %s to sign-in', async (url) => {
      expect(await navigateAs('anonymous')(url)).toBe(`/connexion?returnUrl=${encodeURIComponent(url)}`);
    });

    it('lists the new paths', () => {
      expect(PATHS).toMatchObject({
        welcome: '/bienvenue',
        household: '/foyer',
        newHousehold: '/foyer/nouveau',
        newBook: '/carnets/nouveau',
        operations: '/operations',
        recurring: '/operations/recurrentes',
        budget: '/budget',
      });
    });
  });
});
