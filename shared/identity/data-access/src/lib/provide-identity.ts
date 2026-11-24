import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { Router } from '@angular/router';
import { SESSION_EXPIRY, SessionExpiry } from '@shared/http-data-access';
import { AUTH_STRATEGY, CookieAuthStrategy } from './auth-strategy';
import { IDENTITY_CONFIG, IdentityConfig } from './identity-config';
import { SessionStore } from './session.store';

function sessionExpiryFromStore(): SessionExpiry {
  const store = inject(SessionStore);
  const router = inject(Router);
  const config = inject(IDENTITY_CONFIG);
  return {
    isSignedIn: () => store.isAuthenticated(),
    expire: () => store.expire(),
    signInUrl: (returnUrl) => router.serializeUrl(router.createUrlTree([config.paths.signIn], { queryParams: { returnUrl } })),
  };
}

export function provideIdentity(config: IdentityConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: IDENTITY_CONFIG, useValue: config },
    { provide: AUTH_STRATEGY, useClass: CookieAuthStrategy },
    { provide: SESSION_EXPIRY, useFactory: sessionExpiryFromStore },
  ]);
}
