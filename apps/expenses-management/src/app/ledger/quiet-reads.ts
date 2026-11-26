import { HttpContext } from '@angular/common/http';
import { handling } from '@shared/http-data-access';

export const QUIET_READ_CODES = [
  'http.offline',
  'http.403',
  'http.404',
  'http.429',
  'http.500',
  'http.502',
  'http.503',
  'http.504',
  'validation.failed',
  'book.not_found',
  'household.not_found',
  'household.forbidden',
  'request.throttled',
] as const;

export function quietReads(): HttpContext {
  return handling(...QUIET_READ_CODES);
}
