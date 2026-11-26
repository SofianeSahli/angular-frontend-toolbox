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

type ForgotStep = 1 | 2;

const FORGOT_CODES = ['request.throttled'];
const RESET_CODES = ['code.invalid', 'request.throttled'];
const RESEND_DELAY_SECONDS = 60;
const CODE_LENGTH = 6;
const CODE_PATTERN = /^\d{6}$/;
const PASSWORD_MIN_LENGTH = 8;

@Component({
  selector: 'identity-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, UiAlert, UiButton, UiCodeInput, UiFieldAction, UiFieldMessage, UiFormField, UiIcon, UiInput],
  templateUrl: './forgot-password.page.html',
  styleUrl: '../../shared/identity-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPage {
  private readonly store = inject(SessionStore);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(UiToast);
  protected readonly navigation = inject(AuthNavigation);
  protected readonly paths = this.navigation.config.paths;
  protected readonly serverErrors = SERVER_ERROR_TEMPLATE;
  protected readonly codeLength = CODE_LENGTH;
  private readonly builder = inject(NonNullableFormBuilder);

  protected readonly step = signal<ForgotStep>(1);
  protected readonly email = signal('');
  protected readonly emailForm = this.builder.group({
    email: [this.store.pendingEmail() ?? '', [Validators.required, Validators.email]],
  });
  protected readonly resetForm = this.builder.group({
    code: ['', [Validators.required, Validators.pattern(CODE_PATTERN)]],
    password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
  });
  protected readonly submitting = signal(false);
  protected readonly resending = signal(false);
  protected readonly codeError = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  private readonly lock = countdown();
  protected readonly lockedSeconds = this.lock.remaining;
  protected readonly locked = computed(() => this.lockedSeconds() > 0);
  private readonly resendLock = countdown();
  protected readonly resendWait = computed(() => minutesAndSeconds(this.resendLock.remaining()));
  protected readonly canResend = computed(() => this.resendLock.remaining() === 0);

  protected async requestCode(): Promise<void> {
    if (this.submitting() || this.locked()) return;
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    const email = this.emailForm.getRawValue().email.trim();
    this.submitting.set(true);
    const result = await this.store.forgotPassword(email, FORGOT_CODES);
    this.submitting.set(false);
    if (result.outcome === 'done') {
      this.email.set(email);
      this.resetForm.reset();
      this.codeError.set(null);
      this.resendLock.start(RESEND_DELAY_SECONDS);
      this.step.set(2);
    } else if (result.outcome === 'error' && result.error.kind === 'throttled') this.lock.start(result.error.retryAfterSeconds ?? 0);
    else if (result.outcome === 'error' && result.error.kind === 'validation') applyServerErrors(this.emailForm, result.error, this.translate);
  }

  protected async reset(): Promise<void> {
    if (this.submitting() || this.locked()) return;
    this.codeError.set(this.resetForm.controls.code.invalid ? this.translate.instant('identity.errors.code.incomplete') : null);
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { code, password } = this.resetForm.getRawValue();
    const result = await this.store.resetPassword(this.email(), code, password, RESET_CODES);
    this.submitting.set(false);
    if (result.outcome === 'done') {
      this.toast.show({ message: this.translate.instant('identity.resetPassword.done'), tone: 'success' });
      await this.navigation.go(this.paths.signIn);
    } else if (result.outcome === 'error') this.handleResetError(result.error);
  }

  protected async resend(): Promise<void> {
    if (this.resending() || !this.canResend()) return;
    this.resending.set(true);
    const result = await this.store.forgotPassword(this.email(), RESET_CODES);
    if (result.outcome === 'done') this.resendLock.start(RESEND_DELAY_SECONDS);
    else if (result.outcome === 'error' && result.error.kind === 'throttled') this.resendLock.start(result.error.retryAfterSeconds ?? RESEND_DELAY_SECONDS);
    this.resending.set(false);
  }

  protected changeAddress(): void {
    this.step.set(1);
    this.codeError.set(null);
  }

  private handleResetError(error: ApiError): void {
    if (error.kind === 'throttled') {
      this.lock.start(error.retryAfterSeconds ?? 0);
      return;
    }
    const codeFieldError = error.code === 'code.invalid' ? error.code : error.fields['code']?.[0];
    if (codeFieldError) {
      this.resetForm.controls.code.reset('');
      this.codeError.set(serverMessage(this.translate, codeFieldError, 'code'));
    }
    if (error.kind === 'validation') applyServerErrors(this.resetForm, error, this.translate);
  }
}
