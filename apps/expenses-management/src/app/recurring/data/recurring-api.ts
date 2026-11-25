import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_CONFIG, handling } from '@shared/http-data-access';
import { Observable, map } from 'rxjs';
import { Page, fetchAll } from '../../households/data/paginate';
import { toRule, toRuleBody, toRulePatchBody } from './mappers';
import { RecurringRule, RecurringRuleDto, RuleInput, RulePatch } from './models';

export const RULE_LIST_CODES = ['book.not_found', 'http.offline'] as const;

export const RULE_WRITE_CODES = [
  'validation.failed',
  'recurring_rule.limit_reached',
  'recurring_rule.not_found',
  'book.not_found',
  'request.throttled',
  'http.offline',
] as const;

@Injectable({ providedIn: 'root' })
export class RecurringApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_CONFIG).baseUrl;

  list(bookId: string): Observable<RecurringRule[]> {
    const context = handling(...RULE_LIST_CODES);
    return fetchAll((cursor) => {
      const params = cursor === null ? new HttpParams() : new HttpParams().set('cursor', cursor);
      return this.http.get<Page<RecurringRuleDto>>(this.url(bookId), { params, context });
    }).pipe(map((items) => items.map(toRule)));
  }

  create(bookId: string, input: RuleInput): Observable<RecurringRule> {
    return this.http
      .post<{ readonly data: RecurringRuleDto }>(this.url(bookId), toRuleBody(input), { context: handling(...RULE_WRITE_CODES) })
      .pipe(map((response) => toRule(response.data)));
  }

  update(bookId: string, id: string, patch: RulePatch): Observable<RecurringRule> {
    return this.http
      .patch<{ readonly data: RecurringRuleDto }>(`${this.url(bookId)}/${encodeURIComponent(id)}`, toRulePatchBody(patch), {
        context: handling(...RULE_WRITE_CODES),
      })
      .pipe(map((response) => toRule(response.data)));
  }

  remove(bookId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.url(bookId)}/${encodeURIComponent(id)}`, { context: handling(...RULE_WRITE_CODES) });
  }

  private url(bookId: string): string {
    return `${this.baseUrl}/books/${encodeURIComponent(bookId)}/recurring-rules`;
  }
}
