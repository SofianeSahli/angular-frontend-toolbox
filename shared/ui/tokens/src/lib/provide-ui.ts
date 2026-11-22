import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { UI_CONFIG, UiConfig, UiTheme } from './ui-theme';
import { UiThemeService } from './ui-theme.service';

/**
 * Selects the app's theme and accent (spec 002, REQ-1.5, REQ-5.7). Call once in the app config,
 * and load the theme's CSS in the app's styles.
 *
 * ```ts
 * provideUi({ theme: olivierTheme, accent: 'olive' })
 * ```
 */
export function provideUi<T extends UiTheme>(config: UiConfig<T>): EnvironmentProviders {
  if (config.accent !== undefined && !config.theme.accents.includes(config.accent)) {
    throw new Error(
      `provideUi: accent "${config.accent}" is not an accent of theme "${config.theme.name}" (${config.theme.accents.join(', ') || 'none'})`,
    );
  }
  return makeEnvironmentProviders([
    { provide: UI_CONFIG, useValue: config },
    provideAppInitializer(() => {
      inject(UiThemeService);
    }),
  ]);
}
