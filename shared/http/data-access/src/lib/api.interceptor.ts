import { HttpErrorResponse, HttpEvent, HttpEventType, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { Observable, catchError, filter, switchMap, throwError } from 'rxjs';
import { API_CONFIG, ApiConfig, csrfCookieUrl, isApiRequest } from './api-config';
import { toApiError } from './api-error';
import { ErrorBus } from './error-bus';
import { HANDLED_ERROR_CODES } from './handled-errors';

const XSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_MISMATCH_STATUS = 419;

function readCookie(document: Document, name: string): string | null {
  const prefix = `${name}=`;
  const cookie = document.cookie.split('; ').find((entry) => entry.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

class ApiRequestSender {
  lastRequestId = '';

  constructor(
    private readonly next: HttpHandlerFn,
    private readonly document: Document,
  ) {}

  send(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    this.lastRequestId = crypto.randomUUID();
    const xsrfToken = readCookie(this.document, XSRF_COOKIE);
    return this.next(
      request.clone({
        withCredentials: true,
        setHeaders: {
          Accept: 'application/json',
          'X-Request-Id': this.lastRequestId,
          ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
        },
      }),
    );
  }
}

function isCsrfMismatch(failure: unknown, request: HttpRequest<unknown>, config: ApiConfig): boolean {
  return failure instanceof HttpErrorResponse && failure.status === CSRF_MISMATCH_STATUS && request.url !== csrfCookieUrl(config);
}

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(API_CONFIG, { optional: true });
  if (!config || !isApiRequest(request.url, config)) return next(request);

  const bus = inject(ErrorBus);
  const sender = new ApiRequestSender(next, inject(DOCUMENT));

  const fail = (failure: unknown) => {
    if (!(failure instanceof HttpErrorResponse)) return throwError(() => failure);
    const error = toApiError(failure, sender.lastRequestId);
    if (error.kind !== 'validation' && !request.context.get(HANDLED_ERROR_CODES).has(error.code)) bus.publish(error);
    return throwError(() => error);
  };

  return sender.send(request).pipe(
    catchError((failure: unknown) => {
      if (!isCsrfMismatch(failure, request, config)) return fail(failure);
      return sender.send(new HttpRequest('GET', csrfCookieUrl(config))).pipe(
        filter((event) => event.type === HttpEventType.Response),
        switchMap(() => sender.send(request)),
        catchError(fail),
      );
    }),
  );
};
