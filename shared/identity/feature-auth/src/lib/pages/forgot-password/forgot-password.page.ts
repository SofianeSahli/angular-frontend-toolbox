import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SessionStore } from '@shared/identity-data-access';
import { UiButton, UiIcon, UiInput } from '@shared/ui-atoms';
import { UiAlert, UiFormField } from '@shared/ui-molecules';
import { AuthNavigation } from '../../shared/auth-navigation';
import { countdown } from '../../shared/countdown';
import { SERVER_ERROR_TEMPLATE, applyServerErrors } from '../../shared/server-errors';

const HANDLED_CODES = ['request.throttled'];

@Component({
  selector: 'identity-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, UiAlert, UiButton, UiFormField, UiIcon, UiInput],
  templateUrl: './forgot-password.page.html',
  styleUrl: '../../shared/identity-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPage {
  private readonly store = inject(SessionStore);
  private readonly translate = inject(TranslateService);
  protected readonly navigation = inject(AuthNavigation);
  protected readonly paths = this.navigation.config.paths;
  protected readonly serverErrors = SERVER_ERROR_TEMPLATE;

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: [this.store.pendingEmail() ?? '', [Validators.required, Validators.email]],
  });
  protected readonly submitting = signal(false);
  private readonly lock = countdown();
  protected readonly lockedSeconds = this.lock.remaining;
  protected readonly locked = computed(() => this.lockedSeconds() > 0);

  protected async submit(): Promise<void> {
    if (this.submitting() || this.locked()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const result = await this.store.forgotPassword(this.form.getRawValue().email.trim(), HANDLED_CODES);
    if (result.outcome === 'done') await this.navigation.go(this.paths.resetPassword);
    else if (result.outcome === 'error' && result.error.kind === 'throttled') this.lock.start(result.error.retryAfterSeconds ?? 0);
    else if (result.outcome === 'error' && result.error.kind === 'validation') applyServerErrors(this.form, result.error, this.translate);
    this.submitting.set(false);
  }
}
