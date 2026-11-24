import { HttpRequest } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ErrorBus, SESSION_EXPIRY, provideApi } from '@shared/http-data-access';
import { AUTH_STRATEGY, TokenAuthStrategy } from './auth-strategy';
import { IDENTITY_TEST_CONFIG } from './testing';
import { AccountDto } from './models';
import { provideIdentity } from './provide-identity';
import { SessionStore } from './session.store';

const BASE = 'http://api.test/api/v1';
const CSRF = 'http://api.test/sanctum/csrf-cookie';

const ACCOUNT: AccountDto = {
  id: 'a1',
  name: 'Amira',
  email: 'amira@exemple.com',
  phone: null,
  locale: 'fr',
  two_factor_enabled: false,
};

function setup() {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideApi({ baseUrl: BASE }), provideHttpClientTesting(), provideIdentity(IDENTITY_TEST_CONFIG)],
  });
  return { store: TestBed.inject(SessionStore), backend: TestBed.inject(HttpTestingController), bus: TestBed.inject(ErrorBus) };
}

async function expectRequest(backend: HttpTestingController, method: string, url: string): Promise<TestRequest> {
  let request: TestRequest | undefined;
  await vi.waitFor(() => {
    request = backend.expectOne((candidate: HttpRequest<unknown>) => candidate.method === method && candidate.url === url);
  });
  if (!request) throw new Error(`no ${method} ${url}`);
  return request;
}

function failWith(request: TestRequest, status: number, code: string, extra: object = {}): void {
  request.flush({ error: { code, ...extra } }, { status, statusText: 'Error' });
}

async function flushCsrf(backend: HttpTestingController): Promise<void> {
  (await expectRequest(backend, 'GET', CSRF)).flush(null, { status: 204, statusText: 'No Content' });
}

describe('SessionStore', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  describe('restore', () => {
    it('fetches the CSRF cookie, then becomes authenticated with the account', async () => {
      const { store, backend } = setup();
      const restoring = store.restore();
      expect(store.restoring()).toBe(true);
      await flushCsrf(backend);
      (await expectRequest(backend, 'GET', `${BASE}/me`)).flush({ data: ACCOUNT });
      await restoring;
      expect(store.status()).toBe('authenticated');
      expect(store.account()?.twoFactorEnabled).toBe(false);
      expect(store.restoring()).toBe(false);
    });

    it('becomes anonymous on 401 without publishing it', async () => {
      const { store, backend, bus } = setup();
      const restoring = store.restore();
      await flushCsrf(backend);
      failWith(await expectRequest(backend, 'GET', `${BASE}/me`), 401, 'auth.unauthenticated');
      await restoring;
      expect(store.status()).toBe('anonymous');
      expect(store.unavailable()).toBe(false);
      expect(bus.latest()).toBeNull();
    });

    it('keeps the status unknown and records the service as unavailable when the server fails', async () => {
      const { store, backend } = setup();
      const restoring = store.restore();
      await flushCsrf(backend);
      failWith(await expectRequest(backend, 'GET', `${BASE}/me`), 503, 'server.unavailable');
      await restoring;
      expect(store.status()).toBe('unknown');
      expect(store.unavailable()).toBe(true);
    });

    it('records the service as unavailable when offline', async () => {
      const { store, backend } = setup();
      const restoring = store.restore();
      (await expectRequest(backend, 'GET', CSRF)).error(new ProgressEvent('error'), { status: 0 });
      await restoring;
      expect(store.status()).toBe('unknown');
      expect(store.unavailable()).toBe(true);
    });
  });

  it('registers with the terms version and remembers the email for the code step', async () => {
    const { store, backend } = setup();
    const result = store.register({ name: 'Amira', email: 'amira@exemple.com', password: 'secret-phrase', locale: 'fr' });
    const request = await expectRequest(backend, 'POST', `${BASE}/auth/email/register`);
    expect(request.request.body).toMatchObject({ terms_version: '2026-11', locale: 'fr' });
    request.flush(null, { status: 202, statusText: 'Accepted' });
    expect(await result).toEqual({ outcome: 'done' });
    expect(store.pendingEmail()).toBe('amira@exemple.com');
  });

  it('returns validation errors to the page and keeps working afterwards', async () => {
    const { store, backend } = setup();
    const first = store.register({ name: 'A', email: 'bad', password: 'x', locale: 'fr' });
    failWith(await expectRequest(backend, 'POST', `${BASE}/auth/email/register`), 422, 'validation.failed', { fields: { email: ['email.invalid'] } });
    const result = await first;
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') expect(result.error.fields['email']).toEqual(['email.invalid']);

    const second = store.resendCode('amira@exemple.com');
    (await expectRequest(backend, 'POST', `${BASE}/auth/email/resend`)).flush(null, { status: 202, statusText: 'Accepted' });
    expect(await second).toEqual({ outcome: 'done' });
  });

  it('signs in and clears the pending state', async () => {
    const { store, backend } = setup();
    const result = store.signIn('amira@exemple.com', 'secret-phrase');
    await flushCsrf(backend);
    const request = await expectRequest(backend, 'POST', `${BASE}/auth/email/login`);
    expect(request.request.body).toEqual({ email: 'amira@exemple.com', password: 'secret-phrase' });
    request.flush({ data: { status: 'signed_in', account: ACCOUNT } });
    expect(await result).toEqual({ outcome: 'done' });
    expect(store.status()).toBe('authenticated');
    expect(store.pendingTwoFactor()).toBeNull();
    expect(store.pendingEmail()).toBeNull();
  });

  it('keeps the pending sign-in in memory when a code is required, then confirms it', async () => {
    const { store, backend } = setup();
    const signingIn = store.signIn('amira@exemple.com', 'secret-phrase');
    await flushCsrf(backend);
    (await expectRequest(backend, 'POST', `${BASE}/auth/email/login`)).flush({
      data: { status: 'code_required', pending_sign_in: 'pending-1', expires_in_seconds: 600 },
    });
    expect(await signingIn).toEqual({ outcome: 'two-factor' });
    expect(store.pendingTwoFactor()).toMatchObject({ pendingSignIn: 'pending-1', email: 'amira@exemple.com' });
    expect(store.status()).not.toBe('authenticated');
    expect(JSON.stringify(localStorage)).not.toContain('pending-1');
    expect(JSON.stringify(sessionStorage)).not.toContain('pending-1');

    const confirming = store.confirmTwoFactor('123456');
    await flushCsrf(backend);
    const request = await expectRequest(backend, 'POST', `${BASE}/auth/two-factor`);
    expect(request.request.body).toEqual({ pending_sign_in: 'pending-1', code: '123456' });
    request.flush({ data: { status: 'signed_in', account: ACCOUNT } });
    expect(await confirming).toEqual({ outcome: 'done' });
    expect(store.status()).toBe('authenticated');
    expect(store.pendingTwoFactor()).toBeNull();
  });

  it('reports a missing pending sign-in without calling the server', async () => {
    const { store } = setup();
    const result = await store.confirmTwoFactor('123456');
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') expect(result.error.code).toBe('auth.pending_invalid');
  });

  it('sends the Google token, terms version and locale', async () => {
    const { store, backend } = setup();
    const result = store.signInWithGoogle({ idToken: 'jwt', termsVersion: '2026-11', locale: 'en' });
    await flushCsrf(backend);
    const request = await expectRequest(backend, 'POST', `${BASE}/auth/google`);
    expect(request.request.body).toEqual({ id_token: 'jwt', terms_version: '2026-11', locale: 'en' });
    request.flush({ data: { status: 'signed_in', account: ACCOUNT } });
    expect(await result).toEqual({ outcome: 'done' });
  });

  it('does not publish the error codes the page handles', async () => {
    const { store, backend, bus } = setup();
    const result = store.signIn('amira@exemple.com', 'wrong', ['auth.invalid_credentials']);
    await flushCsrf(backend);
    failWith(await expectRequest(backend, 'POST', `${BASE}/auth/email/login`), 401, 'auth.invalid_credentials');
    expect((await result).outcome).toBe('error');
    expect(bus.latest()).toBeNull();
  });

  it.each([
    [204, null],
    [401, 'auth.unauthenticated'],
  ])('signs out and clears everything when logout answers %s', async (status, code) => {
    const { store, backend } = setup();
    const restoring = store.restore();
    await flushCsrf(backend);
    (await expectRequest(backend, 'GET', `${BASE}/me`)).flush({ data: ACCOUNT });
    await restoring;

    const signingOut = store.signOut();
    const request = await expectRequest(backend, 'POST', `${BASE}/auth/logout`);
    if (code) failWith(request, status, code);
    else request.flush(null, { status, statusText: 'No Content' });
    expect(await signingOut).toEqual({ outcome: 'done' });
    expect(store.status()).toBe('anonymous');
    expect(store.account()).toBeNull();
  });

  it('updates the account after enabling and disabling two-factor', async () => {
    const { store, backend } = setup();
    const restoring = store.restore();
    await flushCsrf(backend);
    (await expectRequest(backend, 'GET', `${BASE}/me`)).flush({ data: ACCOUNT });
    await restoring;

    const enabling = store.enableTwoFactor();
    (await expectRequest(backend, 'POST', `${BASE}/me/two-factor`)).flush(null, { status: 204, statusText: 'No Content' });
    await enabling;
    expect(store.account()?.twoFactorEnabled).toBe(true);

    const disabling = store.disableTwoFactor('654321');
    const request = await expectRequest(backend, 'DELETE', `${BASE}/me/two-factor`);
    expect(request.request.body).toEqual({ code: '654321' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await disabling;
    expect(store.account()?.twoFactorEnabled).toBe(false);
  });

  it('reloads the account', async () => {
    const { store, backend } = setup();
    const refreshing = store.refreshAccount();
    (await expectRequest(backend, 'GET', `${BASE}/me`)).flush({ data: { ...ACCOUNT, two_factor_enabled: true } });
    expect(await refreshing).toEqual({ outcome: 'done' });
    expect(store.account()?.twoFactorEnabled).toBe(true);
  });

  it('remembers the email after a password reset request and clears it after the reset', async () => {
    const { store, backend } = setup();
    const asking = store.forgotPassword('amira@exemple.com');
    (await expectRequest(backend, 'POST', `${BASE}/auth/password/forgot`)).flush(null, { status: 202, statusText: 'Accepted' });
    await asking;
    expect(store.pendingEmail()).toBe('amira@exemple.com');

    const resetting = store.resetPassword('amira@exemple.com', '123456', 'new-secret-phrase');
    (await expectRequest(backend, 'POST', `${BASE}/auth/password/reset`)).flush(null, { status: 204, statusText: 'No Content' });
    await resetting;
    expect(store.pendingEmail()).toBeNull();
  });

  it('provides a session expiry that expires the store and builds the sign-in URL', () => {
    const { store } = setup();
    const expiry = TestBed.inject(SESSION_EXPIRY);
    expect(expiry.isSignedIn()).toBe(false);
    expiry.expire();
    expect(store.status()).toBe('expired');
    expect(expiry.signInUrl('/compte')).toBe('/connexion?returnUrl=%2Fcompte');
  });
});

describe('TokenAuthStrategy', () => {
  it('is a stub that says it is not implemented', () => {
    TestBed.configureTestingModule({ providers: [{ provide: AUTH_STRATEGY, useClass: TokenAuthStrategy }] });
    expect(() => TestBed.inject(AUTH_STRATEGY).prepare()).toThrow(/not implemented/);
  });
});
