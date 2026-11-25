import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_CONFIG, handling } from '@shared/http-data-access';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { toTop } from './mappers';
import { CategoryTree, TopDto } from './models';

export type TreeAnswer = CategoryTree | 'notModified';

const NOT_MODIFIED = 304;

function isNotModified(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === NOT_MODIFIED;
}

@Injectable({ providedIn: 'root' })
export class CategoriesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_CONFIG).baseUrl;

  tree(etag?: string | null): Observable<TreeAnswer> {
    const headers = etag ? new HttpHeaders({ 'If-None-Match': etag }) : new HttpHeaders();
    return this.http
      .get<{ readonly data: readonly TopDto[] }>(`${this.baseUrl}/categories`, {
        headers,
        observe: 'response',
        context: handling('http.offline', 'http.304'),
      })
      .pipe(
        map(
          (response): TreeAnswer => ({
            tops: (response.body?.data ?? []).map(toTop),
            etag: response.headers.get('ETag'),
          }),
        ),
        catchError((error: unknown) => (isNotModified(error) ? of<TreeAnswer>('notModified') : throwError(() => error))),
      );
  }
}
