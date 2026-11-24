import { HttpErrorResponse } from '@angular/common/http';

export type ApiErrorKind = 'validation' | 'unauthenticated' | 'forbidden' | 'not-found' | 'conflict' | 'csrf' | 'throttled' | 'server' | 'offline';

export type ApiFieldErrors = Readonly<Record<string, readonly string[]>>;

const KIND_BY_STATUS: Readonly<Record<number, ApiErrorKind>> = {
  0: 'offline',
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'not-found',
  409: 'conflict',
  419: 'csrf',
  422: 'validation',
  429: 'throttled',
};

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    readonly status: number,
    readonly code: string,
    readonly fields: ApiFieldErrors,
    readonly retryAfterSeconds: number | null,
    readonly requestId: string,
  ) {
    super(`${status} ${code}`);
    this.name = 'ApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fieldErrorsOf(value: unknown): ApiFieldErrors {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, unknown[]] => Array.isArray(entry[1]))
      .map(([field, codes]) => [field, codes.filter((code): code is string => typeof code === 'string')]),
  );
}

function retryAfterOf(envelope: Record<string, unknown> | null, response: HttpErrorResponse): number | null {
  const fromBody = envelope?.['retry_after_seconds'];
  if (typeof fromBody === 'number') return fromBody;
  const fromHeader = Number.parseInt(response.headers?.get('Retry-After') ?? '', 10);
  return Number.isNaN(fromHeader) ? null : fromHeader;
}

export function toApiError(response: HttpErrorResponse, sentRequestId: string): ApiError {
  const status = response.status;
  const envelope = isRecord(response.error) && isRecord(response.error['error']) ? response.error['error'] : null;
  const code = typeof envelope?.['code'] === 'string' ? envelope['code'] : status === 0 ? 'http.offline' : `http.${status}`;
  const kind = KIND_BY_STATUS[status] ?? 'server';
  const requestId = response.headers?.get('X-Request-Id') ?? sentRequestId;
  return new ApiError(kind, status, code, fieldErrorsOf(envelope?.['fields']), retryAfterOf(envelope, response), requestId);
}
