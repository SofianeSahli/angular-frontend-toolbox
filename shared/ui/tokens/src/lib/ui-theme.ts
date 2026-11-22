import { InjectionToken } from '@angular/core';

export type ThemeChoice = 'light' | 'dark' | 'system';

export type ActiveTheme = 'light' | 'dark';

export const THEME_CHOICES: readonly ThemeChoice[] = ['light', 'dark', 'system'];

export const UI_THEME_STORAGE_KEY = 'ui.theme';

export interface UiTheme {
  readonly name: string;
  readonly accents: readonly string[];
  readonly defaultAccent: string | null;
}

export interface UiConfig<T extends UiTheme = UiTheme> {
  theme: T;
  accent?: T['accents'][number];
}

export const UI_CONFIG = new InjectionToken<UiConfig>('UI_CONFIG');

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return typeof value === 'string' && (THEME_CHOICES as readonly string[]).includes(value);
}
