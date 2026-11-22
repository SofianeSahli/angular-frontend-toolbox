import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { ActiveTheme, ThemeChoice, UI_CONFIG, UI_THEME_STORAGE_KEY, isThemeChoice } from './ui-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

@Injectable({ providedIn: 'root' })
export class UiThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly config = inject(UI_CONFIG, { optional: true });
  private readonly window = this.document.defaultView;
  private readonly media = this.window?.matchMedia?.(DARK_QUERY) ?? null;

  private readonly choiceState = signal<ThemeChoice>(this.readStoredChoice());
  private readonly deviceDark = signal(this.media?.matches ?? false);

  readonly choice = this.choiceState.asReadonly();

  readonly active = computed<ActiveTheme>(() => {
    const choice = this.choiceState();
    if (choice !== 'system') return choice;
    return this.deviceDark() ? 'dark' : 'light';
  });

  constructor() {
    const onChange = (event: MediaQueryListEvent) => {
      this.deviceDark.set(event.matches);
      this.apply();
    };
    this.media?.addEventListener?.('change', onChange);
    inject(DestroyRef).onDestroy(() => this.media?.removeEventListener?.('change', onChange));
    this.apply();
  }

  setChoice(choice: ThemeChoice): void {
    if (!isThemeChoice(choice)) throw new Error(`Unknown theme choice "${String(choice)}"`);
    this.choiceState.set(choice);
    this.writeStoredChoice(choice);
    this.apply();
  }

  private apply(): void {
    const html = this.document.documentElement;
    const active = this.active();
    html.setAttribute('data-theme', active);
    html.setAttribute('data-bs-theme', active);
    const accent = this.config?.accent ?? this.config?.theme.defaultAccent;
    if (accent) html.setAttribute('data-accent', accent);
  }

  private readStoredChoice(): ThemeChoice {
    try {
      const stored = this.window?.localStorage.getItem(UI_THEME_STORAGE_KEY);
      return isThemeChoice(stored) ? stored : 'system';
    } catch {
      return 'system';
    }
  }

  private writeStoredChoice(choice: ThemeChoice): void {
    try {
      this.window?.localStorage.setItem(UI_THEME_STORAGE_KEY, choice);
    } catch {
      // Private mode or blocked site data: the choice still applies for this session.
    }
  }
}
