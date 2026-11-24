import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '@shared/http-data-access';
import { firstValueFrom } from 'rxjs';
import { InvitationsApi } from './invitations-api';

const BASE = 'http://api.test/api/v1';
const SENT = { id: 'i1', email: 'amira@example.com', created_at: '2026-11-21T09:30:00Z', expires_at: '2026-11-28T09:30:00Z' };
const RECEIVED = {
  id: 'i2',
  household: { id: 'h1', name: 'Foyer' },
  invited_by: { name: 'Sofiane' },
  created_at: '2026-11-21T09:30:00Z',
  expires_at: '2026-11-28T09:30:00Z',
};

describe('InvitationsApi', () => {
  let api: InvitationsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: API_CONFIG, useValue: { baseUrl: BASE } }, provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(InvitationsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists sent invitations with parsed dates', async () => {
    const result = firstValueFrom(api.sent('h1'));
    http.expectOne(`${BASE}/households/h1/invitations`).flush({ data: [SENT], meta: { next_cursor: null } });
    const [invitation] = await result;
    expect(invitation.email).toBe('amira@example.com');
    expect(invitation.expiresAt.toISOString()).toBe('2026-11-28T09:30:00.000Z');
  });

  it('invites an email', async () => {
    const result = firstValueFrom(api.invite('h1', 'amira@example.com'));
    const request = http.expectOne(`${BASE}/households/h1/invitations`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'amira@example.com' });
    request.flush({ data: SENT });
    expect((await result).id).toBe('i1');
  });

  it('cancels an invitation', async () => {
    const result = firstValueFrom(api.cancel('h1', 'i1'));
    const request = http.expectOne(`${BASE}/households/h1/invitations/i1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(await result).toBeUndefined();
  });

  it('lists received invitations across pages', async () => {
    const result = firstValueFrom(api.received());
    http.expectOne(`${BASE}/invitations`).flush({ data: [RECEIVED], meta: { next_cursor: 'c2' } });
    await Promise.resolve();
    http.expectOne(`${BASE}/invitations?cursor=c2`).flush({ data: [{ ...RECEIVED, id: 'i3' }], meta: { next_cursor: null } });
    const received = await result;
    expect(received.map((invitation) => invitation.id)).toEqual(['i2', 'i3']);
    expect(received[0].invitedBy.name).toBe('Sofiane');
  });

  it('accepts and returns the household', async () => {
    const result = firstValueFrom(api.accept('i2'));
    const request = http.expectOne(`${BASE}/invitations/i2/accept`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    request.flush({ data: { id: 'h1', name: 'Foyer', role: 'member' } });
    expect(await result).toEqual({ id: 'h1', name: 'Foyer', role: 'member' });
  });

  it('declines an invitation', async () => {
    const result = firstValueFrom(api.decline('i2'));
    const request = http.expectOne(`${BASE}/invitations/i2/decline`);
    expect(request.request.method).toBe('POST');
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(await result).toBeUndefined();
  });
});
