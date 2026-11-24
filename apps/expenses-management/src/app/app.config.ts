import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { SHELL_ICONS } from '@expenses/shell';
import { provideApi } from '@shared/http-data-access';
import { SessionStore, provideIdentity } from '@shared/identity-data-access';
import { olivierTheme } from '@shared/theme-olivier';
import { provideIcons } from '@shared/ui-atoms';
import { provideUi } from '@shared/ui-tokens';
import { environment } from '../environments/environment';
import { PATHS, appRoutes } from './app.routes';
import { LanguageService } from './i18n/language.service';
import { MergedTranslateLoader } from './i18n/merged-translate-loader';
import { provideTranslatedUiText } from './i18n/translated-ui-text';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideApi({ baseUrl: environment.apiBaseUrl }),
    provideIdentity({
      termsVersion: environment.termsVersion,
      googleClientId: environment.googleClientId,
      afterSignIn: '/',
      paths: PATHS,
    }),
    provideTranslateService({
      loader: provideTranslateLoader(MergedTranslateLoader),
      fallbackLang: 'fr',
    }),
    provideTranslatedUiText(),
    provideUi({ theme: olivierTheme, accent: 'olive' }),
    provideIcons(SHELL_ICONS),
    provideAppInitializer(() => {
      inject(LanguageService);
      void inject(SessionStore).restore();
    }),
  ],
};
