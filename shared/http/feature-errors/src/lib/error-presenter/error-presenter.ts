import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ApiError, ErrorBus, SESSION_EXPIRY } from '@shared/http-data-access';
import { UiDialog, UiToast, UiToastTone } from '@shared/ui-organisms';
import { firstValueFrom } from 'rxjs';
import { ServerErrorDialog, ServerErrorDialogData, ServerErrorDialogResult } from '../server-error-dialog/server-error-dialog';

@Component({
  selector: 'shared-error-presenter',
  templateUrl: './error-presenter.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorPresenter {
  private readonly bus = inject(ErrorBus);
  private readonly toast = inject(UiToast);
  private readonly dialog = inject(UiDialog);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly sessionExpiry = inject(SESSION_EXPIRY, { optional: true });
  private serverDialogOpen = false;

  constructor() {
    effect(() => {
      const latest = this.bus.latest();
      if (latest) untracked(() => this.present(latest.error));
    });
  }

  private present(error: ApiError): void {
    switch (error.kind) {
      case 'unauthenticated':
        this.expireSession();
        return;
      case 'offline':
        this.showToast('errors.offline', 'danger');
        return;
      case 'forbidden':
      case 'not-found':
      case 'conflict':
      case 'throttled':
        this.showToast(this.messageKey(error), 'danger', { seconds: error.retryAfterSeconds });
        return;
      case 'server':
      case 'csrf':
        void this.showServerDialog(error);
        return;
      case 'validation':
        return;
    }
  }

  private expireSession(): void {
    if (!this.sessionExpiry?.isSignedIn()) return;
    const returnUrl = this.router.url;
    this.sessionExpiry.expire();
    this.showToast('errors.sessionExpired', 'neutral');
    void this.router.navigateByUrl(this.sessionExpiry.signInUrl(returnUrl));
  }

  private messageKey(error: ApiError): string {
    const codeKey = `errors.codes.${error.code}`;
    if (this.translate.instant(codeKey) !== codeKey) return codeKey;
    if (error.kind === 'throttled' && error.retryAfterSeconds === null) return 'errors.kinds.throttledLater';
    return `errors.kinds.${error.kind}`;
  }

  private showToast(key: string, tone: UiToastTone, params?: Record<string, unknown>): void {
    const message = this.translate.instant(key, params);
    const alreadyShown = this.toast.toasts().some((item) => item.message === message);
    if (!alreadyShown) this.toast.show({ message, tone });
  }

  private async showServerDialog(error: ApiError): Promise<void> {
    if (this.serverDialogOpen) return;
    this.serverDialogOpen = true;
    const ref = this.dialog.open<ServerErrorDialogResult, ServerErrorDialogData, ServerErrorDialog>(ServerErrorDialog, {
      data: { requestId: error.requestId },
      size: 'sm',
      role: 'alertdialog',
      autoFocus: '.server-error-dialog__retry',
    });
    const result = await firstValueFrom(ref.closed, { defaultValue: undefined });
    this.serverDialogOpen = false;
    if (result === 'retry') await this.router.navigateByUrl(this.router.url, { onSameUrlNavigation: 'reload' });
  }
}
