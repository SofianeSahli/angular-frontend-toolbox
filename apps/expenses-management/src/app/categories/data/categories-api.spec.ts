import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG, HANDLED_ERROR_CODES } from '@shared/http-data-access';
import { firstValueFrom } from 'rxjs';
import { TREE, TREE_DTO } from '../testing';
import { CategoriesApi } from './categories-api';

const BASE = 'http://api.test/api/v1';

describe('CategoriesApi (REQ-2.1)', () => {
  let api: CategoriesApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: API_CONFIG, useValue: { baseUrl: BASE } }, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(CategoriesApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('gets the tree and its ETag, without If-None-Match the first time', async () => {
    const result = firstValueFrom(api.tree());
    const request = http.expectOne(`${BASE}/categories`);
    expect(request.request.headers.has('If-None-Match')).toBe(false);
    request.flush({ data: TREE_DTO }, { headers: { ETag: '"v2"' } });
    expect(await result).toEqual({ tops: TREE, etag: '"v2"' });
  });

  it('sends the known ETag and reads 304 as not modified', async () => {
    const result = firstValueFrom(api.tree('"v1"'));
    const request = http.expectOne(`${BASE}/categories`);
    expect(request.request.headers.get('If-None-Match')).toBe('"v1"');
    request.flush(null, { status: 304, statusText: 'Not Modified' });
    expect(await result).toBe('notModified');
  });

  it('declares offline and 304 as handled (REQ-8.3)', () => {
    void firstValueFrom(api.tree()).catch(() => undefined);
    const request = http.expectOne(`${BASE}/categories`);
    expect([...request.request.context.get(HANDLED_ERROR_CODES)]).toEqual(['http.offline', 'http.304']);
    request.flush({ data: [] });
  });

  it('passes other failures on', async () => {
    const result = firstValueFrom(api.tree());
    http.expectOne(`${BASE}/categories`).flush(null, { status: 500, statusText: 'Server Error' });
    await expect(result).rejects.toMatchObject({ status: 500 });
  });
});
