import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IDENTITY_CONFIG, SessionStore } from '@shared/identity-data-access';
import { UiButton, UiIcon } from '@shared/ui-atoms';
import { UiBottomTabs, UiRailItem, UiSideRail, UiTab, UiTopBar, UiTopBarTitle } from '@shared/ui-organisms';
import { UiAppShell } from '@shared/ui-templates';
import { filter, map } from 'rxjs';
import { BrandMark } from './brand-mark';

export const SHELL_TITLE_KEY = 'titleKey';

function deepestTitleKey(router: Router): string {
  let current: ActivatedRouteSnapshot = router.routerState.snapshot.root;
  while (current.firstChild) current = current.firstChild;
  const key = current.data[SHELL_TITLE_KEY];
  return typeof key === 'string' ? key : '';
}

@Component({
  selector: 'expenses-signed-in-shell',
  imports: [
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

  protected readonly account = this.store.account;
  protected readonly signingOut = signal(false);
  protected readonly titleKey = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => deepestTitleKey(this.router)),
    ),
    { initialValue: deepestTitleKey(this.router) },
  );

  protected async signOut(): Promise<void> {
    if (this.signingOut()) return;
    this.signingOut.set(true);
    const result = await this.store.signOut();
    this.signingOut.set(false);
    if (result.outcome === 'done') await this.router.navigateByUrl(this.signInPath);
  }
}
