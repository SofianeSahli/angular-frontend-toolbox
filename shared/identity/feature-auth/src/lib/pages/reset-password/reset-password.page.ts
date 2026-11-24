import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { SessionStore } from '@shared/identity-data-access';
import { UiButton, UiFieldMessage, UiIcon, UiInput } from '@shared/ui-atoms';
import { UiAlert, UiCodeInput, UiFieldAction, UiFormField } from '@shared/ui-molecules';
import { UiToast } from '@shared/ui-organisms';
import { AuthNavigation } from '../../shared/auth-navigation';
import { countdown, minutesAndSeconds } from '../../shared/countdown';
import { SERVER_ERROR_TEMPLATE, applyServerErrors, serverMessage } from '../../shared/server-errors';

const HANDLED_CODES = ['code.invalid', 'request.throttled'];
const RESEND_DELAY_SECONDS = 60;
const CODE_LENGTH = 6;
const CODE_PATTERN = /^\d{6}$/;
const PASSWORD_MIN_LENGTH = 8;

@Component({
  selector: 'identity-reset-password-page',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, UiAlert, UiButton, UiCodeInput, UiFieldAction, UiFieldMessage, UiFormField, UiIcon, UiInput],
  templateUrl: './reset-password.page.html',
  styleUrl: '../../shared/identity-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPage {
  private readonly store = inject(SessionStore);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(UiToast);
  protected readonly navigation = inject(AuthNavigation);
  protected readonly paths = this.navigation.config.paths;
  protected readonly serverErrors = SERVER_ERROR_TEMPLATE;
  protected readonly email = this.store.pendingEmail;
  protected readonly codeLength = CODE_LENGTH;

  protected readonly form = inject(NonNullableFormBuilder).group({
    code: ['', [Validators.required, Validators.pattern(CODE_PATTERN)]],
    password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
  });
  protected readonly codeError = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  protected readonly submitting = signal(false);
  protected readonly resending = signal(false);
  private readonly lock = countdown();
  protected readonly lockedSeconds = this.lock.remaining;
  private readonly resendLock = countdown();
  protected readonly resendWait = computed(() => minutesAndSeconds(this.resendLock.remaining()));
  protected readonly canResend = computed(() => this.resendLock.remaining() === 0);

  constructor() {
    if (!this.email()) {
      void this.navigation.go(this.paths.forgotPassword);
      return;
    }
    this.resendLock.start(RESEND_DELAY_SECONDS);
  }

  protected async submit(): Promise<void> {
    const email = this.email();
    if (this.submitting() || this.lockedSeconds() > 0 || !email) return;
    this.codeError.set(this.form.controls.code.invalid ? this.translate.instant('identity.errors.code.incomplete') : null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { code, password } = this.form.getRawValue();
    const result = await this.store.resetPassword(email, code, password, HANDLED_CODES);
    if (result.outcome === 'done') await this.finish();
    else if (result.outcome === 'error') this.handleError(result.error);
    this.submitting.set(false);
  }

  protected async resend(): Promise<void> {
    const email = this.email();
    if (this.resending() || !this.canResend() || !email) return;
    this.resending.set(true);
    const result = await this.store.forgotPassword(email, HANDLED_CODES);
    if (result.outcome === 'done') this.resendLock.start(RESEND_DELAY_SECONDS);
    else if (result.outcome === 'error' && result.error.kind === 'throttled') this.resendLock.start(result.error.retryAfterSeconds ?? RESEND_DELAY_SECONDS);
    this.resending.set(false);
  }

  private async finish(): Promise<void> {
    this.toast.show({ message: this.translate.instant('identity.resetPassword.done'), tone: 'success' });
    await this.navigation.go(this.paths.signIn);
  }

  private handleError(error: ApiError): void {
    if (error.kind === 'throttled') {
      this.lock.start(error.retryAfterSeconds ?? 0);
      return;
    }
    const codeFieldError = error.code === 'code.invalid' ? error.code : error.fields['code']?.[0];
    if (codeFieldError) {
      this.form.controls.code.reset('');
      this.codeError.set(serverMessage(this.translate, codeFieldError, 'code'));
    }
    if (error.kind === 'validation') applyServerErrors(this.form, error, this.translate);
  }
}
