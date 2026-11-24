import { InjectionToken } from '@angular/core';

export interface IdentityPaths {
  readonly signIn: string;
  readonly signUp: string;
  readonly emailCode: string;
  readonly twoFactor: string;
  readonly forgotPassword: string;
  readonly resetPassword: string;
  readonly unavailable: string;
  readonly terms: string;
  readonly privacy: string;
}

export interface IdentityConfig {
  readonly termsVersion: string;
  readonly googleClientId?: string;
  readonly afterSignIn: string;
  readonly paths: IdentityPaths;
}

export const IDENTITY_CONFIG = new InjectionToken<IdentityConfig>('IDENTITY_CONFIG');
