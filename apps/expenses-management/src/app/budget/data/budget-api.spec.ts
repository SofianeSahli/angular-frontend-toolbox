import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG, HANDLED_ERROR_CODES } from '@shared/http-data-access';
import { firstValueFrom } from 'rxjs';
import { NO_PLAN_DTO, budgetDto } from '../testing';
import { BudgetApi } from './budget-api';

const BASE = 'http://api.test/api/v1';
const MONTH = `${BASE}/books/b1/budgets/2026-11`;

describe('BudgetApi (spec 008 REQ-5.6, 5.7, 5.9, 8.10)', () => {
  let api: BudgetApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: API_CONFIG, useValue: { baseUrl: BASE } }, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(BudgetApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the month and maps it to camelCase', async () => {
    const result = firstValueFrom(api.get('b1', '2026-11'));
    const request = http.expectOne(MONTH);
    expect(request.request.method).toBe('GET');
    expect([...request.request.context.get(HANDLED_ERROR_CODES)]).toEqual(['validation.failed', 'book.not_found', 'http.offline']);
    request.flush({ data: budgetDto() });
    const budget = await result;
    expect(budget).toMatchObject({ month: '2026-11', hasPlan: true, daysLeft: 6, expenses: { offPlan: 12500, remaining: 47500 } });
    expect(budget.lines[3]).toEqual({ category: 'entertainment.outings', planned: 0, actual: 100000, percent: null, status: 'over', retired: false });
  });

  it('keeps the nulls of a month without a plan', async () => {
    const result = firstValueFrom(api.get('b1', '2026-11'));
    http.expectOne(MONTH).flush({ data: NO_PLAN_DTO });
    const budget = await result;
    expect(budget.hasPlan).toBe(false);
    expect(budget.income.expected).toBeNull();
    expect(budget.saving.planned).toBeNull();
    expect(budget.expenses).toEqual({ planned: null, actual: 912500, offPlan: null, remaining: null });
    expect(budget.lines).toEqual([]);
  });

  it('saves the whole month in snake_case', async () => {
    const result = firstValueFrom(api.save('b1', '2026-11', { expectedIncome: 2500000, plannedSaving: null, lines: [{ category: 'food', planned: 0 }] }));
    const request = http.expectOne(MONTH);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ expected_income: 2500000, planned_saving: null, lines: [{ category: 'food', planned: 0 }] });
    expect(request.request.context.get(HANDLED_ERROR_CODES).has('request.throttled')).toBe(true);
    request.flush({ data: budgetDto() });
    expect((await result).hasPlan).toBe(true);
  });

  it('sends an empty plan as lines only, with nulls', () => {
    void firstValueFrom(api.save('b1', '2026-11', { expectedIncome: null, plannedSaving: null, lines: [] }));
    const request = http.expectOne(MONTH);
    expect(request.request.body).toEqual({ expected_income: null, planned_saving: null, lines: [] });
    request.flush({ data: NO_PLAN_DTO });
  });

  it('copies the previous month, with replace and both 409 codes handled', async () => {
    const result = firstValueFrom(api.copy('b1', '2026-11', true));
    const request = http.expectOne(`${MONTH}/copy`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ replace: true });
    const codes = request.request.context.get(HANDLED_ERROR_CODES);
    for (const code of ['budget.not_empty', 'budget.nothing_to_copy', 'request.throttled', 'book.not_found', 'http.offline', 'validation.failed']) {
      expect(codes.has(code)).toBe(true);
    }
    request.flush({ data: budgetDto() });
    expect((await result).month).toBe('2026-11');
  });
});
