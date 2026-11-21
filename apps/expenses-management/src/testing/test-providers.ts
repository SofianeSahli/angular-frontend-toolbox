import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { provideTranslateService } from '@ngx-translate/core';
import { AUTH_CONFIG, AuthConfig } from '@shared/auth';

/** Test-only: the providers the app's components expect, with HTTP faked. */
export function appTestProviders(): Array<Provider | EnvironmentProviders> {
  return [
    provideHttpClient(),
    provideHttpClientTesting(),
    provideRouter([]),
    provideTranslateService(),
    provideNoopAnimations(),
    NgbActiveModal,
    {
      provide: AUTH_CONFIG,
      useValue: { apiBaseUrl: '/api', homeRoute: '/dashboard', loginUrl: '/' } satisfies AuthConfig,
    },
  ];
}
