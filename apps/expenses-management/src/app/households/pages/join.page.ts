import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { UiButton, UiSkeleton } from '@shared/ui-atoms';
import { UiAlert } from '@shared/ui-molecules';
import { UiToast } from '@shared/ui-organisms';
import { UiPage } from '@shared/ui-templates';
import { firstValueFrom } from 'rxjs';
import { BooksStore } from '../data/books.store';
import { HouseholdStore } from '../data/household.store';
import { QrInvitationPreview, QrInvitationsApi } from '../data/qr-invitations-api';
import { toApiError } from '../data/store-result';
import { retryText } from '../support/retry-text';

type JoinState = 'loading' | 'ready' | 'invalid' | 'failed';

const JOIN_ERRORS: Readonly<Record<string, string>> = {
  'invitation.not_found': 'households.join.errors.notFound',
  'validation.failed': 'households.join.errors.notFound',
  'household.already_joined': 'households.join.errors.alreadyJoined',
  'household.member_limit': 'households.join.errors.memberLimit',
  'http.offline': 'households.join.errors.offline',
};

@Component({
  selector: 'app-join-page',
  imports: [TranslatePipe, UiAlert, UiButton, UiPage, UiSkeleton],
  templateUrl: './join.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinPage implements OnInit {
  private readonly api = inject(QrInvitationsApi);
  private readonly books = inject(BooksStore);
  private readonly household = inject(HouseholdStore);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(UiToast);
  private readonly token = inject(ActivatedRoute).snapshot.fragment ?? '';

  protected readonly state = signal<JoinState>('loading');
  protected readonly preview = signal<QrInvitationPreview | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly joining = signal(false);

  async ngOnInit(): Promise<void> {
    if (this.token === '') {
      this.fail('households.join.errors.notFound', 'invalid');
      return;
    }
    try {
      this.preview.set(await firstValueFrom(this.api.preview(this.token)));
      this.state.set('ready');
    } catch (caught) {
      this.showError(toApiError(caught), 'invalid');
    }
  }

  protected async join(): Promise<void> {
    if (this.joining()) return;
    this.joining.set(true);
    this.message.set(null);
    try {
      const joined = await firstValueFrom(this.api.accept(this.token));
      this.household.applyAccepted(joined);
      await this.books.load({ force: true });
      const householdBook = this.books.householdBook();
      if (householdBook !== null) this.books.select(householdBook.id);
      this.toast.show({ message: this.translate.instant('households.join.joined', { name: joined.name }), tone: 'success' });
      await this.router.navigateByUrl('/');
    } catch (caught) {
      this.showError(toApiError(caught), 'failed');
    } finally {
      this.joining.set(false);
    }
  }

  protected decline(): void {
    void this.router.navigateByUrl('/');
  }

  private showError(error: ApiError, state: JoinState): void {
    if (error.code === 'request.throttled') {
      this.message.set(this.translate.instant('households.join.errors.throttled', { retry: retryText(this.translate, error.retryAfterSeconds) }));
      this.state.set(state === 'invalid' ? 'failed' : state);
      return;
    }
    const key = JOIN_ERRORS[error.code] ?? 'households.errors.generic';
    this.fail(key, error.code === 'invitation.not_found' || error.code === 'validation.failed' ? 'invalid' : state);
  }

  private fail(key: string, state: JoinState): void {
    this.message.set(this.translate.instant(key));
    this.state.set(state);
  }
}
