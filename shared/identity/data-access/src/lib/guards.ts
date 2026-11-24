import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, filter, map, of, take } from 'rxjs';
import { IDENTITY_CONFIG } from './identity-config';
import { SessionStore } from './session.store';

type Decide = (store: SessionStore, requestedUrl: string) => boolean | UrlTree;

function afterRestore(decide: Decide): CanActivateFn {
  return (_route, state): Observable<boolean | UrlTree> => {
    const store = inject(SessionStore);
    const router = inject(Router);
    const config = inject(IDENTITY_CONFIG);
    const decision = (): boolean | UrlTree =>
      store.unavailable()
        ? router.createUrlTree([config.paths.unavailable], { queryParams: { returnUrl: state.url } })
        : decide(store, state.url);
    if (!store.restoring()) return of(decision());
    return toObservable(store.restoring).pipe(
      filter((restoring) => !restoring),
      take(1),
      map(decision),
    );
  };
}

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const config = inject(IDENTITY_CONFIG);
  return afterRestore((store, requestedUrl) =>
    store.isAuthenticated() || router.createUrlTree([config.paths.signIn], { queryParams: { returnUrl: requestedUrl } }),
  )(route, state);
};

export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const config = inject(IDENTITY_CONFIG);
  return afterRestore((store) => !store.isAuthenticated() || router.parseUrl(config.afterSignIn))(route, state);
};
