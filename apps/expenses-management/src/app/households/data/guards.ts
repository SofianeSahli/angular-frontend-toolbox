import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { UiToast } from '@shared/ui-organisms';
import { BooksStore } from './books.store';
import { HouseholdStore } from './household.store';

const HOME = '/';
const WELCOME = '/bienvenue';
const UNAVAILABLE = '/indisponible';

type Decide = (books: InstanceType<typeof BooksStore>, router: Router) => boolean | UrlTree;

function afterWorkspace(decide: Decide): CanActivateFn {
  return async (_route, state) => {
    const books = inject(BooksStore);
    const router = inject(Router);
    await books.load();
    return books.status() === 'error'
      ? router.createUrlTree([UNAVAILABLE], { queryParams: { returnUrl: state.url } })
      : decide(books, router);
  };
}

export const workspaceGuard: CanActivateFn = (route, state) =>
  afterWorkspace((books, router) => books.books().length > 0 || router.parseUrl(WELCOME))(route, state);

export const firstRunGuard: CanActivateFn = (route, state) =>
  afterWorkspace((books, router) => books.books().length === 0 || router.parseUrl(HOME))(route, state);

export const householdBookGuard: CanActivateFn = (route, state) => {
  const household = inject(HouseholdStore);
  const toast = inject(UiToast);
  const translate = inject(TranslateService);
  const wantsHousehold = route.queryParamMap.get('foyer') === '1';
  return afterWorkspace((books, router) => {
    if (wantsHousehold) return (household.isOwner() && books.householdBook() === null) || router.parseUrl(WELCOME);
    if (books.canCreatePersonalBook()) return true;
    toast.show({ message: translate.instant('households.newBook.limitReached'), tone: 'danger' });
    return router.parseUrl(HOME);
  })(route, state);
};
