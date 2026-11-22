import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { olivierTheme } from '@shared/theme-olivier';
import { provideUi } from '@shared/ui-tokens';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideUi({ theme: olivierTheme }),
  ],
};
