import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG, HANDLED_ERROR_CODES } from '@shared/http-data-access';
import { firstValueFrom } from 'rxjs';
import { ruleDto } from '../testing';
import { RecurringApi } from './recurring-api';

const BASE = 'http://api.test/api/v1';
const LIST = `${BASE}/books/b1/recurring-rules`;

describe('RecurringApi (spec 008 REQ-6.1, 6.5)', () => {
  let api: RecurringApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: API_CONFIG, useValue: { baseUrl: BASE } }, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(RecurringApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('follows every page and maps the rules', async () => {
    const result = firstValueFrom(api.list('b1'));
    const first = http.expectOne((r) => r.url === LIST && !r.params.has('cursor'));
    expect([...first.request.context.get(HANDLED_ERROR_CODES)]).toEqual(['book.not_found', 'http.offline']);
    first.flush({ data: [ruleDto('r1', { other_name: 'Garage' })], meta: { next_cursor: 'c2' } });
    http.expectOne((r) => r.url === LIST && r.params.get('cursor') === 'c2').flush({ data: [ruleDto('r2', { next_date: null })], meta: { next_cursor: null } });
    const rules = await result;
    expect(rules.map((rule) => rule.id)).toEqual(['r1', 'r2']);
    expect(rules[0]).toMatchObject({ otherName: 'Garage', startsOn: '2026-01-31', endsOn: null, nextDate: '2026-11-30', createdBy: { name: 'Moi' } });
    expect(rules[1].nextDate).toBeNull();
  });

  it('creates with ends_on null and leaves out empty other name and comment', async () => {
    const result = firstValueFrom(
      api.create('b1', {
        amount: 850000,
        category: 'home.housing.rent',
        otherName: null,
        comment: null,
        frequency: 'monthly',
        interval: 1,
        startsOn: '2026-12-01',
        endsOn: null,
      }),
    );
    const request = http.expectOne(LIST);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      amount: 850000,
      category: 'home.housing.rent',
      frequency: 'monthly',
      interval: 1,
      starts_on: '2026-12-01',
      ends_on: null,
    });
    const codes = request.request.context.get(HANDLED_ERROR_CODES);
    for (const code of ['validation.failed', 'recurring_rule.limit_reached', 'recurring_rule.not_found', 'book.not_found', 'request.throttled', 'http.offline']) {
      expect(codes.has(code)).toBe(true);
    }
    request.flush({ data: ruleDto('r1') }, { status: 201, statusText: 'Created' });
    expect((await result).id).toBe('r1');
  });

  it('patches only the given fields, ends_on null removing the end', () => {
    void firstValueFrom(api.update('b1', 'r1', { amount: 900000, endsOn: null, otherName: 'Garage' }));
    const request = http.expectOne(`${LIST}/r1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ amount: 900000, other_name: 'Garage', ends_on: null });
    request.flush({ data: ruleDto('r1') });
  });

  it('deletes a rule', async () => {
    const result = firstValueFrom(api.remove('b1', 'r1'), { defaultValue: undefined });
    const request = http.expectOne(`${LIST}/r1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await expect(result).resolves.toBeNull();
  });
});
