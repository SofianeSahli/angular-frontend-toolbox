import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_CONFIG } from '@shared/http-data-access';
import { Observable, map } from 'rxjs';
import { toHousehold, toMember } from './mappers';
import { Household, HouseholdDto, Member, MemberDto } from './models';
import { Page, fetchAll } from './paginate';

interface DataEnvelope<T> {
  readonly data: T;
}

@Injectable({ providedIn: 'root' })
export class HouseholdsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_CONFIG).baseUrl;

  list(context?: HttpContext): Observable<Household[]> {
    return fetchAll((cursor) => this.page<HouseholdDto>('households', cursor, context)).pipe(map((items) => items.map(toHousehold)));
  }

  create(name: string, context?: HttpContext): Observable<Household> {
    return this.http.post<DataEnvelope<HouseholdDto>>(this.url('households'), { name }, { context }).pipe(map((response) => toHousehold(response.data)));
  }

  rename(id: string, name: string, context?: HttpContext): Observable<Household> {
    return this.http.patch<DataEnvelope<HouseholdDto>>(this.url(`households/${id}`), { name }, { context }).pipe(map((response) => toHousehold(response.data)));
  }

  remove(id: string, context?: HttpContext): Observable<void> {
    return this.http.delete<null>(this.url(`households/${id}`), { context }).pipe(map(() => undefined));
  }

  members(id: string, context?: HttpContext): Observable<Member[]> {
    return fetchAll((cursor) => this.page<MemberDto>(`households/${id}/members`, cursor, context)).pipe(map((items) => items.map(toMember)));
  }

  removeMember(id: string, userId: string, context?: HttpContext): Observable<void> {
    return this.http.delete<null>(this.url(`households/${id}/members/${userId}`), { context }).pipe(map(() => undefined));
  }

  leave(id: string, context?: HttpContext): Observable<void> {
    return this.http.post<null>(this.url(`households/${id}/leave`), null, { context }).pipe(map(() => undefined));
  }

  private page<T>(path: string, cursor: string | null, context?: HttpContext): Observable<Page<T>> {
    const params = cursor === null ? new HttpParams() : new HttpParams().set('cursor', cursor);
    return this.http.get<Page<T>>(this.url(path), { params, context });
  }

  private url(path: string): string {
    return `${this.baseUrl}/${path}`;
  }
}
