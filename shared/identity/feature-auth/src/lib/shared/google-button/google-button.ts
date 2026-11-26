import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { IDENTITY_CONFIG, SessionStore } from '@shared/identity-data-access';
import { UiButton, UiCheckRow, UiCheckbox } from '@shared/ui-atoms';
import { accountLocaleOf } from '../account-locale';
import { AuthNavigation } from '../auth-navigation';
import { GoogleIdentityLoader } from './google-identity';
import { OrDivider } from '../or-divider/or-divider';
import { serverMessage } from '../server-errors';

const TERMS_REQUIRED = 'auth.terms_required';
const GOOGLE_CODES = ['auth.google_invalid', 'auth.google_unavailable', 'auth.google_email_conflict'];
const HANDLED_CODES = [...GOOGLE_CODES, TERMS_REQUIRED];
const SCRIPT_FAILED = 'auth.google_unavailable';
const GOOGLE_BUTTON_MAX_WIDTH = 400;

@Component({
  selector: 'identity-google-button',
  imports: [OrDivider, RouterLink, TranslatePipe, UiButton, UiCheckRow, UiCheckbox],
  templateUrl: './google-button.html',
  styleUrl: './google-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleButton {
  readonly termsAccepted = input(false, { transform: booleanAttribute });
  readonly problem = output<string | null>();

  private readonly store = inject(SessionStore);
  private readonly translate = inject(TranslateService);
  private readonly navigation = inject(AuthNavigation);
  private readonly loader = inject(GoogleIdentityLoader);
  private readonly zone = inject(NgZone);
  private readonly config = inject(IDENTITY_CONFIG);
  private readonly host = viewChild<ElementRef<HTMLElement>>('googleHost');
  private destroyed = false;
  private pendingToken: string | null = null;

  protected readonly clientId = this.config.googleClientId ?? '';
  protected readonly paths = this.config.paths;
  protected readonly submitting = signal(false);
  protected readonly termsRequired = signal(false);
  protected readonly termsChecked = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => (this.destroyed = true));
    if (this.clientId) afterNextRender(() => void this.renderGoogleButton());
  }

  protected onTermsChange(event: Event): void {
    this.termsChecked.set((event.target as HTMLInputElement).checked);
  }

  protected async continueWithTerms(): Promise<void> {
    if (this.pendingToken && this.termsChecked()) await this.send(this.pendingToken, true);
  }

  private async renderGoogleButton(): Promise<void> {
    try {
      const accountsId = await this.loader.load();
      const host = this.host()?.nativeElement;
      if (!host || this.destroyed) return;
      accountsId.initialize({
        client_id: this.clientId,
        callback: (response) => this.zone.run(() => void this.send(response.credential, this.termsAccepted())),
      });
      accountsId.renderButton(host, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        locale: this.translate.getCurrentLang(),
        width: Math.min(host.clientWidth || GOOGLE_BUTTON_MAX_WIDTH, GOOGLE_BUTTON_MAX_WIDTH),
      });
    } catch {
      if (!this.destroyed) this.problem.emit(serverMessage(this.translate, SCRIPT_FAILED));
    }
  }

  private async send(idToken: string, withTerms: boolean): Promise<void> {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.problem.emit(null);
    const result = await this.store.signInWithGoogle(
      { idToken, locale: accountLocaleOf(this.translate), ...(withTerms ? { termsVersion: this.config.termsVersion } : {}) },
      HANDLED_CODES,
    );
    this.submitting.set(false);
    if (result.outcome === 'error') {
      this.handleError(idToken, result.error);
      return;
    }
    this.pendingToken = null;
    this.termsRequired.set(false);
    await this.navigation.afterSignInStep(result);
  }

  private handleError(idToken: string, error: ApiError): void {
    if (error.code === TERMS_REQUIRED) {
      this.pendingToken = idToken;
      this.termsRequired.set(true);
    } else if (GOOGLE_CODES.includes(error.code)) {
      this.problem.emit(serverMessage(this.translate, error.code));
    } else if (error.kind === 'validation') {
      const [field, codes] = Object.entries(error.fields)[0] ?? [];
      this.problem.emit(serverMessage(this.translate, codes?.[0] ?? error.code, field));
    }
  }
}
