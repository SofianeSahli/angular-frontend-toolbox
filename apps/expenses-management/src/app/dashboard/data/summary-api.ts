import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_CONFIG, handling } from '@shared/http-data-access';
import { Observable, map } from 'rxjs';
import { toPeriodParams, toSummary } from './mappers';
import { Summary, SummaryDto, SummaryPeriod } from './models';

export const SUMMARY_CODES = ['validation.failed', 'book.not_found', 'http.offline'] as const;

@Injectable({ providedIn: 'root' })
export class SummaryApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_CONFIG).baseUrl;

  get(bookId: string, period: SummaryPeriod, context: HttpContext = handling(...SUMMARY_CODES)): Observable<Summary> {
    return this.http
      .get<{ readonly data: SummaryDto }>(`${this.baseUrl}/books/${encodeURIComponent(bookId)}/summary`, {
        params: toPeriodParams(period),
        context,
      })
      .pipe(map((response) => toSummary(response.data)));
  }
}
