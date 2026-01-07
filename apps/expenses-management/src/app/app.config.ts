import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import {
  AUTH_CONFIG,
  AuthConfig,
  httpErrorInterceptor,
  tokenInterceptor,
} from '@shared/auth';
import { environment } from '../environments/environments';
import { appRoutes } from './app.routes';
export const authProvider = {
  provide: AUTH_CONFIG,
  useValue: {
    apiBaseUrl: environment.apiBaseUrl,
    homeRoute: '/dashboard',
    loginUrl: '/login',
    validateEndpoint: '/auth/validate',
    loginEndpoint: '/auth/login',
    refreshEndpoint: '/auth/refresh',
    checkUsernameEndpoint: '/auth/check-username',
    registerEndpoint: '/auth/register',
    updatePasswordEndpoint: '/auth/update-password',
    profileEndpoint: '/profile',
    profileBaseUrl: 'http://localhost:8000/api/v1',
  } as AuthConfig,
};
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withFetch(),
      withInterceptors([tokenInterceptor, httpErrorInterceptor])
    ),
    provideAnimations(),
    authProvider,
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json',
      }),
      defaultLanguage: 'fr', // ✅ set default
      useDefaultLang: true, // ✅ ensures fallback works
      fallbackLang: 'fr',
    }),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
  ],
};
