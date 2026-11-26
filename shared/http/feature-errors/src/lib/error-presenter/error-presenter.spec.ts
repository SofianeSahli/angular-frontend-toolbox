import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { ApiError, ApiErrorKind, ErrorBus, SESSION_EXPIRY, SessionExpiry } from '@shared/http-data-access';
import { UiToast } from '@shared/ui-organisms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import ar from '../../i18n/ar.json';
import en from '../../i18n/en.json';
import fr from '../../i18n/fr.json';
import { ErrorPresenter } from './error-presenter';

@Component({ template: '' })
class Blank {}

const settle = () => new Promise((resolve) => setTimeout(resolve));

function apiError(kind: ApiErrorKind, status: number, code: string, retryAfterSeconds: number | null = null): ApiError {
  return new ApiError(kind, status, code, {}, retryAfterSeconds, 'req-123');
}

async function setup(signedIn = true) {
  const expiry: SessionExpiry = {
    isSignedIn: vi.fn(() => signedIn),
    expire: vi.fn(),
    signInUrl: (returnUrl) => `/connexion?returnUrl=${encodeURIComponent(returnUrl)}`,
  };
  await render(ErrorPresenter, {
    providers: [
      provideRouter([
        { path: 'compte', component: Blank },
        { path: 'connexion', component: Blank },
      ]),
      provideTranslateService({ lang: 'fr' }),
      { provide: SESSION_EXPIRY, useValue: expiry },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  const router = TestBed.inject(Router);
  await router.navigateByUrl('/compte');
  const bus = TestBed.inject(ErrorBus);
  const publish = async (error: ApiError) => {
    bus.publish(error);
    TestBed.tick();
    await settle();
  };
  return { expiry, router, publish, toasts: () => TestBed.inject(UiToast).toasts() };
}

describe('ErrorPresenter', () => {
  it('expires the session, says so and goes to sign-in with the current URL', async () => {
    const { expiry, router, publish, toasts } = await setup();
    await publish(apiError('unauthenticated', 401, 'auth.unauthenticated'));
    expect(expiry.expire).toHaveBeenCalled();
    expect(toasts().map((toast) => toast.message)).toEqual([fr.errors.sessionExpired]);
    expect(router.url).toBe('/connexion?returnUrl=%2Fcompte');
  });

  it('ignores a 401 when nobody is signed in', async () => {
    const { expiry, router, publish, toasts } = await setup(false);
    await publish(apiError('unauthenticated', 401, 'auth.unauthenticated'));
    expect(expiry.expire).not.toHaveBeenCalled();
    expect(toasts()).toEqual([]);
    expect(router.url).toBe('/compte');
  });

  it('shows one danger toast for several offline errors in a row', async () => {
    const { publish, toasts } = await setup();
    await publish(apiError('offline', 0, 'http.offline'));
    await publish(apiError('offline', 0, 'http.offline'));
    expect(toasts()).toHaveLength(1);
    expect(toasts()[0]).toMatchObject({ message: fr.errors.offline, tone: 'danger' });
  });

  it.each([
    ['forbidden', 403, 'household.forbidden', fr.errors.kinds.forbidden],
    ['not-found', 404, 'http.404', fr.errors.kinds['not-found']],
    ['conflict', 409, 'book.conflict', fr.errors.kinds.conflict],
  ] as const)('shows a toast for %s', async (kind, status, code, message) => {
    const { publish, toasts } = await setup();
    await publish(apiError(kind, status, code));
    expect(toasts().map((toast) => toast.message)).toEqual([message]);
  });

  it('includes the wait in a throttled message', async () => {
    const { publish, toasts } = await setup();
    await publish(apiError('throttled', 429, 'request.throttled', 42));
    expect(toasts()[0].message).toBe('Trop de tentatives. Réessayez dans 42 s.');
  });

  it('prefers the message of the error code when there is one', async () => {
    const { publish, toasts } = await setup();
    TestBed.inject(TranslateService).setTranslation('fr', { errors: { codes: { household: { forbidden: 'Réservé aux membres du foyer.' } } } }, true);
    await publish(apiError('forbidden', 403, 'household.forbidden'));
    expect(toasts()[0].message).toBe('Réservé aux membres du foyer.');
  });

  it('opens a dialog with the request id, and Retry reloads the current route', async () => {
    const { router, publish } = await setup();
    const navigate = vi.spyOn(router, 'navigateByUrl');
    await publish(apiError('server', 500, 'http.500'));
    const dialog = screen.getByRole('alertdialog', { name: fr.errors.server.title });
    expect(dialog.querySelector('code')?.textContent).toBe('req-123');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: fr.errors.server.retry }));

    await userEvent.click(screen.getByRole('button', { name: fr.errors.server.retry }));
    await settle();
    expect(navigate).toHaveBeenCalledWith('/compte', { onSameUrlNavigation: 'reload' });
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('opens one dialog for several server errors and closes it without retrying', async () => {
    const { router, publish } = await setup();
    const navigate = vi.spyOn(router, 'navigateByUrl');
    await publish(apiError('csrf', 419, 'auth.csrf_mismatch'));
    await publish(apiError('server', 500, 'http.500'));
    expect(screen.getAllByRole('alertdialog')).toHaveLength(1);

    const [footerClose] = screen.getAllByRole('button', { name: fr.errors.server.close }).filter((button) => button.closest('[uidialogfooter]'));
    await userEvent.click(footerClose);
    await settle();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('error presenter translations', () => {
  function keysOf(value: object, prefix = ''): string[] {
    return Object.entries(value).flatMap(([key, child]) =>
      typeof child === 'object' && child !== null ? keysOf(child, `${prefix}${key}.`) : [`${prefix}${key}`],
    );
  }

  it.each([
    ['en', en],
    ['ar', ar],
  ])('has every French key in %s', (_language, translations) => {
    expect(keysOf(translations).sort()).toEqual(keysOf(fr).sort());
  });
});
