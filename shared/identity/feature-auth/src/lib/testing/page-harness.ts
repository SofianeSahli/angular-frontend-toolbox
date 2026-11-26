import { Component, Provider, Type, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { ApiError, ApiErrorKind, ApiFieldErrors } from '@shared/http-data-access';
import { Account, AuthResult, IDENTITY_CONFIG, IdentityConfig, PendingTwoFactor, SessionStore } from '@shared/identity-data-access';
import { UiToast } from '@shared/ui-organisms';
import { render } from '@testing-library/angular';
import fr from '../../i18n/fr.json';

@Component({ templateUrl: './page-harness.html' })
class Destination {}

export const TEST_CONFIG: IdentityConfig = {
  termsVersion: '2026-11',
  afterSignIn: '/',
  paths: {
    signIn: '/connexion',
    signUp: '/inscription',
    emailCode: '/inscription/code',
    twoFactor: '/connexion/code',
    forgotPassword: '/mot-de-passe-oublie',
    resetPassword: '/mot-de-passe/nouveau',
    unavailable: '/indisponible',
    terms: '/conditions',
    privacy: '/confidentialite',
  },
};

export const DONE: AuthResult = { outcome: 'done' };
export const TWO_FACTOR: AuthResult = { outcome: 'two-factor' };

export function failed(kind: ApiErrorKind, status: number, code: string, fields: ApiFieldErrors = {}, retryAfterSeconds: number | null = null): AuthResult {
  return { outcome: 'error', error: new ApiError(kind, status, code, fields, retryAfterSeconds, 'req-1') };
}

function authCall() {
  return vi.fn<(...args: unknown[]) => Promise<AuthResult>>().mockResolvedValue(DONE);
}

export function fakeSessionStore() {
  return {
    pendingEmail: signal<string | null>(null),
    pendingTwoFactor: signal<PendingTwoFactor | null>(null),
    returnUrl: signal<string | null>(null),
    account: signal<Account | null>(null),
    status: signal('anonymous'),
    isAuthenticated: signal(false),
    restoring: signal(false),
    unavailable: signal(false),
    rememberReturnUrl: vi.fn(),
    restore: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    refreshAccount: authCall(),
    register: authCall(),
    resendCode: authCall(),
    confirmEmail: authCall(),
    signIn: authCall(),
    signInWithGoogle: authCall(),
    confirmTwoFactor: authCall(),
    resendTwoFactor: authCall(),
    forgotPassword: authCall(),
    resetPassword: authCall(),
    signOut: authCall(),
    enableTwoFactor: authCall(),
    requestDisableCode: authCall(),
    disableTwoFactor: authCall(),
    expire: vi.fn(),
  };
}

export type FakeSessionStore = ReturnType<typeof fakeSessionStore>;

export interface PageOptions {
  readonly providers?: readonly Provider[];
  readonly store?: FakeSessionStore;
  readonly url?: string;
  readonly beforeNavigate?: () => void;
}

export async function renderPage<T>(page: Type<T>, options: PageOptions = {}) {
  const store = options.store ?? fakeSessionStore();
  const url = options.url ?? '/page';
  const path = url.split('?')[0].slice(1);
  const routes = [
    { path, component: page },
    ...Object.values(TEST_CONFIG.paths)
      .filter((destination) => destination.slice(1) !== path)
      .map((destination) => ({ path: destination.slice(1), component: Destination })),
    { path: '', component: Destination },
    { path: '**', component: Destination },
  ];
  const view = await render('<router-outlet />', {
    imports: [RouterOutlet],
    providers: [
      provideRouter(routes),
      provideTranslateService({ lang: 'fr' }),
      { provide: IDENTITY_CONFIG, useValue: TEST_CONFIG },
      { provide: SessionStore, useValue: store },
      ...(options.providers ?? []),
    ],
  });
  renderedView = view;
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  options.beforeNavigate?.();
  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  view.detectChanges();
  await settle();
  return { ...view, store, router, toasts: () => TestBed.inject(UiToast).toasts() };
}

let renderedView: { detectChanges(): void } | null = null;

export async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  renderedView?.detectChanges();
}
