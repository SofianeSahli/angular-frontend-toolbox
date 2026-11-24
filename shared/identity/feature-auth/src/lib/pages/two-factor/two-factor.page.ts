import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { SessionStore } from '@shared/identity-data-access';
import { UiButton, UiFieldMessage, UiIcon } from '@shared/ui-atoms';
import { UiCodeInput } from '@shared/ui-molecules';
import { UiToast } from '@shared/ui-organisms';
import { AuthNavigation } from '../../shared/auth-navigation';
import { countdown, minutesAndSeconds } from '../../shared/countdown';
import { serverMessage } from '../../shared/server-errors';

const HANDLED_CODES = ['auth.pending_invalid', 'code.invalid', 'request.throttled'];
const RESEND_DELAY_SECONDS = 60;
const CODE_LENGTH = 6;
const CODE_PATTERN = /^\d{6}$/;

@Component({
  selector: 'identity-two-factor-page',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, UiButton, UiCodeInput, UiFieldMessage, UiIcon],
  templateUrl: './two-factor.page.html',
  styleUrl: '../../shared/identity-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwoFactorPage {
  private readonly store = inject(SessionStore);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(UiToast);
  protected readonly navigation = inject(AuthNavigation);
  protected readonly paths = this.navigation.config.paths;
  protected readonly email = computed(() => this.store.pendingTwoFactor()?.email ?? null);
  protected readonly codeLength = CODE_LENGTH;

  protected readonly form = inject(NonNullableFormBuilder).group({
    code: ['', [Validators.required, Validators.pattern(CODE_PATTERN)]],
  });
  protected readonly codeError = signal<string | null>(null);
  protected readonly confirming = signal(false);
  protected readonly resending = signal(false);
  private readonly resendLock = countdown();
  protected readonly resendWait = computed(() => minutesAndSeconds(this.resendLock.remaining()));
  protected readonly canResend = computed(() => this.resendLock.remaining() === 0);

  constructor() {
    if (!this.store.pendingTwoFactor()) {
      void this.restart();
      return;
    }
    this.resendLock.start(RESEND_DELAY_SECONDS);
  }

  protected async confirm(): Promise<void> {
    if (this.confirming()) return;
    const code = this.form.controls.code;
    if (code.invalid) {
      code.markAsTouched();
      this.codeError.set(this.translate.instant('identity.errors.code.incomplete'));
      return;
    }
    this.confirming.set(true);
    this.codeError.set(null);
    const result = await this.store.confirmTwoFactor(code.value, HANDLED_CODES);
    if (result.outcome === 'error') await this.handleError(result.error);
    else await this.navigation.afterSignInStep(result);
    this.confirming.set(false);
  }

  protected async resend(): Promise<void> {
    if (this.resending() || !this.canResend()) return;
    this.resending.set(true);
    const result = await this.store.resendTwoFactor(HANDLED_CODES);
    if (result.outcome === 'done') this.resendLock.start(RESEND_DELAY_SECONDS);
    else if (result.outcome === 'error' && result.error.kind === 'throttled') this.resendLock.start(result.error.retryAfterSeconds ?? RESEND_DELAY_SECONDS);
    else if (result.outcome === 'error') await this.handleError(result.error);
    this.resending.set(false);
  }

  private async handleError(error: ApiError): Promise<void> {
    if (error.code === 'auth.pending_invalid') {
      await this.restart();
    } else if (error.code === 'code.invalid' || error.kind === 'validation') {
      this.form.controls.code.reset('');
      this.codeError.set(serverMessage(this.translate, error.fields['code']?.[0] ?? error.code, 'code'));
    } else if (error.kind === 'throttled') {
      this.codeError.set(this.translate.instant('identity.errors.retryIn', { seconds: error.retryAfterSeconds ?? RESEND_DELAY_SECONDS }));
    }
  }

  private async restart(): Promise<void> {
    this.toast.show({ message: this.translate.instant('identity.twoFactor.expired'), tone: 'danger' });
    await this.navigation.go(this.paths.signIn);
  }
}
