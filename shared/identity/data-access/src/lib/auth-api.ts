import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_CONFIG } from '@shared/http-data-access';
import { Observable, map } from 'rxjs';
import { Account, AccountDto, DataEnvelope, GoogleSignInRequest, RegisterRequest, Session, SessionDto, toAccount, toSession } from './models';

type Extras = Readonly<Record<string, string>>;

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_CONFIG).baseUrl;

  register(request: RegisterRequest, termsVersion: string, context?: HttpContext): Observable<void> {
    const body = { ...request, terms_version: termsVersion };
    return this.post<null>('auth/email/register', body, context).pipe(map(() => undefined));
  }

  resendEmailCode(email: string, context?: HttpContext): Observable<void> {
    return this.post<null>('auth/email/resend', { email }, context).pipe(map(() => undefined));
  }

  confirmEmail(email: string, code: string, extras: Extras, context?: HttpContext): Observable<Session> {
    return this.session('auth/email/confirm', { email, code, ...extras }, context);
  }

  login(email: string, password: string, extras: Extras, context?: HttpContext): Observable<Session> {
    return this.session('auth/email/login', { email, password, ...extras }, context);
  }

  forgotPassword(email: string, context?: HttpContext): Observable<void> {
    return this.post<null>('auth/password/forgot', { email }, context).pipe(map(() => undefined));
  }

  resetPassword(email: string, code: string, password: string, context?: HttpContext): Observable<void> {
    return this.post<null>('auth/password/reset', { email, code, password }, context).pipe(map(() => undefined));
  }

  google(request: GoogleSignInRequest, extras: Extras, context?: HttpContext): Observable<Session> {
    const body = { id_token: request.idToken, terms_version: request.termsVersion, locale: request.locale, ...extras };
    return this.session('auth/google', body, context);
  }

  confirmTwoFactor(pendingSignIn: string, code: string, context?: HttpContext): Observable<Session> {
    return this.session('auth/two-factor', { pending_sign_in: pendingSignIn, code }, context);
  }

  resendTwoFactor(pendingSignIn: string, context?: HttpContext): Observable<void> {
    return this.post<null>('auth/two-factor/resend', { pending_sign_in: pendingSignIn }, context).pipe(map(() => undefined));
  }

  me(context?: HttpContext): Observable<Account> {
    return this.http.get<DataEnvelope<AccountDto>>(this.url('me'), { context }).pipe(map((response) => toAccount(response.data)));
  }

  logout(context?: HttpContext): Observable<void> {
    return this.post<null>('auth/logout', null, context).pipe(map(() => undefined));
  }

  enableTwoFactor(context?: HttpContext): Observable<void> {
    return this.post<null>('me/two-factor', null, context).pipe(map(() => undefined));
  }

  requestDisableTwoFactorCode(context?: HttpContext): Observable<void> {
    return this.post<null>('me/two-factor/disable-code', null, context).pipe(map(() => undefined));
  }

  disableTwoFactor(code: string, context?: HttpContext): Observable<void> {
    return this.http.delete<null>(this.url('me/two-factor'), { body: { code }, context }).pipe(map(() => undefined));
  }

  private session(path: string, body: object, context?: HttpContext): Observable<Session> {
    return this.post<DataEnvelope<SessionDto>>(path, body, context).pipe(map((response) => toSession(response.data)));
  }

  private post<T>(path: string, body: object | null, context?: HttpContext): Observable<T> {
    return this.http.post<T>(this.url(path), body, { context });
  }

  private url(path: string): string {
    return `${this.baseUrl}/${path}`;
  }
}
