import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SessionStore, safeReturnUrl } from '@shared/identity-data-access';
import { UiButton, UiIcon } from '@shared/ui-atoms';
import { AuthNavigation } from '../../shared/auth-navigation';

@Component({
  selector: 'identity-unavailable-page',
  imports: [TranslatePipe, UiButton, UiIcon],
  templateUrl: './unavailable.page.html',
  styleUrl: '../../shared/identity-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnavailablePage {
  private readonly store = inject(SessionStore);
  private readonly navigation = inject(AuthNavigation);
  private readonly returnUrl = safeReturnUrl(inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl')) ?? '/';
  protected readonly retrying = signal(false);

  protected async retry(): Promise<void> {
    if (this.retrying()) return;
    this.retrying.set(true);
    await this.store.restore();
    this.retrying.set(false);
    if (!this.store.unavailable()) await this.navigation.go(this.returnUrl);
  }
}
