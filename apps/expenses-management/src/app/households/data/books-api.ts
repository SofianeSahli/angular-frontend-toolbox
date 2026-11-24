import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_CONFIG } from '@shared/http-data-access';
import { Observable, map } from 'rxjs';
import { toBook, toNewBookBody } from './mappers';
import { Book, BookDto, NewBook } from './models';
import { Page, fetchAll } from './paginate';

@Injectable({ providedIn: 'root' })
export class BooksApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_CONFIG).baseUrl;

  list(context?: HttpContext): Observable<Book[]> {
    return fetchAll((cursor) => {
      const params = cursor === null ? new HttpParams() : new HttpParams().set('cursor', cursor);
      return this.http.get<Page<BookDto>>(`${this.baseUrl}/books`, { params, context });
    }).pipe(map((items) => items.map(toBook)));
  }

  create(input: NewBook, context?: HttpContext): Observable<Book> {
    return this.http.post<{ readonly data: BookDto }>(`${this.baseUrl}/books`, toNewBookBody(input), { context }).pipe(map((response) => toBook(response.data)));
  }
}
