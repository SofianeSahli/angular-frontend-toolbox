import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { UiToast } from '@shared/ui-organisms';
import { BooksStatus, BooksStore } from './books.store';
import { firstRunGuard, householdBookGuard, workspaceGuard } from './guards';
import { HouseholdStore } from './household.store';
import { Book } from './models';
import { DONE } from './store-result';

@Component({ template: '' })
class Blank {}

function book(id: string, owner: 'account' | 'household' = 'account'): Book {
  return {
    id,
    name: id,
    currency: { code: 'TND', exponent: 3 },
    timezone: 'Africa/Tunis',
    owner: { type: owner, id: 'x' },
    canManage: true,
  };
}

describe('workspace guards', () => {
  const books = signal<readonly Book[]>([]);
  const status = signal<BooksStatus>('ready');
  const isOwner = signal(false);
  const load = vi.fn(() => Promise.resolve(DONE));
  const show = vi.fn();

  async function go(url: string): Promise<string> {
    const router = TestBed.inject(Router);
    await router.navigateByUrl(url);
    return router.url;
  }

  beforeEach(() => {
    books.set([]);
    status.set('ready');
    isOwner.set(false);
    load.mockClear();
    show.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Blank, canActivate: [workspaceGuard] },
          { path: 'bienvenue', component: Blank, canActivate: [firstRunGuard] },
          { path: 'carnets/nouveau', component: Blank, canActivate: [householdBookGuard] },
          { path: 'indisponible', component: Blank },
        ]),
        {
          provide: BooksStore,
          useValue: {
            load,
            status,
            books,
            householdBook: () => books().find((b) => b.owner.type === 'household') ?? null,
            canCreatePersonalBook: () => books().filter((b) => b.owner.type === 'account').length < 5,
          },
        },
        { provide: HouseholdStore, useValue: { isOwner } },
        { provide: UiToast, useValue: { show } },
        { provide: TranslateService, useValue: { instant: (key: string) => key } },
      ],
    });
  });

  describe('workspaceGuard', () => {
    it('lets a user with a book through, after the load', async () => {
      books.set([book('b1')]);
      expect(await go('/')).toBe('/');
      expect(load).toHaveBeenCalledOnce();
    });

    it('sends a user with no book to the welcome page', async () => {
      expect(await go('/')).toBe('/bienvenue');
    });

    it('sends a failed load to the unavailable page with the requested URL', async () => {
      status.set('error');
      expect(await go('/')).toBe('/indisponible?returnUrl=%2F');
    });
  });

  describe('firstRunGuard', () => {
    it('lets a user with no book stay on the welcome page', async () => {
      expect(await go('/bienvenue')).toBe('/bienvenue');
    });

    it('sends a user with a book home', async () => {
      books.set([book('b1')]);
      expect(await go('/bienvenue')).toBe('/');
    });

    it('sends a failed load to the unavailable page', async () => {
      status.set('error');
      expect(await go('/bienvenue')).toBe('/indisponible?returnUrl=%2Fbienvenue');
    });
  });

  describe('householdBookGuard', () => {
    it('lets the owner of a household without a book create the household book', async () => {
      isOwner.set(true);
      expect(await go('/carnets/nouveau?foyer=1')).toBe('/carnets/nouveau?foyer=1');
    });

    it('sends a non-owner asking for the household book to the welcome page', async () => {
      expect(await go('/carnets/nouveau?foyer=1')).toBe('/bienvenue');
    });

    it('sends an owner who already has a household book to the welcome page, which sends them home', async () => {
      isOwner.set(true);
      books.set([book('h', 'household')]);
      expect(await go('/carnets/nouveau?foyer=1')).toBe('/');
    });

    it('lets a user with fewer than five personal books create one', async () => {
      books.set([book('1'), book('2'), book('3'), book('4')]);
      expect(await go('/carnets/nouveau')).toBe('/carnets/nouveau');
    });

    it('sends a user with five personal books home with a toast', async () => {
      books.set([book('1'), book('2'), book('3'), book('4'), book('5')]);
      expect(await go('/carnets/nouveau')).toBe('/');
      expect(show).toHaveBeenCalledWith({ message: 'households.newBook.limitReached', tone: 'danger' });
    });

    it('sends a failed load to the unavailable page', async () => {
      status.set('error');
      expect(await go('/carnets/nouveau')).toBe('/indisponible?returnUrl=%2Fcarnets%2Fnouveau');
    });
  });
});
