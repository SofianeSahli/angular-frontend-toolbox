import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Loader, RippleDirective, TextInput } from '@shared/ui-components';
import { authStore } from '../auth.signals';

@Component({
  selector: 'lib-login',
  imports: [
    ReactiveFormsModule,
    Loader,
    TranslateModule,
    RippleDirective,
    RouterModule, TextInput
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  store = inject(authStore);
  loading = this.store.isLoading;
  translateService = inject(TranslateService);
  router = inject(Router);
  REGISTER_ROUTE = 'register';
  RESET_ROUTE = 'reset-password'
  form = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  });

  onSubmit() {
    if (this.form.valid) {
      this.store.login(
        this.form.getRawValue() as { username: string; password: string }
      );
    }
  }

  navto() {
    this.router.navigate([this.REGISTER_ROUTE], {
      relativeTo: null,
    });
  }

  sendResetPasswordEmail() {
    this.router.navigate([this.RESET_ROUTE], {
      relativeTo: null,
    });
  }
}
