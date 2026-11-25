import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG, HANDLED_ERROR_CODES } from '@shared/http-data-access';
import { firstValueFrom } from 'rxjs';
import { summaryDto } from '../testing';
import { SummaryApi } from './summary-api';

const BASE = 'http://api.test/api/v1';
const URL = `${BASE}/books/b1/summary`;

describe('SummaryApi (spec 008 REQ-3.3, 3.4, 4.2)', () => {
  let api: SummaryApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: API_CONFIG, useValue: { baseUrl: BASE } }, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(SummaryApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks for a month and maps categories and members', async () => {
    const result = firstValueFrom(api.get('b1', { month: '2026-11' }));
    const request = http.expectOne((r) => r.url === URL);
    expect(request.request.params.toString()).toBe('month=2026-11');
    expect([...request.request.context.get(HANDLED_ERROR_CODES)]).toEqual(['validation.failed', 'book.not_found', 'http.offline']);
    request.flush({
      data: {
        ...summaryDto(),
        days: [{ date: '2026-11-03', income: 0, expense: 250000, saving: 0, balance: -250000, entries: 2 }],
        months: [{ month: '2026-11', income: 2500000, expense: 1000000, saving: 0, balance: 1500000, entries: 6 }],
      },
    });
    const summary = await result;
    expect(summary.totals.expense).toBe(1000000);
    expect(summary.categories[1]).toMatchObject({ category: 'food', type: 'expense', total: 600000 });
    expect(summary.categories[1].children[0].category).toBe('food.groceries');
    expect(summary.members.map((member) => member.account.name)).toEqual(['Moi', 'Sami']);
    expect(summary.days).toEqual([{ date: '2026-11-03', income: 0, expense: 250000, saving: 0, balance: -250000, entries: 2 }]);
    expect(summary.months[0]).toMatchObject({ month: '2026-11', expense: 1000000, entries: 6 });
  });

  it('keeps empty day and month lists when the answer has none', async () => {
    const result = firstValueFrom(api.get('b1', { month: '2026-12' }));
    http.expectOne((r) => r.url === URL).flush({ data: { ...summaryDto(), days: [], months: [] } });
    const summary = await result;
    expect(summary.days).toEqual([]);
    expect(summary.months).toEqual([]);
  });

  it('asks for a range with from and to', () => {
    void firstValueFrom(api.get('b1', { from: '2026-10-01', to: '2026-10-25' }));
    const request = http.expectOne((r) => r.url === URL);
    expect(request.request.params.toString()).toBe('from=2026-10-01&to=2026-10-25');
    request.flush({ data: summaryDto() });
  });
});
