import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthResult, IDENTITY_CONFIG, SessionStore, safeReturnUrl } from '@shared/identity-data-access';

@Injectable({ providedIn: 'root' })
export class AuthNavigation {
  private readonly router = inject(Router);
  private readonly store = inject(SessionStore);
  readonly config = inject(IDENTITY_CONFIG);

  rememberReturnUrl(value: unknown): void {
    this.store.rememberReturnUrl(safeReturnUrl(value));
  }

  async afterSignInStep(result: AuthResult): Promise<void> {
    if (result.outcome === 'two-factor') await this.router.navigateByUrl(this.config.paths.twoFactor);
    if (result.outcome === 'done') await this.router.navigateByUrl(safeReturnUrl(this.store.returnUrl()) ?? this.config.afterSignIn);
  }

  go(path: string): Promise<boolean> {
    return this.router.navigateByUrl(path);
  }
}
