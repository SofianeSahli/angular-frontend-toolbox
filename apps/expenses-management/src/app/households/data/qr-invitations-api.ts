import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_CONFIG, handling } from '@shared/http-data-access';
import { Observable, map } from 'rxjs';
import { toHousehold } from './mappers';
import { Household, HouseholdDto } from './models';

export const QR_CREATE_CODES = ['request.throttled', 'household.forbidden', 'household.not_found', 'household.member_limit', 'http.offline'] as const;
export const QR_PREVIEW_CODES = ['invitation.not_found', 'request.throttled', 'validation.failed', 'http.offline'] as const;
export const QR_ACCEPT_CODES = [...QR_PREVIEW_CODES, 'household.already_joined', 'household.member_limit'] as const;

export interface QrInvitation {
  readonly token: string;
  readonly expiresAt: Date;
}

export interface QrInvitationPreview {
  readonly household: { readonly id: string; readonly name: string };
  readonly invitedBy: { readonly name: string };
  readonly expiresAt: Date;
}

interface QrInvitationDto {
  readonly id: string;
  readonly token: string;
  readonly expires_at: string;
}

interface QrInvitationPreviewDto {
  readonly household: { readonly id: string; readonly name: string };
  readonly invited_by: { readonly name: string };
  readonly expires_at: string;
}

interface DataEnvelope<T> {
  readonly data: T;
}

@Injectable({ providedIn: 'root' })
export class QrInvitationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_CONFIG).baseUrl;

  create(householdId: string): Observable<QrInvitation> {
    return this.http
      .post<DataEnvelope<QrInvitationDto>>(`${this.baseUrl}/households/${encodeURIComponent(householdId)}/qr-invitations`, null, {
        context: handling(...QR_CREATE_CODES),
      })
      .pipe(map(({ data }) => ({ token: data.token, expiresAt: new Date(data.expires_at) })));
  }

  preview(token: string): Observable<QrInvitationPreview> {
    return this.http
      .post<DataEnvelope<QrInvitationPreviewDto>>(`${this.baseUrl}/qr-invitations/preview`, { token }, { context: handling(...QR_PREVIEW_CODES) })
      .pipe(
        map(({ data }) => ({
          household: { id: data.household.id, name: data.household.name },
          invitedBy: { name: data.invited_by.name },
          expiresAt: new Date(data.expires_at),
        })),
      );
  }

  accept(token: string): Observable<Household> {
    return this.http
      .post<DataEnvelope<HouseholdDto>>(`${this.baseUrl}/qr-invitations/accept`, { token }, { context: handling(...QR_ACCEPT_CODES) })
      .pipe(map(({ data }) => toHousehold(data)));
  }
}
