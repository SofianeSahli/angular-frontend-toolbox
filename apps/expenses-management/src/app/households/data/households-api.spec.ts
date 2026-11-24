import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '@shared/http-data-access';
import { firstValueFrom } from 'rxjs';
import { HouseholdsApi } from './households-api';

const BASE = 'http://api.test/api/v1';

describe('HouseholdsApi', () => {
  let api: HouseholdsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: API_CONFIG, useValue: { baseUrl: BASE } }, provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(HouseholdsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists households and follows the cursor', async () => {
    const result = firstValueFrom(api.list());
    http.expectOne(`${BASE}/households`).flush({ data: [{ id: 'h1', name: 'A', role: 'owner' }], meta: { next_cursor: 'c2' } });
    await Promise.resolve();
    http.expectOne(`${BASE}/households?cursor=c2`).flush({ data: [{ id: 'h2', name: 'B', role: 'member' }], meta: { next_cursor: null } });
    expect((await result).map((household) => household.id)).toEqual(['h1', 'h2']);
  });

  it('creates a household', async () => {
    const result = firstValueFrom(api.create('Foyer'));
    const request = http.expectOne(`${BASE}/households`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Foyer' });
    request.flush({ data: { id: 'h1', name: 'Foyer', role: 'owner' } });
    expect(await result).toEqual({ id: 'h1', name: 'Foyer', role: 'owner' });
  });

  it('renames with PATCH', async () => {
    const result = firstValueFrom(api.rename('h1', 'Famille'));
    const request = http.expectOne(`${BASE}/households/h1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ name: 'Famille' });
    request.flush({ data: { id: 'h1', name: 'Famille', role: 'owner' } });
    expect((await result).name).toBe('Famille');
  });

  it('deletes a household', async () => {
    const result = firstValueFrom(api.remove('h1'), { defaultValue: undefined });
    const request = http.expectOne(`${BASE}/households/h1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(await result).toBeUndefined();
  });

  it('lists members', async () => {
    const result = firstValueFrom(api.members('h1'));
    http.expectOne(`${BASE}/households/h1/members`).flush({ data: [{ id: 'u1', name: 'Amira', role: 'owner' }], meta: { next_cursor: null } });
    expect(await result).toEqual([{ id: 'u1', name: 'Amira', role: 'owner' }]);
  });

  it('removes a member', async () => {
    const result = firstValueFrom(api.removeMember('h1', 'u2'));
    const request = http.expectOne(`${BASE}/households/h1/members/u2`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(await result).toBeUndefined();
  });

  it('leaves a household', async () => {
    const result = firstValueFrom(api.leave('h1'));
    const request = http.expectOne(`${BASE}/households/h1/leave`);
    expect(request.request.method).toBe('POST');
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(await result).toBeUndefined();
  });
});
