import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG, HANDLED_ERROR_CODES } from '@shared/http-data-access';
import { firstValueFrom } from 'rxjs';
import { NOVEMBER, entryDto } from '../testing';
import { EntriesApi, WRITE_HANDLED_CODES } from './entries-api';
import { OtherNamesApi } from './other-names-api';

const BASE = 'http://api.test/api/v1';
const LIST = `${BASE}/books/b1/transactions`;

describe('EntriesApi and OtherNamesApi (REQ-4.8, 6.2, 8.3)', () => {
  let api: EntriesApi;
  let names: OtherNamesApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: API_CONFIG, useValue: { baseUrl: BASE } }, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(EntriesApi);
    names = TestBed.inject(OtherNamesApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists a page with the month only when no other filter is set', async () => {
    const result = firstValueFrom(api.page('b1', NOVEMBER));
    const request = http.expectOne((r) => r.url === LIST);
    expect(request.request.params.keys()).toEqual(['from', 'to']);
    expect([...request.request.context.get(HANDLED_ERROR_CODES)]).toEqual(['validation.failed']);
    request.flush({
      data: [
        entryDto('e1', {
          other_name: 'Épicerie',
          created_by: { id: 'u2', name: 'Sami' },
        }),
      ],
      meta: { next_cursor: 'c2' },
    });
    const page = await result;
    expect(page.nextCursor).toBe('c2');
    expect(page.items[0]).toMatchObject({
      id: 'e1',
      otherName: 'Épicerie',
      createdBy: { id: 'u2', name: 'Sami' },
    });
    expect(page.items[0].createdAt).toBeInstanceOf(Date);
  });

  it('sends every set filter and the cursor', () => {
    void firstValueFrom(api.page('b1', { ...NOVEMBER, type: 'income', category: 'salary', author: 'u2' }, 'c2'));
    const request = http.expectOne((r) => r.url === LIST);
    expect(request.request.params.toString()).toBe('from=2026-11-01&to=2026-11-30&type=income&category=salary&author=u2&cursor=c2');
    request.flush({ data: [], meta: { next_cursor: null } });
  });

  it('creates with the client id in snake_case, leaving out empty fields', async () => {
    const result = firstValueFrom(
      api.create('b1', {
        id: 'x1',
        amount: 1500,
        date: '2026-11-25',
        category: 'food.groceries.other',
        otherName: 'Marché',
        comment: null,
      }),
    );
    const request = http.expectOne(LIST);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      id: 'x1',
      amount: 1500,
      date: '2026-11-25',
      category: 'food.groceries.other',
      other_name: 'Marché',
    });
    expect([...request.request.context.get(HANDLED_ERROR_CODES)]).toEqual([...WRITE_HANDLED_CODES]);
    request.flush({ data: entryDto('x1') }, { status: 201, statusText: 'Created' });
    expect((await result).id).toBe('x1');
  });

  it('patches only the given fields, sending a null comment', () => {
    void firstValueFrom(api.update('b1', 'e1', { amount: 13250, comment: null }));
    const request = http.expectOne(`${LIST}/e1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ amount: 13250, comment: null });
    request.flush({ data: entryDto('e1') });
  });

  it('deletes', async () => {
    const result = firstValueFrom(api.remove('b1', 'e1'), {
      defaultValue: undefined,
    });
    const request = http.expectOne(`${LIST}/e1`);
    expect(request.request.method).toBe('DELETE');
    expect([...request.request.context.get(HANDLED_ERROR_CODES)]).toContain('transaction.not_found');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await result;
  });

  it('gets the other names of a leaf, silently', async () => {
    const result = firstValueFrom(names.list('b1', 'food.groceries.other'));
    const request = http.expectOne((r) => r.url === `${BASE}/books/b1/other-names`);
    expect(request.request.params.get('category')).toBe('food.groceries.other');
    expect([...request.request.context.get(HANDLED_ERROR_CODES)]).toEqual(expect.arrayContaining(['http.offline', 'server.error']));
    request.flush({ data: ['Épicerie du coin', 'Marché'] });
    expect(await result).toEqual(['Épicerie du coin', 'Marché']);
  });
});
