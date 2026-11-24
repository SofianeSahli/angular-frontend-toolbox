import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiError } from '@shared/http-data-access';
import { RegisterRequest, SessionStore } from '@shared/identity-data-access';
import { UiButton, UiCheckRow, UiCheckbox, UiFieldMessage, UiIcon, UiInput } from '@shared/ui-atoms';
import { UiAlert, UiFieldAction, UiFieldAffix, UiFormField } from '@shared/ui-molecules';
import { accountLocaleOf } from '../../shared/account-locale';
import { AuthNavigation } from '../../shared/auth-navigation';
import { GoogleButton } from '../../shared/google-button';
import { SERVER_ERROR_TEMPLATE, applyServerErrors, serverMessage, showOnField } from '../../shared/server-errors';
import { SignUpDraft, SignUpDraftValues } from '../../shared/sign-up-draft';

const HANDLED_CODES = ['email.taken', 'request.throttled'];
const NAME_MAX_LENGTH = 120;
const PASSWORD_MIN_LENGTH = 8;
const PHONE_PREFIX = '+216';
const PHONE_DIGITS = /^[0-9 ]{8,11}$/;
const SPACES = /\s+/g;

interface SignUpValues extends SignUpDraftValues {
  readonly password: string;
}

@Component({
  selector: 'identity-sign-up-page',
  imports: [
    GoogleButton,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    UiAlert,
    UiButton,
    UiCheckRow,
    UiCheckbox,
    UiFieldAction,
    UiFieldAffix,
    UiFieldMessage,
    UiFormField,
    UiIcon,
    UiInput,
  ],
  templateUrl: './sign-up.page.html',
  styleUrl: '../../shared/identity-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUpPage {
  private readonly store = inject(SessionStore);
  private readonly translate = inject(TranslateService);
  private readonly draft = inject(SignUpDraft);
  protected readonly navigation = inject(AuthNavigation);
  protected readonly paths = this.navigation.config.paths;
  protected readonly serverErrors = SERVER_ERROR_TEMPLATE;
  protected readonly nameMaxLength = NAME_MAX_LENGTH;
  protected readonly phonePrefix = PHONE_PREFIX;

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: [this.draft.values()?.name ?? '', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
    email: [this.draft.values()?.email ?? '', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
    phone: [this.draft.values()?.phone ?? '', Validators.pattern(PHONE_DIGITS)],
    terms: [this.draft.values()?.terms ?? false, Validators.requiredTrue],
  });

  protected readonly submitting = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly emailTaken = signal(false);
  protected readonly googleProblem = signal<string | null>(null);

  constructor() {
    this.navigation.rememberReturnUrl(inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl'));
  }

  protected termsInvalid(): boolean {
    const terms = this.form.controls.terms;
    return terms.touched && terms.invalid;
  }

  protected async submit(): Promise<void> {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.emailTaken.set(false);
    const values = this.form.getRawValue();
    const result = await this.store.register(this.registerRequest(values), HANDLED_CODES);
    if (result.outcome === 'error') this.handleError(result.error);
    else {
      this.draft.values.set({ name: values.name, email: values.email, phone: values.phone, terms: values.terms });
      await this.navigation.go(this.paths.emailCode);
    }
    this.submitting.set(false);
  }

  private registerRequest(values: SignUpValues): RegisterRequest {
    const phoneDigits = values.phone.replace(SPACES, '');
    return {
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
      locale: accountLocaleOf(this.translate),
      ...(phoneDigits ? { phone: `${PHONE_PREFIX}${phoneDigits}` } : {}),
    };
  }

  private handleError(error: ApiError): void {
    if (error.code === 'email.taken') {
      this.emailTaken.set(true);
      showOnField(this.form, 'email', serverMessage(this.translate, error.code));
    } else if (error.kind === 'validation') {
      applyServerErrors(this.form, error, this.translate);
    }
  }
}
