import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideTranslateService , } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideAuthConfig } from '@shared/auth';
import { environment } from '@env/environments';
import {  provideFormlyCore } from '@ngx-formly/core';
import { FORMLY_FORM_CONFIG } from '@shared/ui-components';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withFetch()
      //   withInterceptors([tokenInterceptor, httpErrorInterceptor])
    ),
    provideFormlyCore(FORMLY_FORM_CONFIG),
    provideAuthConfig(),
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
