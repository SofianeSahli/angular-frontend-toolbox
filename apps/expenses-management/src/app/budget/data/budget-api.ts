import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_CONFIG, handling } from '@shared/http-data-access';
import { Observable, map } from 'rxjs';
import { toBudget, toBudgetBody } from './mappers';
import { Budget, BudgetDto, BudgetInput } from './models';

export const BUDGET_READ_CODES = ['validation.failed', 'book.not_found', 'http.offline'] as const;
export const BUDGET_SAVE_CODES = [...BUDGET_READ_CODES, 'request.throttled'] as const;
export const BUDGET_COPY_CODES = [...BUDGET_SAVE_CODES, 'budget.nothing_to_copy', 'budget.not_empty'] as const;

interface BudgetResponse {
  readonly data: BudgetDto;
}

@Injectable({ providedIn: 'root' })
export class BudgetApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_CONFIG).baseUrl;

  get(bookId: string, month: string, context: HttpContext = handling(...BUDGET_READ_CODES)): Observable<Budget> {
    return this.http
      .get<BudgetResponse>(this.url(bookId, month), { context })
      .pipe(map((response) => toBudget(response.data)));
  }

  save(bookId: string, month: string, input: BudgetInput): Observable<Budget> {
    return this.http
      .put<BudgetResponse>(this.url(bookId, month), toBudgetBody(input), { context: handling(...BUDGET_SAVE_CODES) })
      .pipe(map((response) => toBudget(response.data)));
  }

  copy(bookId: string, month: string, replace: boolean): Observable<Budget> {
    return this.http
      .post<BudgetResponse>(`${this.url(bookId, month)}/copy`, { replace }, { context: handling(...BUDGET_COPY_CODES) })
      .pipe(map((response) => toBudget(response.data)));
  }

  private url(bookId: string, month: string): string {
    return `${this.baseUrl}/books/${encodeURIComponent(bookId)}/budgets/${encodeURIComponent(month)}`;
  }
}
