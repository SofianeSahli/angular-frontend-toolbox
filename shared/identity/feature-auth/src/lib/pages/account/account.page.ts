import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { AuthResult, SessionStore } from '@shared/identity-data-access';
import { UiBadge, UiButton, UiFieldMessage } from '@shared/ui-atoms';
import { UiCodeInput, UiList, UiListItem, UiSectionHeader } from '@shared/ui-molecules';
import { UiToast } from '@shared/ui-organisms';
import { UiPage } from '@shared/ui-templates';
import { AuthNavigation } from '../../shared/auth-navigation';
import { serverMessage } from '../../shared/server-errors';

const STATE_CONFLICT_CODES = ['two_factor.already_enabled', 'two_factor.not_enabled'];
const HANDLED_CODES = [...STATE_CONFLICT_CODES, 'code.invalid', 'request.throttled'];
const CODE_LENGTH = 6;
const CODE_PATTERN = /^\d{6}$/;

@Component({
  selector: 'identity-account-page',
  imports: [ReactiveFormsModule, TranslatePipe, UiBadge, UiButton, UiCodeInput, UiFieldMessage, UiList, UiListItem, UiPage, UiSectionHeader],
  templateUrl: './account.page.html',
  styleUrl: '../../shared/identity-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountPage {
  private readonly store = inject(SessionStore);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(UiToast);
  private readonly navigation = inject(AuthNavigation);
  protected readonly account = this.store.account;
  protected readonly codeLength = CODE_LENGTH;

  protected readonly disableForm = inject(NonNullableFormBuilder).group({
    code: ['', [Validators.required, Validators.pattern(CODE_PATTERN)]],
  });
  protected readonly askingDisableCode = signal(false);
  protected readonly codeError = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly signingOut = signal(false);

  protected async enableTwoFactor(): Promise<void> {
    await this.run(async () => {
      const result = await this.store.enableTwoFactor(HANDLED_CODES);
      if (result.outcome === 'done') this.toast.show({ message: this.translate.instant('identity.account.twoFactorEnabled'), tone: 'success' });
      return result;
    });
  }

  protected async requestDisableCode(): Promise<void> {
    await this.run(async () => {
      const result = await this.store.requestDisableCode(HANDLED_CODES);
      if (result.outcome === 'done') {
        this.disableForm.reset();
        this.codeError.set(null);
        this.askingDisableCode.set(true);
      }
      return result;
    });
  }

  protected async disableTwoFactor(): Promise<void> {
    const code = this.disableForm.controls.code;
    if (code.invalid) {
      code.markAsTouched();
      this.codeError.set(this.translate.instant('identity.errors.code.incomplete'));
      return;
    }
    await this.run(async () => {
      const result = await this.store.disableTwoFactor(code.value, HANDLED_CODES);
      if (result.outcome === 'done') {
        this.askingDisableCode.set(false);
        this.toast.show({ message: this.translate.instant('identity.account.twoFactorDisabled'), tone: 'success' });
      }
      return result;
    });
  }

  protected cancelDisable(): void {
    this.askingDisableCode.set(false);
    this.codeError.set(null);
  }

  protected async signOut(): Promise<void> {
    if (this.signingOut()) return;
    this.signingOut.set(true);
    const result = await this.store.signOut();
    this.signingOut.set(false);
    if (result.outcome === 'done') await this.navigation.go(this.navigation.config.paths.signIn);
  }

  private async run(action: () => Promise<AuthResult>): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    const result = await action();
    if (result.outcome === 'error') await this.handleError(result.error);
    this.busy.set(false);
  }

  private async handleError(error: ApiError): Promise<void> {
    if (STATE_CONFLICT_CODES.includes(error.code)) {
      this.askingDisableCode.set(false);
      await this.store.refreshAccount();
    } else if (error.code === 'code.invalid' || error.fields['code']) {
      this.disableForm.controls.code.reset('');
      this.codeError.set(serverMessage(this.translate, error.fields['code']?.[0] ?? error.code, 'code'));
    } else if (error.kind === 'throttled') {
      this.codeError.set(this.translate.instant('identity.errors.retryIn', { seconds: error.retryAfterSeconds ?? 0 }));
    }
  }
}
