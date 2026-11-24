import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { SessionStore } from '@shared/identity-data-access';
import { UiButton, UiIcon, UiInput } from '@shared/ui-atoms';
import { UiAlert, UiFieldAction, UiFormField } from '@shared/ui-molecules';
import { AuthNavigation } from '../../shared/auth-navigation';
import { countdown } from '../../shared/countdown';
import { GoogleButton } from '../../shared/google-button';
import { SERVER_ERROR_TEMPLATE, applyServerErrors } from '../../shared/server-errors';

const HANDLED_CODES = ['auth.invalid_credentials', 'auth.email_unconfirmed', 'auth.password_locked', 'request.throttled'];

@Component({
  selector: 'identity-sign-in-page',
  imports: [GoogleButton, ReactiveFormsModule, RouterLink, TranslatePipe, UiAlert, UiButton, UiFieldAction, UiFormField, UiIcon, UiInput],
  templateUrl: './sign-in.page.html',
  styleUrl: '../../shared/identity-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInPage {
  private readonly store = inject(SessionStore);
  private readonly translate = inject(TranslateService);
  protected readonly navigation = inject(AuthNavigation);
  protected readonly paths = this.navigation.config.paths;
  protected readonly serverErrors = SERVER_ERROR_TEMPLATE;

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly submitting = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly invalidCredentials = signal(false);
  protected readonly googleProblem = signal<string | null>(null);
  private readonly lock = countdown();
  protected readonly lockedSeconds = this.lock.remaining;
  protected readonly locked = computed(() => this.lockedSeconds() > 0);

  constructor() {
    this.navigation.rememberReturnUrl(inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl'));
  }

  protected async submit(): Promise<void> {
    if (this.submitting() || this.locked()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.invalidCredentials.set(false);
    const { email, password } = this.form.getRawValue();
    const result = await this.store.signIn(email, password, HANDLED_CODES);
    if (result.outcome === 'error') await this.handleError(result.error, email);
    else await this.navigation.afterSignInStep(result);
    this.submitting.set(false);
  }

  private async handleError(error: ApiError, email: string): Promise<void> {
    if (error.code === 'auth.invalid_credentials') {
      this.invalidCredentials.set(true);
      this.form.controls.password.reset();
    } else if (error.code === 'auth.email_unconfirmed') {
      await this.store.resendCode(email, ['request.throttled']);
      await this.navigation.go(this.paths.emailCode);
    } else if (error.kind === 'throttled') {
      this.lock.start(error.retryAfterSeconds ?? 0);
    } else if (error.kind === 'validation') {
      applyServerErrors(this.form, error, this.translate);
    }
  }
}
