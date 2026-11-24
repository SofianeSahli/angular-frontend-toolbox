import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { olivierTheme } from '@shared/theme-olivier';
import { provideUi } from '@shared/ui-tokens';
import { catalogRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(catalogRoutes),
    provideUi({ theme: olivierTheme }),
  ],
};
