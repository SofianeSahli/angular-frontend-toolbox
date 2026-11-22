import { Component, inject, output, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Loader, passwordMatchValidator, TextInput } from '@shared/ui-components';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'lib-update-password-form',
  imports: [ReactiveFormsModule, TranslatePipe, TextInput, Loader],
  templateUrl: './update-password-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./update-password-form.component.scss'],
})
export class UpdatePasswordFormComponent {

  password_confirmation = new FormControl('', [Validators.required]);
  form = new FormGroup({
    current_password: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    password_confirmation: this.password_confirmation
  },
    { validators: passwordMatchValidator() });

  done = output();
  authService: AuthService = inject(AuthService);
  loading = signal(false);

  submit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    const { current_password, password } = this.form.getRawValue()
    this.authService
      .updatePassword(current_password!, password!)
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.form.reset();
          this.done.emit()
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }
}
