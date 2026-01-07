import { Component, inject, PLATFORM_ID } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Loader, passwordMatchValidator, TextInput, usernameValidator } from '@shared/ui-components';
import { authStore, RegisterBody } from '../auth.signals';

@Component({
  selector: 'lib-register',
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    Loader,

    TextInput
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  plateformId = inject(PLATFORM_ID);
  store = inject(authStore);
  username = new FormControl('', [Validators.required, usernameValidator])
  password_confirmation = new FormControl('', [Validators.required]);
  router = inject(Router)
  form = new FormGroup({
    username: this.username,
    password: new FormControl('', [Validators.required]),
    password_confirmation: this.password_confirmation
  },
    { validators: passwordMatchValidator() });

  get passwordMismatchError() {
    return this.form.errors?.['passwordMismatch'] &&
      this.password_confirmation.touched;
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.store.register(this.form.getRawValue() as RegisterBody);
    }
  }

  navto() {
    this.router.navigate([''])
  }
}
