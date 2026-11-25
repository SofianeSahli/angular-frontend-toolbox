import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_CONFIG, handling } from '@shared/http-data-access';
import { Observable, map } from 'rxjs';
import { toEntry, toEntryBody, toFilterParams, toPatchBody } from './mappers';
import { Entry, EntryDto, EntryFilters, EntryInput, EntryPage, EntryPatch } from './models';

export const LIST_HANDLED_CODES = ['validation.failed'] as const;

export const WRITE_HANDLED_CODES = [
  'validation.failed',
  'book.not_found',
  'transaction.not_found',
  'transaction.id_conflict',
  'request.throttled',
  'http.offline',
] as const;

interface EntryListDto {
  readonly data: readonly EntryDto[];
  readonly meta: { readonly next_cursor: string | null };
}

@Injectable({ providedIn: 'root' })
export class EntriesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_CONFIG).baseUrl;

  page(bookId: string, filters: EntryFilters, cursor: string | null = null): Observable<EntryPage> {
    return this.http
      .get<EntryListDto>(this.url(bookId), {
        params: toFilterParams(filters, cursor),
        context: handling(...LIST_HANDLED_CODES),
      })
      .pipe(
        map((page) => ({
          items: page.data.map(toEntry),
          nextCursor: page.meta.next_cursor,
        })),
      );
  }

  create(bookId: string, input: EntryInput): Observable<Entry> {
    return this.http
      .post<{ readonly data: EntryDto }>(this.url(bookId), toEntryBody(input), {
        context: handling(...WRITE_HANDLED_CODES),
      })
      .pipe(map((response) => toEntry(response.data)));
  }

  update(bookId: string, id: string, patch: EntryPatch): Observable<Entry> {
    return this.http
      .patch<{ readonly data: EntryDto }>(`${this.url(bookId)}/${id}`, toPatchBody(patch), { context: handling(...WRITE_HANDLED_CODES) })
      .pipe(map((response) => toEntry(response.data)));
  }

  remove(bookId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.url(bookId)}/${id}`, {
      context: handling(...WRITE_HANDLED_CODES),
    });
  }

  private url(bookId: string): string {
    return `${this.baseUrl}/books/${encodeURIComponent(bookId)}/transactions`;
  }
}
