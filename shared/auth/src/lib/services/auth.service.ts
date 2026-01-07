import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  filter,
  map,
  of,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import { AUTH_CONFIG } from './auth.config';
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  authData?: {
    username: string,
    account_recuperation_email: string,
    email_verified: string,
    use_double_auth_email: string,
    use_double_auth_sms: string,
    phone_number: string,
    phone_verified: string,
    use_double_auth_app: string
  }
}
export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isRefreshing = false;
  private readonly refreshTokenSubject = new BehaviorSubject<string | null>(
    null
  );
  readonly http = inject(HttpClient);
  readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private config = inject(AUTH_CONFIG);

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(
        `${this.config.apiBaseUrl}${this.config.loginEndpoint ?? '/login'}`,
        { username, password }
      )
      .pipe(
        tap((tokens) => {
          this.storeTokens(tokens);
        })
      );
  }

  private storeTokens(tokens: LoginResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    }
  }

  getAccessToken(): string | null {
    return isPlatformBrowser(this.platformId)
      ? localStorage.getItem(ACCESS_TOKEN_KEY)
      : null;
  }

  getRefreshToken(): string | null {
    return isPlatformBrowser(this.platformId)
      ? localStorage.getItem(REFRESH_TOKEN_KEY)
      : null;
  }

  clearTokens(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  logout(): Observable<void> {
    this.clearTokens();
    this.router.navigate([this.config.loginUrl ?? '/'], {
      queryParams: { sessionExpired: true },
    });
    return this.http.get<void>(this.config.logoutEndpoint ?? 'logout')
  }

  refreshAccessToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap(() => {
          const newAccess = this.getAccessToken();
          const newRefresh = this.getRefreshToken();
          if (newAccess && newRefresh) {
            return of({ access_token: newAccess, refresh_token: newRefresh });
          }
          return throwError(() => new Error('Token refresh failed'));
        })
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);
    return this.http
      .post<LoginResponse>(
        `${this.config.apiBaseUrl}${this.config.refreshEndpoint ?? '/refresh'}`,
        {
          refresh_token: refreshToken,
        }
      )
      .pipe(
        tap((tokens) => {
          if (!tokens.access_token || !tokens.refresh_token) {
            throw new Error('Invalid tokens from server');
          }
          this.storeTokens(tokens);
          this.refreshTokenSubject.next(tokens.refresh_token);
        }),
        catchError((err) => {
          this.clearTokens();
          this.refreshTokenSubject.next(null);
          return throwError(() => err);
        }),
        tap({
          next: () => (this.isRefreshing = false),
          error: () => (this.isRefreshing = false),
          complete: () => (this.isRefreshing = false),
        })
      );
  }

  validateToken(): Observable<boolean> {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return of(false);
    }

    if (!accessToken) {
      // If no access token, attempt refresh
      return this.refreshAccessToken().pipe(
        map(() => true),
        catchError(() => {
          this.clearTokens();
          return of(false);
        })
      );
    }

    // Access token exists, validate it
    return this.http
      .get<{ valid: boolean }>(
        `${this.config.apiBaseUrl}${this.config.validateEndpoint ?? '/refresh'
        }`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      .pipe(
        map(() => true),
        catchError(() => {
          // Invalid or expired token
          this.clearTokens();
          return of(false);
        })
      );
  }

  register(profileData: {
    username: string;
    password: string;
    password_confirmation: string;
  }): Observable<string> {
    return this.http.post(
      `${this.config.apiBaseUrl}${this.config.registerEndpoint ?? '/register'}`,
      profileData,
      {
        responseType: 'text',
      }
    ) as Observable<string>;
  }

  checkUsername(
    username: string
  ): Observable<{ available: boolean; suggestions?: string[] }> {
    if (!username || username.trim().length < 3) {
      return of({ available: false, suggestions: [] });
    }

    return this.http.get<{ available: boolean; suggestions?: string[] }>(
      `${this.config.apiBaseUrl}${this.config.checkUsernameEndpoint ?? '/check-username'
      }?username=${encodeURIComponent(username)}`
    );
  }

  updatePassword(oldPassword: string, newPassword: string) {
    return this.http.post(
      `${this.config.apiBaseUrl}${this.config.updatePasswordEndpoint ?? '/update-password'
      }
      `,
      {
        oldPassword,
        newPassword,
      }
    );
  }

  resetPasswordRequest(accountId: string) {
    return this.http.get(
      `${this.config.apiBaseUrl}${this.config.requestResetPassword ?? '/auth/send-reset-password-mail/' + accountId
      }
      `,
    );
  }

  resetPassword(body: {
    password: string,
    token: string
  }) {
    return this.http.post(
      `${this.config.apiBaseUrl}${this.config.resetPassword ?? '/auth/reset-password/'
      }
      `, body
    );
  }
}
