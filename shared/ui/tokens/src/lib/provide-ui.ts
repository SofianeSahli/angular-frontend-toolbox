import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { UI_CONFIG, UiConfig, UiTheme } from './ui-theme';
import { UiThemeService } from './ui-theme.service';

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
