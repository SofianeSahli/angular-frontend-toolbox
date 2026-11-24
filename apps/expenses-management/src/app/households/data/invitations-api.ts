import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_CONFIG } from '@shared/http-data-access';
import { Observable, map } from 'rxjs';
import { toHousehold, toInvitation, toReceivedInvitation } from './mappers';
import { Household, HouseholdDto, Invitation, InvitationDto, ReceivedInvitation, ReceivedInvitationDto } from './models';
import { Page, fetchAll } from './paginate';

interface DataEnvelope<T> {
  readonly data: T;
}

@Injectable({ providedIn: 'root' })
export class InvitationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_CONFIG).baseUrl;

  sent(householdId: string, context?: HttpContext): Observable<Invitation[]> {
    return fetchAll((cursor) => this.page<InvitationDto>(`households/${householdId}/invitations`, cursor, context)).pipe(map((items) => items.map(toInvitation)));
  }

  invite(householdId: string, email: string, context?: HttpContext): Observable<Invitation> {
    return this.http
      .post<DataEnvelope<InvitationDto>>(this.url(`households/${householdId}/invitations`), { email }, { context })
      .pipe(map((response) => toInvitation(response.data)));
  }

  cancel(householdId: string, invitationId: string, context?: HttpContext): Observable<void> {
    return this.http.delete<null>(this.url(`households/${householdId}/invitations/${invitationId}`), { context }).pipe(map(() => undefined));
  }

  received(context?: HttpContext): Observable<ReceivedInvitation[]> {
    return fetchAll((cursor) => this.page<ReceivedInvitationDto>('invitations', cursor, context)).pipe(map((items) => items.map(toReceivedInvitation)));
  }

  accept(invitationId: string, context?: HttpContext): Observable<Household> {
    return this.http.post<DataEnvelope<HouseholdDto>>(this.url(`invitations/${invitationId}/accept`), null, { context }).pipe(map((response) => toHousehold(response.data)));
  }

  decline(invitationId: string, context?: HttpContext): Observable<void> {
    return this.http.post<null>(this.url(`invitations/${invitationId}/decline`), null, { context }).pipe(map(() => undefined));
  }

  private page<T>(path: string, cursor: string | null, context?: HttpContext): Observable<Page<T>> {
    const params = cursor === null ? new HttpParams() : new HttpParams().set('cursor', cursor);
    return this.http.get<Page<T>>(this.url(path), { params, context });
  }

  private url(path: string): string {
    return `${this.baseUrl}/${path}`;
  }
}
