import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { IDENTITY_CONFIG, SessionStore } from '@shared/identity-data-access';
import { PATHS, appRoutes } from './app.routes';

function navigateAs(status: 'anonymous' | 'authenticated', unavailable = false) {
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
    ],
  });
  const router = TestBed.inject(Router);
  return async (url: string) => {
    await router.navigateByUrl(url);
    return router.url;
  };
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
});
