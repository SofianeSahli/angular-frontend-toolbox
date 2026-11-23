import { HttpContext, HttpContextToken } from '@angular/common/http';

export const HANDLED_ERROR_CODES = new HttpContextToken<ReadonlySet<string>>(() => new Set());

export function handling(...codes: readonly string[]): HttpContext {
  return new HttpContext().set(HANDLED_ERROR_CODES, new Set(codes));
}
