import { InjectionToken, Provider } from '@angular/core';

export interface UiText {
  readonly loading: string;
  readonly optional: string;
}

export const DEFAULT_UI_TEXT: UiText = {
  loading: 'Chargement',
  optional: '(facultatif)',
};

export const UI_TEXT = new InjectionToken<UiText>('UI_TEXT', {
  providedIn: 'root',
  factory: () => DEFAULT_UI_TEXT,
});

export function provideUiText(overrides: Partial<UiText>): Provider {
  return { provide: UI_TEXT, useValue: { ...DEFAULT_UI_TEXT, ...overrides } };
}
