import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_CONFIG, handling } from '@shared/http-data-access';
import { Observable, defer, firstValueFrom, map } from 'rxjs';
import { toEntry, toEntryBody, toFilterParams, toPatchBody } from './mappers';
import { Entry, EntryCollection, EntryDto, EntryFilters, EntryInput, EntryPage, EntryPatch } from './models';

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

  collect(
    bookId: string,
    filters: EntryFilters,
    limits: { readonly maxPages: number; readonly maxItems?: number },
    context: HttpContext = handling(...LIST_HANDLED_CODES),
  ): Observable<EntryCollection> {
    return defer(async () => {
      const items: Entry[] = [];
      let cursor: string | null = null;
      for (let page = 0; page < limits.maxPages; page++) {
        const answer: EntryListDto = await firstValueFrom(this.http.get<EntryListDto>(this.url(bookId), { params: toFilterParams(filters, cursor), context }));
        items.push(...answer.data.map(toEntry));
        cursor = answer.meta.next_cursor;
        if (cursor === null) return { items, complete: true };
        if (limits.maxItems !== undefined && items.length >= limits.maxItems) return { items: items.slice(0, limits.maxItems), complete: false };
      }
      return { items, complete: false };
    });
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
