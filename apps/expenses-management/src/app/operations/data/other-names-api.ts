import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_CONFIG, handling } from '@shared/http-data-access';
import { Observable, map } from 'rxjs';

export const OTHER_NAMES_HANDLED_CODES = [
  'validation.failed',
  'book.not_found',
  'request.throttled',
  'http.offline',
  'server.error',
  'server.unavailable',
] as const;

@Injectable({ providedIn: 'root' })
export class OtherNamesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_CONFIG).baseUrl;

  list(bookId: string, leaf: string): Observable<readonly string[]> {
    return this.http
      .get<{ readonly data: readonly string[] }>(`${this.baseUrl}/books/${encodeURIComponent(bookId)}/other-names`, {
        params: new HttpParams().set('category', leaf),
        context: handling(...OTHER_NAMES_HANDLED_CODES),
      })
      .pipe(map((response) => response.data));
  }
}
