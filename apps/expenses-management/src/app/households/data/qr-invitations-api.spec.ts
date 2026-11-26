import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG, HANDLED_ERROR_CODES } from '@shared/http-data-access';
import { firstValueFrom } from 'rxjs';
import { QR_ACCEPT_CODES, QrInvitationsApi } from './qr-invitations-api';

const BASE = 'http://api.test/api/v1';

describe('QrInvitationsApi (spec 009 REQ-11.3, 11.4)', () => {
  let api: QrInvitationsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: API_CONFIG, useValue: { baseUrl: BASE } }, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(QrInvitationsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates a QR invitation for a household without a body', async () => {
    const result = firstValueFrom(api.create('h1'));
    const request = http.expectOne(`${BASE}/households/h1/qr-invitations`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    request.flush({ data: { id: 'q1', token: 'tok', expires_at: '2026-11-25T10:10:00Z' } });
    expect(await result).toEqual({ token: 'tok', expiresAt: new Date('2026-11-25T10:10:00Z') });
  });

  it('previews a token', async () => {
    const result = firstValueFrom(api.preview('tok'));
    const request = http.expectOne(`${BASE}/qr-invitations/preview`);
    expect(request.request.body).toEqual({ token: 'tok' });
    request.flush({ data: { household: { id: 'h1', name: 'Foyer Sahli' }, invited_by: { name: 'Sofiane' }, expires_at: '2026-11-25T10:10:00Z' } });
    expect((await result).household.name).toBe('Foyer Sahli');
  });

  it('accepts a token and handles the join refusals itself', async () => {
    const result = firstValueFrom(api.accept('tok'));
    const request = http.expectOne(`${BASE}/qr-invitations/accept`);
    expect([...request.request.context.get(HANDLED_ERROR_CODES)]).toEqual([...QR_ACCEPT_CODES]);
    request.flush({ data: { id: 'h1', name: 'Foyer Sahli', role: 'member' } });
    expect(await result).toEqual({ id: 'h1', name: 'Foyer Sahli', role: 'member' });
  });
});
