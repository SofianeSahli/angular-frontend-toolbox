import { DIALOG_DATA } from '@angular/cdk/dialog';
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IDENTITY_CONFIG, SessionStore } from '@shared/identity-data-access';
import { UiAvatar, UiButton, UiIcon } from '@shared/ui-atoms';
import { UiSegmentedControl, UiSegmentedOption } from '@shared/ui-molecules';
import { UI_DRAWER_CONTEXT } from '@shared/ui-organisms';
import { THEME_CHOICES, ThemeChoice, UiThemeService } from '@shared/ui-tokens';
import { filter, map } from 'rxjs';
import { BooksStore } from '../households/data/books.store';
import { Book } from '../households/data/models';
import { APP_LANGUAGES, AppLanguage, LANGUAGE_NAMES, LanguageService } from '../i18n/language.service';
import { injectTranslationRevision } from '../i18n/translation-revision';
import { DrawerHints } from './drawer-hints';

export type NavDrawerFocus = 'books' | null;

export interface NavDrawerData {
  readonly focus: NavDrawerFocus;
}

export interface NavDrawerResult {
  readonly navigate: string;
}

export interface NavDestination {
  readonly path: string;
  readonly labelKey: string;
  readonly icon: string;
  readonly hint?: 'budget' | 'rules' | 'members';
}

export const PRIMARY_DESTINATIONS: readonly NavDestination[] = [
  { path: '/', labelKey: 'shell.home', icon: 'house' },
  { path: '/operations', labelKey: 'shell.operations', icon: 'list' },
];

export const PLANNING_DESTINATIONS: readonly NavDestination[] = [
  { path: '/budget', labelKey: 'shell.drawer.budgets', icon: 'wallet', hint: 'budget' },
  { path: '/recurrentes', labelKey: 'shell.recurring', icon: 'repeat', hint: 'rules' },
  { path: '/analyse', labelKey: 'shell.analysis', icon: 'chart-column' },
];

export const HOUSEHOLD_DESTINATIONS: readonly NavDestination[] = [
  { path: '/foyer', labelKey: 'shell.household', icon: 'users', hint: 'members' },
  { path: '/compte', labelKey: 'shell.account', icon: 'user' },
];

const ALL_PATHS = [...PRIMARY_DESTINATIONS, ...PLANNING_DESTINATIONS, ...HOUSEHOLD_DESTINATIONS].map((destination) => destination.path);

export function currentDestination(url: string): string | null {
  const path = url.split(/[?#]/)[0];
  if (path === '/' || path === '') return '/';
  return ALL_PATHS.filter((candidate) => candidate !== '/' && (path === candidate || path.startsWith(`${candidate}/`))).sort((a, b) => b.length - a.length)[0] ?? null;
}

@Component({
  selector: 'app-nav-drawer',
  imports: [FormsModule, NgTemplateOutlet, TranslatePipe, UiAvatar, UiButton, UiIcon, UiSegmentedControl],
  templateUrl: './nav-drawer.html',
  styleUrl: './nav-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DrawerHints],
})
export class NavDrawer {
  private readonly data = inject<NavDrawerData | null>(DIALOG_DATA, { optional: true });
  private readonly context = inject(UI_DRAWER_CONTEXT);
  private readonly router = inject(Router);
  private readonly session = inject(SessionStore);
  private readonly signInPath = inject(IDENTITY_CONFIG).paths.signIn;
  private readonly translate = inject(TranslateService);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly revision = injectTranslationRevision();
  protected readonly books = inject(BooksStore);
  protected readonly hints = inject(DrawerHints);
  protected readonly theme = inject(UiThemeService);
  protected readonly languages = inject(LanguageService);

  protected readonly account = this.session.account;
  protected readonly primary = PRIMARY_DESTINATIONS;
  protected readonly planning = PLANNING_DESTINATIONS;
  protected readonly householdLinks = HOUSEHOLD_DESTINATIONS;
  protected readonly signingOut = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );
  protected readonly current = computed(() => currentDestination(this.url()));

  protected readonly orderedBooks = computed<readonly Book[]>(() => {
    const household = this.books.householdBook();
    return household === null ? this.books.personalBooks() : [household, ...this.books.personalBooks()];
  });

  protected readonly themeOptions = computed<readonly UiSegmentedOption<ThemeChoice>[]>(() => {
    this.revision();
    return THEME_CHOICES.map((value) => ({ value, label: this.translate.instant(`shell.drawer.themes.${value}`) }));
  });

  protected readonly languageOptions: readonly UiSegmentedOption<AppLanguage>[] = APP_LANGUAGES.map((value) => ({ value, label: LANGUAGE_NAMES[value] }));

  constructor() {
    if (this.data?.focus === 'books') {
      afterNextRender(() => this.host.querySelector<HTMLElement>('[data-book][aria-current], [data-book]')?.focus());
    }
  }

  protected hintFor(destination: NavDestination): string | null {
    switch (destination.hint) {
      case 'budget':
        return this.hints.budget();
      case 'rules':
        return this.hints.rules();
      case 'members':
        return this.hints.members();
      default:
        return null;
    }
  }

  protected go(event: MouseEvent, path: string): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    this.context.close({ navigate: path } satisfies NavDrawerResult);
  }

  protected selectBook(book: Book): void {
    this.books.select(book.id);
    this.context.close();
  }

  protected close(): void {
    this.context.close();
  }

  protected setTheme(choice: ThemeChoice | null): void {
    if (choice !== null) this.theme.setChoice(choice);
  }

  protected setLanguage(language: AppLanguage | null): void {
    if (language !== null) this.languages.use(language);
  }

  protected async signOut(): Promise<void> {
    if (this.signingOut()) return;
    this.signingOut.set(true);
    const result = await this.session.signOut();
    this.signingOut.set(false);
    if (result.outcome === 'done') this.context.close({ navigate: this.signInPath } satisfies NavDrawerResult);
  }
}
