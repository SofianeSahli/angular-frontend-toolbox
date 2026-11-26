import { TestBed } from '@angular/core/testing';
import { HANDLED_ERROR_CODES } from '@shared/http-data-access';
import { HttpContext } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { NO_PLAN, budget } from '../testing';
import { BudgetApi } from './budget-api';
import { BudgetPlans } from './budget-plans';
import { Budget } from './models';

const flush = () => new Promise((resolve) => setTimeout(resolve));

function setup() {
  const api = {
    get: vi.fn<(bookId: string, month: string, context?: HttpContext) => Observable<Budget>>((_book, month) =>
      month === '2027-01' ? of(NO_PLAN) : month === '2027-02' ? throwError(() => new Error('offline')) : of(budget()),
    ),
  };
  TestBed.configureTestingModule({ providers: [{ provide: BudgetApi, useValue: api }] });
  return { api, plans: TestBed.inject(BudgetPlans) };
}

describe('BudgetPlans (spec 009 REQ-9.2)', () => {
  it('learns which future months have a plan with quiet reads, leaving failures unknown', async () => {
    const { api, plans } = setup();
    plans.load('b1', ['2026-12', '2027-01', '2027-02']);
    await flush();
    expect(plans.plans()).toEqual({ '2026-12': true, '2027-01': false });
    expect(api.get.mock.calls[0][2]?.get(HANDLED_ERROR_CODES).has('http.500')).toBe(true);
  });

  it('reads each month once per book and starts over for another book', async () => {
    const { api, plans } = setup();
    plans.load('b1', ['2026-12']);
    plans.load('b1', ['2026-12']);
    await flush();
    plans.load('b1', ['2026-12']);
    expect(api.get).toHaveBeenCalledTimes(1);
    plans.load('b2', ['2026-12']);
    expect(plans.plans()).toEqual({});
    await flush();
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('takes a saved or copied plan into account at once', () => {
    const { plans } = setup();
    plans.load('b1', []);
    plans.set('b1', '2027-03', true);
    plans.set('b2', '2027-04', true);
    expect(plans.plans()).toEqual({ '2027-03': true });
  });
});
