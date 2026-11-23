import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  readonly baseUrl: string;
}

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG');

const CSRF_COOKIE_PATH = '/sanctum/csrf-cookie';

export function csrfCookieUrl(config: ApiConfig): string {
  return `${new URL(config.baseUrl).origin}${CSRF_COOKIE_PATH}`;
}

export function isApiRequest(url: string, config: ApiConfig): boolean {
  return url.startsWith(config.baseUrl) || url === csrfCookieUrl(config);
}
