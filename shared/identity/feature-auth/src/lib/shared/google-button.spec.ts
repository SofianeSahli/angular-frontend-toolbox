import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { IDENTITY_CONFIG, SessionStore } from '@shared/identity-data-access';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import fr from '../../i18n/fr.json';
import { DONE, FakeSessionStore, TEST_CONFIG, TWO_FACTOR, failed, fakeSessionStore } from '../testing/page-harness';
import { GoogleButton } from './google-button';
import { GoogleAccountsId, GoogleCredentialResponse, GoogleIdentityLoader } from './google-identity';

@Component({ template: '' })
class Destination {}

@Component({
  imports: [GoogleButton],
  template: '<identity-google-button [termsAccepted]="terms()" (problem)="problem.set($event)" />',
})
class Host {
  readonly terms = signal(false);
  readonly problem = signal<string | null>(null);
}

interface SetupOptions {
  readonly clientId?: string;
  readonly loadFails?: boolean;
  readonly termsAccepted?: boolean;
  readonly store?: FakeSessionStore;
}

async function setup(options: SetupOptions = {}) {
  let callback: ((response: GoogleCredentialResponse) => void) | null = null;
  const accountsId = {
    initialize: vi.fn<GoogleAccountsId['initialize']>((settings) => {
      callback = settings.callback;
    }),
    renderButton: vi.fn<GoogleAccountsId['renderButton']>(),
  };
  const loader = {
    load: vi.fn(() => (options.loadFails ? Promise.reject(new Error('blocked')) : Promise.resolve(accountsId))),
  };
  const store = options.store ?? fakeSessionStore();
  const view = await render(Host, {
    providers: [
      provideRouter([{ path: '**', component: Destination }]),
      provideTranslateService({ lang: 'fr' }),
      { provide: IDENTITY_CONFIG, useValue: { ...TEST_CONFIG, googleClientId: options.clientId ?? 'client-1' } },
      { provide: SessionStore, useValue: store },
      { provide: GoogleIdentityLoader, useValue: loader },
    ],
  });
  TestBed.inject(TranslateService).setTranslation('fr', fr);
  view.fixture.componentInstance.terms.set(options.termsAccepted ?? false);
  const settle = async () => {
    await new Promise((resolve) => setTimeout(resolve));
    view.detectChanges();
  };
  view.detectChanges();
  await settle();
  const pick = async (credential: string) => {
    callback?.({ credential });
    await settle();
  };
  return { view, store, loader, accountsId, pick, settle, host: view.fixture.componentInstance, router: TestBed.inject(Router) };
}

describe('GoogleButton', () => {
  it('shows nothing and never loads the Google script without a client id', async () => {
    const { loader, view } = await setup({ clientId: '' });
    expect(loader.load).not.toHaveBeenCalled();
    expect(screen.queryByText(fr.identity.google.or)).toBeNull();
    expect(view.container.querySelector('.identity-google__button')).toBeNull();
  });

  it("renders Google's own button, in the current language, under an \"ou\" divider", async () => {
    const { loader, accountsId } = await setup();
    expect(loader.load).toHaveBeenCalledTimes(1);
    expect(screen.getByText(fr.identity.google.or)).toBeTruthy();
    expect(accountsId.initialize).toHaveBeenCalledWith(expect.objectContaining({ client_id: 'client-1' }));
    expect(accountsId.renderButton).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ text: 'continue_with', locale: 'fr' }));
  });

  it('sends the id token with the locale and no terms version, then goes to the after-sign-in page', async () => {
    const { store, pick, router } = await setup();
    await pick('id-token-1');
    expect(store.signInWithGoogle).toHaveBeenCalledWith({ idToken: 'id-token-1', locale: 'fr' }, expect.arrayContaining(['auth.google_invalid']));
    expect(router.url).toBe('/');
  });

  it('sends the terms version when the sign-up terms box is checked', async () => {
    const { store, pick } = await setup({ termsAccepted: true });
    await pick('id-token-1');
    expect(store.signInWithGoogle).toHaveBeenCalledWith({ idToken: 'id-token-1', locale: 'fr', termsVersion: '2026-11' }, expect.any(Array));
  });

  it('goes to the two-factor page when the account asks for a code', async () => {
    const store = fakeSessionStore();
    store.signInWithGoogle.mockResolvedValue(TWO_FACTOR);
    const { pick, router } = await setup({ store });
    await pick('id-token-1');
    expect(router.url).toBe('/connexion/code');
  });

  it('asks for the terms in place, then resends the same token with the terms version', async () => {
    const store = fakeSessionStore();
    store.signInWithGoogle.mockResolvedValueOnce(failed('validation', 422, 'auth.terms_required')).mockResolvedValueOnce(DONE);
    const { pick, settle, router, host } = await setup({ store });
    await pick('id-token-1');

    const continueButton = screen.getByRole('button', { name: fr.identity.google.continue });
    expect(screen.getByText(fr.identity.google.termsLead)).toBeTruthy();
    expect(screen.getByRole('link', { name: fr.identity.signUp.terms }).getAttribute('href')).toBe('/conditions');
    expect(continueButton.hasAttribute('disabled')).toBe(true);
    expect(host.problem()).toBeNull();

    await userEvent.click(screen.getByRole('checkbox'));
    await settle();
    await userEvent.click(continueButton);
    await settle();
    expect(store.signInWithGoogle).toHaveBeenLastCalledWith({ idToken: 'id-token-1', locale: 'fr', termsVersion: '2026-11' }, expect.any(Array));
    expect(router.url).toBe('/');
    expect(screen.queryByText(fr.identity.google.termsLead)).toBeNull();
  });

  it.each([
    ['auth.google_invalid', fr.identity.errors.auth.google_invalid],
    ['auth.google_unavailable', fr.identity.errors.auth.google_unavailable],
    ['auth.google_email_conflict', fr.identity.errors.auth.google_email_conflict],
  ])('reports %s as a message for above the form', async (code, message) => {
    const store = fakeSessionStore();
    store.signInWithGoogle.mockResolvedValue(failed('conflict', 409, code));
    const { pick, host } = await setup({ store });
    await pick('id-token-1');
    expect(host.problem()).toBe(message);
  });

  it('suggests signing in with email on an address conflict', () => {
    expect(fr.identity.errors.auth.google_email_conflict).toContain('e-mail');
  });

  it('reports a script that fails to load', async () => {
    const { host } = await setup({ loadFails: true });
    expect(host.problem()).toBe(fr.identity.errors.auth.google_unavailable);
  });
});
