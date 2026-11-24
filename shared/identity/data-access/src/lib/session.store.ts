import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { ApiError, handling } from '@shared/http-data-access';
import { Observable, firstValueFrom } from 'rxjs';
import { AuthApi } from './auth-api';
import { AUTH_STRATEGY } from './auth-strategy';
import { IDENTITY_CONFIG } from './identity-config';
import { Account, GoogleSignInRequest, RegisterRequest, Session } from './models';

export type SessionStatus = 'unknown' | 'anonymous' | 'authenticated' | 'expired';

export interface PendingTwoFactor {
  readonly pendingSignIn: string;
  readonly expiresAt: number;
  readonly email: string | null;
}

export type AuthResult = { readonly outcome: 'done' } | { readonly outcome: 'two-factor' } | { readonly outcome: 'error'; readonly error: ApiError };

interface SessionState {
  status: SessionStatus;
  account: Account | null;
  pendingTwoFactor: PendingTwoFactor | null;
  pendingEmail: string | null;
  returnUrl: string | null;
  restoring: boolean;
  unavailable: boolean;
}

const initialState: SessionState = {
  status: 'unknown',
  account: null,
  pendingTwoFactor: null,
  pendingEmail: null,
  returnUrl: null,
  restoring: false,
  unavailable: false,
};

const SIGNED_OUT: Partial<SessionState> = {
  status: 'anonymous',
  account: null,
  pendingTwoFactor: null,
  pendingEmail: null,
  unavailable: false,
};

const DONE: AuthResult = { outcome: 'done' };
const MILLISECONDS_PER_SECOND = 1000;

function failure(error: unknown): AuthResult {
  if (error instanceof ApiError) return { outcome: 'error', error };
  throw error;
}

function missingPendingSignIn(): AuthResult {
  return { outcome: 'error', error: new ApiError('unauthenticated', 401, 'auth.pending_invalid', {}, null, '') };
}

function isUnauthenticated(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'unauthenticated';
}

export const SessionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isAuthenticated: computed(() => store.status() === 'authenticated'),
  })),
  withMethods((store, api = inject(AuthApi), strategy = inject(AUTH_STRATEGY), config = inject(IDENTITY_CONFIG)) => {
    async function attempt(call: () => Observable<unknown>): Promise<AuthResult> {
      try {
        await firstValueFrom(call(), { defaultValue: undefined });
        return DONE;
      } catch (error) {
        return failure(error);
      }
    }

    function applySession(session: Session, email: string | null): AuthResult {
      strategy.signedIn(session);
      if (session.status === 'code_required') {
        const expiresAt = Date.now() + session.expiresInSeconds * MILLISECONDS_PER_SECOND;
        patchState(store, { pendingTwoFactor: { pendingSignIn: session.pendingSignIn, expiresAt, email } });
        return { outcome: 'two-factor' };
      }
      patchState(store, { status: 'authenticated', account: session.account, pendingTwoFactor: null, pendingEmail: null, unavailable: false });
      return DONE;
    }

    async function signInWith(call: () => Observable<Session>, email: string | null): Promise<AuthResult> {
      try {
        await firstValueFrom(strategy.prepare(), { defaultValue: undefined });
        return applySession(await firstValueFrom(call()), email);
      } catch (error) {
        return failure(error);
      }
    }

    function clearSession(): void {
      strategy.signedOut();
      patchState(store, SIGNED_OUT);
    }

    return {
      async restore(): Promise<void> {
        patchState(store, { restoring: true });
        try {
          await firstValueFrom(strategy.prepare(), { defaultValue: undefined });
          const account = await firstValueFrom(api.me(handling('auth.unauthenticated')));
          patchState(store, { status: 'authenticated', account, unavailable: false });
        } catch (error) {
          if (isUnauthenticated(error)) patchState(store, { status: 'anonymous', account: null, unavailable: false });
          else patchState(store, { unavailable: true });
        } finally {
          patchState(store, { restoring: false });
        }
      },

      async refreshAccount(): Promise<AuthResult> {
        try {
          const account = await firstValueFrom(api.me());
          patchState(store, { account });
          return DONE;
        } catch (error) {
          return failure(error);
        }
      },

      rememberReturnUrl(returnUrl: string | null): void {
        patchState(store, { returnUrl });
      },

      expire(): void {
        strategy.signedOut();
        patchState(store, { status: 'expired', account: null, pendingTwoFactor: null, pendingEmail: null });
      },

      async register(request: RegisterRequest, codes: readonly string[] = []): Promise<AuthResult> {
        const result = await attempt(() => api.register(request, config.termsVersion, handling(...codes)));
        if (result.outcome === 'done') patchState(store, { pendingEmail: request.email });
        return result;
      },

      resendCode(email: string, codes: readonly string[] = []): Promise<AuthResult> {
        patchState(store, { pendingEmail: email });
        return attempt(() => api.resendEmailCode(email, handling(...codes)));
      },

      confirmEmail(email: string, code: string, codes: readonly string[] = []): Promise<AuthResult> {
        return signInWith(() => api.confirmEmail(email, code, strategy.signInExtras(), handling(...codes)), email);
      },

      signIn(email: string, password: string, codes: readonly string[] = []): Promise<AuthResult> {
        return signInWith(() => api.login(email, password, strategy.signInExtras(), handling(...codes)), email);
      },

      signInWithGoogle(request: GoogleSignInRequest, codes: readonly string[] = []): Promise<AuthResult> {
        return signInWith(() => api.google(request, strategy.signInExtras(), handling(...codes)), null);
      },

      async confirmTwoFactor(code: string, codes: readonly string[] = []): Promise<AuthResult> {
        const pending = store.pendingTwoFactor();
        if (!pending) return missingPendingSignIn();
        return signInWith(() => api.confirmTwoFactor(pending.pendingSignIn, code, handling(...codes)), pending.email);
      },

      async resendTwoFactor(codes: readonly string[] = []): Promise<AuthResult> {
        const pending = store.pendingTwoFactor();
        if (!pending) return missingPendingSignIn();
        return attempt(() => api.resendTwoFactor(pending.pendingSignIn, handling(...codes)));
      },

      async forgotPassword(email: string, codes: readonly string[] = []): Promise<AuthResult> {
        const result = await attempt(() => api.forgotPassword(email, handling(...codes)));
        if (result.outcome === 'done') patchState(store, { pendingEmail: email });
        return result;
      },

      async resetPassword(email: string, code: string, password: string, codes: readonly string[] = []): Promise<AuthResult> {
        const result = await attempt(() => api.resetPassword(email, code, password, handling(...codes)));
        if (result.outcome === 'done') patchState(store, { pendingEmail: null });
        return result;
      },

      async signOut(): Promise<AuthResult> {
        const result = await attempt(() => api.logout(handling('auth.unauthenticated')));
        if (result.outcome === 'done' || (result.outcome === 'error' && isUnauthenticated(result.error))) {
          clearSession();
          return DONE;
        }
        return result;
      },

      async enableTwoFactor(codes: readonly string[] = []): Promise<AuthResult> {
        const result = await attempt(() => api.enableTwoFactor(handling(...codes)));
        if (result.outcome === 'done') setTwoFactor(true);
        return result;
      },

      requestDisableCode(codes: readonly string[] = []): Promise<AuthResult> {
        return attempt(() => api.requestDisableTwoFactorCode(handling(...codes)));
      },

      async disableTwoFactor(code: string, codes: readonly string[] = []): Promise<AuthResult> {
        const result = await attempt(() => api.disableTwoFactor(code, handling(...codes)));
        if (result.outcome === 'done') setTwoFactor(false);
        return result;
      },
    };

    function setTwoFactor(twoFactorEnabled: boolean): void {
      const account = store.account();
      if (account) patchState(store, { account: { ...account, twoFactorEnabled } });
    }
  }),
);

export type SessionStore = InstanceType<typeof SessionStore>;
