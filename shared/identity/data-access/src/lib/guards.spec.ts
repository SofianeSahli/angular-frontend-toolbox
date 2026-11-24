import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import { provideApi } from '@shared/http-data-access';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { authGuard, guestGuard } from './guards';
import { provideIdentity } from './provide-identity';
import { IDENTITY_TEST_CONFIG } from './testing';
import { SessionStatus, SessionStore } from './session.store';

@Component({ template: '' })
class Blank {}

async function navigate(url: string, state: { status: SessionStatus; restoring?: boolean; unavailable?: boolean }) {
  TestBed.configureTestingModule({
    providers: [
      provideApi({ baseUrl: 'http://api.test/api/v1' }),
      provideHttpClientTesting(),
      provideIdentity(IDENTITY_TEST_CONFIG),
      provideRouter([
        { path: 'connexion', component: Blank, canActivate: [guestGuard] },
        { path: 'indisponible', component: Blank },
        { path: '', component: Blank, canActivate: [authGuard] },
        { path: 'compte', component: Blank, canActivate: [authGuard] },
      ]),
    ],
  });
  const store = TestBed.inject(SessionStore);
  patchState(unprotected(store), { restoring: false, unavailable: false, ...state });
  const router = TestBed.inject(Router);
  const navigation = router.navigateByUrl(url);
  return { store, router, navigation };
}

describe('guards', () => {
  it('sends an anonymous visitor to sign-in with the requested URL', async () => {
    const { router, navigation } = await navigate('/compte?tab=2', { status: 'anonymous' });
    await navigation;
    expect(router.url).toBe('/connexion?returnUrl=%2Fcompte%3Ftab%3D2');
  });

  it('lets an authenticated user through', async () => {
    const { router, navigation } = await navigate('/compte', { status: 'authenticated' });
    await navigation;
    expect(router.url).toBe('/compte');
  });

  it('sends an authenticated user away from the guest pages', async () => {
    const { router, navigation } = await navigate('/connexion', { status: 'authenticated' });
    await navigation;
    expect(router.url).toBe('/');
  });

  it('lets an anonymous visitor reach the guest pages', async () => {
    const { router, navigation } = await navigate('/connexion', { status: 'anonymous' });
    await navigation;
    expect(router.url).toBe('/connexion');
  });

  it('shows the unavailable page instead of sign-in while the service is down', async () => {
    const { router, navigation } = await navigate('/compte', { status: 'unknown', unavailable: true });
    await navigation;
    expect(router.url).toBe('/indisponible?returnUrl=%2Fcompte');
  });

  it('waits for restore to finish before deciding', async () => {
    const { store, router, navigation } = await navigate('/compte', { status: 'unknown', restoring: true });
    let settled = false;
    void navigation.then(() => (settled = true));
    await new Promise((resolve) => setTimeout(resolve));
    expect(settled).toBe(false);

    patchState(unprotected(store), { status: 'authenticated', restoring: false });
    TestBed.tick();
    await navigation;
    expect(router.url).toBe('/compte');
  });
});
