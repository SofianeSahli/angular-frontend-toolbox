import { InjectionToken, Signal } from '@angular/core';

export interface IdentityLanguageOption {
  readonly value: string;
  readonly label: string;
}

export interface IdentityPreferences {
  readonly languages: readonly IdentityLanguageOption[];
  readonly language: Signal<string>;
  useLanguage(value: string): void;
}

export const IDENTITY_PREFERENCES = new InjectionToken<IdentityPreferences>('IDENTITY_PREFERENCES');
