import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '@shared/http-data-access';
import { firstValueFrom } from 'rxjs';
import { BooksApi } from './books-api';

const BASE = 'http://api.test/api/v1';

const BOOK_DTO = {
  id: 'b1',
  name: 'Foyer',
  currency: { code: 'TND', exponent: 3 },
  timezone: 'Africa/Tunis',
  owner: { type: 'household', id: 'h1' },
  can_manage: true,
};

describe('BooksApi', () => {
  let api: BooksApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: API_CONFIG, useValue: { baseUrl: BASE } }, provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(BooksApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists books, mapping to camelCase and following the cursor', async () => {
    const result = firstValueFrom(api.list());
    http.expectOne(`${BASE}/books`).flush({ data: [BOOK_DTO], meta: { next_cursor: 'c2' } });
    await Promise.resolve();
    http.expectOne(`${BASE}/books?cursor=c2`).flush({ data: [{ ...BOOK_DTO, id: 'b2', can_manage: false }], meta: { next_cursor: null } });
    const books = await result;
    expect(books.map((book) => book.id)).toEqual(['b1', 'b2']);
    expect(books[1].canManage).toBe(false);
  });

  it('creates a household book with a snake_case body', async () => {
    const result = firstValueFrom(api.create({ name: 'Foyer', householdId: 'h1' }));
    const request = http.expectOne(`${BASE}/books`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Foyer', household_id: 'h1' });
    request.flush({ data: BOOK_DTO });
    expect((await result).owner).toEqual({ type: 'household', id: 'h1' });
  });

  it('creates a personal book with currency and timezone', async () => {
    const result = firstValueFrom(api.create({ name: 'Perso', currency: 'EUR', timezone: 'Europe/Paris' }));
    const request = http.expectOne(`${BASE}/books`);
    expect(request.request.body).toEqual({ name: 'Perso', currency: 'EUR', timezone: 'Europe/Paris' });
    request.flush({ data: BOOK_DTO });
    await result;
  });
});
