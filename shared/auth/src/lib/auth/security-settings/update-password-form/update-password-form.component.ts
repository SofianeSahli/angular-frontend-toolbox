import { Component, inject, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Loader, passwordMatchValidator, TextInput } from '@shared/ui-components';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'lib-update-password-form',
  imports: [ReactiveFormsModule, TranslatePipe, TextInput, Loader],
  templateUrl: './update-password-form.component.html',
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
  loading = false;

  submit() {
    if (this.form.invalid) return;

    this.loading = true;
    const { current_password, password } = this.form.getRawValue()
    this.authService
      .updatePassword(current_password!, password!)
      .subscribe({
        next: () => {
          this.loading = false;
          this.form.reset();
          this.done.emit()
        },
        error: () => {
          this.loading = false;
        },
      });
  }
}
