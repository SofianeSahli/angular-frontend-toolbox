import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Loader, passwordMatchValidator, TextInput, ToastService } from '@shared/ui-components';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'lib-reset-password',
  imports: [TextInput, ReactiveFormsModule, Loader, TranslatePipe],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  password_confirmation = new FormControl('', [Validators.required]);
  toastService = inject(ToastService)
  loading = false
  get passwordMismatchError() {
    return this.form.errors?.['passwordMismatch'] &&
      this.password_confirmation.touched;
  }
  router = inject(Router)
  activatedRoute = inject(ActivatedRoute)
  token = this.activatedRoute.snapshot.paramMap.get('token');
  authService = inject(AuthService)
  form = new FormGroup({
    password: new FormControl('', [Validators.required]),
    password_confirmation: this.password_confirmation
  },
    { validators: passwordMatchValidator() });

  onSubmit() {
    if (this.form.valid && this.token) {
      this.loading = true
      this.authService.resetPassword({
        password: this.form.controls.password.value!,
        token: this.token!
      }).subscribe({

        next: () => {
          this.toastService.show('labels.password_changed', 'success')
          this.navto()
        },
        error: () => this.toastService.show('errors.oups', 'success')
      })
    }

  }
  navto() {
    this.router.navigateByUrl('')
  }
}
