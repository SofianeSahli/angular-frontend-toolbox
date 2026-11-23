import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { SessionStore } from '@shared/identity-data-access';
import { UiButton, UiFieldMessage, UiIcon } from '@shared/ui-atoms';
import { UiCodeInput } from '@shared/ui-molecules';
import { AuthNavigation } from '../../shared/auth-navigation';
import { countdown, minutesAndSeconds } from '../../shared/countdown';
import { serverMessage } from '../../shared/server-errors';

const HANDLED_CODES = ['code.invalid', 'request.throttled'];
const RESEND_DELAY_SECONDS = 60;
const CODE_LENGTH = 6;
const CODE_PATTERN = /^\d{6}$/;

@Component({
  selector: 'identity-email-code-page',
  imports: [ReactiveFormsModule, TranslatePipe, UiButton, UiCodeInput, UiFieldMessage, UiIcon],
  templateUrl: './email-code.page.html',
  styleUrl: '../../shared/identity-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailCodePage {
  private readonly store = inject(SessionStore);
  private readonly translate = inject(TranslateService);
  protected readonly navigation = inject(AuthNavigation);
  protected readonly paths = this.navigation.config.paths;
  protected readonly email = this.store.pendingEmail;
  protected readonly codeLength = CODE_LENGTH;

  protected readonly form = inject(NonNullableFormBuilder).group({
    code: ['', [Validators.required, Validators.pattern(CODE_PATTERN)]],
  });
  private readonly code = this.form.controls.code;
  protected readonly codeError = signal<string | null>(null);
  protected readonly confirming = signal(false);
  protected readonly resending = signal(false);
  private readonly resendLock = countdown();
  protected readonly resendWait = computed(() => minutesAndSeconds(this.resendLock.remaining()));
  protected readonly canResend = computed(() => this.resendLock.remaining() === 0);

  constructor() {
    if (!this.email()) {
      void this.navigation.go(this.paths.signUp);
      return;
    }
    this.resendLock.start(RESEND_DELAY_SECONDS);
  }

  protected async confirm(): Promise<void> {
    const email = this.email();
    if (this.confirming() || !email) return;
    if (this.code.invalid) {
      this.code.markAsTouched();
      this.codeError.set(this.translate.instant('identity.errors.code.incomplete'));
      return;
    }
    this.confirming.set(true);
    this.codeError.set(null);
    const result = await this.store.confirmEmail(email, this.code.value, HANDLED_CODES);
    if (result.outcome === 'error') this.handleError(result.error);
    else await this.navigation.afterSignInStep(result);
    this.confirming.set(false);
  }

  protected async resend(): Promise<void> {
    const email = this.email();
    if (this.resending() || !this.canResend() || !email) return;
    this.resending.set(true);
    const result = await this.store.resendCode(email, HANDLED_CODES);
    if (result.outcome === 'done') this.resendLock.start(RESEND_DELAY_SECONDS);
    else if (result.error.kind === 'throttled') this.resendLock.start(result.error.retryAfterSeconds ?? RESEND_DELAY_SECONDS);
    this.resending.set(false);
  }

  protected changeAddress(): void {
    void this.navigation.go(this.paths.signUp);
  }

  private handleError(error: ApiError): void {
    if (error.code === 'code.invalid' || error.kind === 'validation') {
      this.code.reset('');
      this.codeError.set(serverMessage(this.translate, error.fields['code']?.[0] ?? error.code, 'code'));
    } else if (error.kind === 'throttled') {
      this.codeError.set(this.translate.instant('identity.errors.retryIn', { seconds: error.retryAfterSeconds ?? RESEND_DELAY_SECONDS }));
    }
  }
}
