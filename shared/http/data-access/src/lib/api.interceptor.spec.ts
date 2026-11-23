import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from './api-config';
import { ApiError } from './api-error';
import { apiInterceptor } from './api.interceptor';
import { ErrorBus } from './error-bus';
import { handling } from './handled-errors';

const BASE = 'http://api.test/api/v1';
const CSRF = 'http://api.test/sanctum/csrf-cookie';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function setup() {
  TestBed.configureTestingModule({
    providers: [{ provide: API_CONFIG, useValue: { baseUrl: BASE } }, provideHttpClient(withInterceptors([apiInterceptor])), provideHttpClientTesting()],
  });
  return { http: TestBed.inject(HttpClient), backend: TestBed.inject(HttpTestingController), bus: TestBed.inject(ErrorBus) };
}

async function failure(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error('expected the request to fail');
}

describe('apiInterceptor', () => {
  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    TestBed.inject(HttpTestingController).verify();
  });

  it('sends credentials, JSON accept, a new request id and the XSRF token from the cookie', async () => {
    const { http, backend } = setup();
    document.cookie = 'XSRF-TOKEN=abc%3D%3D';
    const response = firstValueFrom(http.get(`${BASE}/me`));
    const request = backend.expectOne(`${BASE}/me`);
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.get('Accept')).toBe('application/json');
    expect(request.request.headers.get('X-Request-Id')).toMatch(UUID);
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('abc==');
    request.flush({ data: {} });
    await response;
  });

  it('gives every request its own id', async () => {
    const { http, backend } = setup();
    void firstValueFrom(http.get(`${BASE}/a`));
    void firstValueFrom(http.get(`${BASE}/b`));
    const [a, b] = [backend.expectOne(`${BASE}/a`), backend.expectOne(`${BASE}/b`)];
    expect(a.request.headers.get('X-Request-Id')).not.toBe(b.request.headers.get('X-Request-Id'));
    a.flush({});
    b.flush({});
  });

  it('leaves requests outside the API untouched', async () => {
    const { http, backend } = setup();
    const response = firstValueFrom(http.get('/i18n/fr.json'));
    const request = backend.expectOne('/i18n/fr.json');
    expect(request.request.withCredentials).toBe(false);
    expect(request.request.headers.has('X-Request-Id')).toBe(false);
    request.flush({});
    await response;
  });

  it.each([
    [401, 'auth.unauthenticated', 'unauthenticated'],
    [403, 'auth.forbidden', 'forbidden'],
    [404, 'request.not_found', 'not-found'],
    [409, 'email.taken', 'conflict'],
    [429, 'request.throttled', 'throttled'],
    [500, 'server.error', 'server'],
    [503, 'server.unavailable', 'server'],
    [415, 'request.not_json', 'server'],
  ])('maps %d %s to kind %s and publishes it', async (status, code, kind) => {
    const { http, backend, bus } = setup();
    const error = failure(firstValueFrom(http.post(`${BASE}/x`, {})));
    backend.expectOne(`${BASE}/x`).flush({ error: { code } }, { status, statusText: 'x', headers: { 'X-Request-Id': 'req-1' } });
    expect(await error).toMatchObject({ kind, status, code, requestId: 'req-1' });
    expect(bus.latest()?.error.code).toBe(code);
  });

  it('keeps validation fields and does not publish validation errors', async () => {
    const { http, backend, bus } = setup();
    const error = failure(firstValueFrom(http.post(`${BASE}/auth/email/register`, {})));
    backend
      .expectOne(`${BASE}/auth/email/register`)
      .flush({ error: { code: 'validation.failed', fields: { password: ['password.min'] } } }, { status: 422, statusText: 'x' });
    expect(await error).toMatchObject({ kind: 'validation', fields: { password: ['password.min'] } });
    expect(bus.latest()).toBeNull();
  });

  it('treats any other 422 code as validation without fields', async () => {
    const { http, backend } = setup();
    const error = failure(firstValueFrom(http.post(`${BASE}/auth/email/confirm`, {})));
    backend.expectOne(`${BASE}/auth/email/confirm`).flush({ error: { code: 'code.invalid' } }, { status: 422, statusText: 'x' });
    expect(await error).toMatchObject({ kind: 'validation', code: 'code.invalid', fields: {} });
  });

  it('reads the wait from the body, else from the Retry-After header', async () => {
    const { http, backend } = setup();
    const fromBody = failure(firstValueFrom(http.post(`${BASE}/a`, {})));
    backend.expectOne(`${BASE}/a`).flush({ error: { code: 'auth.password_locked', retry_after_seconds: 42 } }, { status: 429, statusText: 'x' });
    expect((await fromBody).retryAfterSeconds).toBe(42);
    const fromHeader = failure(firstValueFrom(http.post(`${BASE}/b`, {})));
    backend.expectOne(`${BASE}/b`).flush({ error: { code: 'request.throttled' } }, { status: 429, statusText: 'x', headers: { 'Retry-After': '7' } });
    expect((await fromHeader).retryAfterSeconds).toBe(7);
  });

  it('maps a missing response to offline, with the request id it sent', async () => {
    const { http, backend } = setup();
    const error = failure(firstValueFrom(http.get(`${BASE}/me`)));
    const request = backend.expectOne(`${BASE}/me`);
    const sentId = request.request.headers.get('X-Request-Id');
    request.error(new ProgressEvent('error'), { status: 0 });
    expect(await error).toMatchObject({ kind: 'offline', code: 'http.offline', requestId: sentId });
  });

  it('does not publish codes the caller handles', async () => {
    const { http, backend, bus } = setup();
    const error = failure(firstValueFrom(http.post(`${BASE}/auth/email/login`, {}, { context: handling('auth.invalid_credentials') })));
    backend.expectOne(`${BASE}/auth/email/login`).flush({ error: { code: 'auth.invalid_credentials' } }, { status: 401, statusText: 'x' });
    expect((await error).code).toBe('auth.invalid_credentials');
    expect(bus.latest()).toBeNull();
  });

  it('on a CSRF mismatch fetches the cookie and retries once, with a new request id', async () => {
    const { http, backend, bus } = setup();
    const response = firstValueFrom(http.post(`${BASE}/auth/logout`, {}));
    const first = backend.expectOne(`${BASE}/auth/logout`);
    const firstId = first.request.headers.get('X-Request-Id');
    first.flush({ error: { code: 'auth.csrf_mismatch' } }, { status: 419, statusText: 'x' });
    const csrf = backend.expectOne(CSRF);
    expect(csrf.request.withCredentials).toBe(true);
    document.cookie = 'XSRF-TOKEN=fresh';
    csrf.flush(null, { status: 204, statusText: 'No Content' });
    const retry = backend.expectOne(`${BASE}/auth/logout`);
    expect(retry.request.headers.get('X-XSRF-TOKEN')).toBe('fresh');
    expect(retry.request.headers.get('X-Request-Id')).not.toBe(firstId);
    retry.flush(null, { status: 204, statusText: 'No Content' });
    await response;
    expect(bus.latest()).toBeNull();
  });

  it('gives up after one CSRF retry', async () => {
    const { http, backend, bus } = setup();
    const error = failure(firstValueFrom(http.post(`${BASE}/auth/logout`, {})));
    backend.expectOne(`${BASE}/auth/logout`).flush({ error: { code: 'auth.csrf_mismatch' } }, { status: 419, statusText: 'x' });
    backend.expectOne(CSRF).flush(null, { status: 204, statusText: 'No Content' });
    backend.expectOne(`${BASE}/auth/logout`).flush({ error: { code: 'auth.csrf_mismatch' } }, { status: 419, statusText: 'x' });
    expect((await error).kind).toBe('csrf');
    expect(bus.latest()?.error.kind).toBe('csrf');
  });
});
