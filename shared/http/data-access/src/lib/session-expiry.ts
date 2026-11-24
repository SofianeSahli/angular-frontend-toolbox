import { InjectionToken } from '@angular/core';

export interface SessionExpiry {
  isSignedIn(): boolean;
  expire(): void;
  signInUrl(returnUrl: string): string;
}

export const SESSION_EXPIRY = new InjectionToken<SessionExpiry>('SESSION_EXPIRY');
