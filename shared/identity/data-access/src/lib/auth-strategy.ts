import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { API_CONFIG, csrfCookieUrl } from '@shared/http-data-access';
import { Observable, map } from 'rxjs';
import { Session } from './models';

export interface AuthStrategy {
  prepare(): Observable<void>;
  signInExtras(): Readonly<Record<string, string>>;
  signedIn(session: Session): void;
  signedOut(): void;
}

export const AUTH_STRATEGY = new InjectionToken<AuthStrategy>('AUTH_STRATEGY');

@Injectable()
export class CookieAuthStrategy implements AuthStrategy {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  prepare(): Observable<void> {
    return this.http.get(csrfCookieUrl(this.config)).pipe(map(() => undefined));
  }

  signInExtras(): Readonly<Record<string, string>> {
    return {};
  }

  signedIn(): void {
    return undefined;
  }

  signedOut(): void {
    return undefined;
  }
}

const NOT_IMPLEMENTED = 'TokenAuthStrategy is not implemented (spec 009: token in secure storage, device_id)';

@Injectable()
export class TokenAuthStrategy implements AuthStrategy {
  prepare(): Observable<void> {
    throw new Error(NOT_IMPLEMENTED);
  }

  signInExtras(): Readonly<Record<string, string>> {
    throw new Error(NOT_IMPLEMENTED);
  }

  signedIn(): void {
    throw new Error(NOT_IMPLEMENTED);
  }

  signedOut(): void {
    throw new Error(NOT_IMPLEMENTED);
  }
}
