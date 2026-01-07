import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { TextInput, ToastService } from "@shared/ui-components";
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'lib-request-reset-password',
  imports: [TranslatePipe, TextInput],
  templateUrl: './request-reset-password.html',
  styleUrl: './request-reset-password.scss',
})
export class RequestResetPassword {
  accountId = ''
  authService = inject(AuthService)
  router = inject(Router)
  toastService = inject(ToastService)
  valueChanged(event: string) {
    this.accountId = event
  }

  navTo() {
    this.router.navigate([''])
  }
  sbumit() {
    if (this.accountId) {
      this.authService.resetPasswordRequest(this.accountId).subscribe(() => this.navTo())
    } else {
      this.toastService.show('errors.input_enpty', "danger")
    }
  }
}
