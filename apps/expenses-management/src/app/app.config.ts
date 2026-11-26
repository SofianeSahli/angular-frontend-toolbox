import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { SHELL_ICONS } from './shell';
import { provideApi } from '@shared/http-data-access';
import { IDENTITY_PREFERENCES, IdentityPreferences, SessionStore, provideIdentity } from '@shared/identity-data-access';
import { olivierTheme } from '@shared/theme-olivier';
import { provideIcons } from '@shared/ui-atoms';
import { provideUi } from '@shared/ui-tokens';
import { environment } from '../environments/environment';
import { PATHS, appRoutes } from './app.routes';
import { provideHouseholds } from './households/data/provide-households';
import { provideOperations } from './operations/data/provide-operations';
import { provideBudget } from './budget/data/provide-budget';
import { provideDashboard } from './dashboard/data/provide-dashboard';
import { provideAnalysis } from './analysis/data/provide-analysis';
import { provideRecurring } from './recurring/data/provide-recurring';
import { APP_LANGUAGES, LANGUAGE_NAMES, LanguageService, isAppLanguage } from './i18n/language.service';
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
    {
      provide: IDENTITY_PREFERENCES,
      useFactory: (): IdentityPreferences => {
        const languages = inject(LanguageService);
        return {
          languages: APP_LANGUAGES.map((value) => ({ value, label: LANGUAGE_NAMES[value] })),
          language: languages.language,
          useLanguage: (value) => {
            if (isAppLanguage(value)) languages.use(value);
          },
        };
      },
    },
    provideUi({ theme: olivierTheme, accent: 'olive' }),
    provideIcons(SHELL_ICONS),
    provideHouseholds(),
    provideOperations(),
    provideDashboard(),
    provideAnalysis(),
    provideBudget(),
    provideRecurring(),
    provideAppInitializer(() => {
      inject(LanguageService);
      void inject(SessionStore).restore();
    }),
  ],
};
