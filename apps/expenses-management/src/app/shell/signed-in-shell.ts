import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IDENTITY_CONFIG, SessionStore } from '@shared/identity-data-access';
import { UiButton, UiIcon } from '@shared/ui-atoms';
import { UiBottomTabs, UiRailItem, UiSideRail, UiTab, UiTopBar, UiTopBarTitle } from '@shared/ui-organisms';
import { UiAppShell } from '@shared/ui-templates';
import { filter, map } from 'rxjs';
import { BooksStore } from '../households/data/books.store';
import { EntrySheetService } from '../operations/entry-sheet.service';
import { BookSwitcher } from './book-switcher';
import { BrandMark } from './brand-mark';

export const SHELL_TITLE_KEY = 'titleKey';
export const SHELL_BOOK_BOUND = 'bookBound';

interface ShellRouteData {
  readonly titleKey: string;
  readonly bookBound: boolean;
}

function deepestData(router: Router): ShellRouteData {
  let current: ActivatedRouteSnapshot = router.routerState.snapshot.root;
  while (current.firstChild) current = current.firstChild;
  const key = current.data[SHELL_TITLE_KEY];
  return { titleKey: typeof key === 'string' ? key : '', bookBound: current.data[SHELL_BOOK_BOUND] === true };
}

@Component({
  selector: 'app-signed-in-shell',
  imports: [
    BookSwitcher,
    BrandMark,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslatePipe,
    UiAppShell,
    UiBottomTabs,
    UiButton,
    UiIcon,
    UiRailItem,
    UiSideRail,
    UiTab,
    UiTopBar,
    UiTopBarTitle,
  ],
  templateUrl: './signed-in-shell.html',
  styleUrl: './signed-in-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignedInShell {
  private readonly store = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly signInPath = inject(IDENTITY_CONFIG).paths.signIn;
  private readonly books = inject(BooksStore);
  private readonly sheets = inject(EntrySheetService);

  protected readonly account = this.store.account;
  protected readonly signingOut = signal(false);
  private readonly routeData = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => deepestData(this.router)),
    ),
    { initialValue: deepestData(this.router) },
  );
  protected readonly titleKey = computed(() => this.routeData().titleKey);
  protected readonly showSwitcher = computed(() => this.routeData().bookBound && this.books.selectedBook() !== null);
  protected readonly canAdd = this.showSwitcher;

  protected add(): void {
    this.sheets.openNew();
  }

  protected async signOut(): Promise<void> {
    if (this.signingOut()) return;
    this.signingOut.set(true);
    const result = await this.store.signOut();
    this.signingOut.set(false);
    if (result.outcome === 'done') await this.router.navigateByUrl(this.signInPath);
  }
}
