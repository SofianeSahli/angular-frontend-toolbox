import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { User, withLoader } from '@shared/stores';
import { catchError, exhaustMap, firstValueFrom, of, pipe, switchMap, tap } from 'rxjs';
import { AUTH_CONFIG } from '../services/auth.config';
import { ACCESS_TOKEN_KEY, AuthService, LoginResponse } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  profile?: User | null;
}

const authInitialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  profile: null,
};
export interface RegisterBody { username: string, password: string, password_confirmation: string }
export const authStore = signalStore(
  { providedIn: 'root' },
  withState(authInitialState),
  withLoader(),

  withMethods((store: any) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const config = inject(AUTH_CONFIG);
    const profileService = inject(ProfileService);

    return {
      login: rxMethod<{ username: string, password: string }>(pipe(
        tap(() => store.setLoading(true)),
        exhaustMap((data) => {
          return authService.login(data.username, data.password).pipe(
            switchMap((response) => {
              patchState(store, {
                accessToken: response.access_token,
                refreshToken: response.refresh_token,
                authData: response.authData
              })
              return profileService.get().pipe(
                tap((profile) => {
                  store.setLoading(false);
                  patchState(store, { profile });
                  router.navigate([config.homeRoute ?? '/home']);
                }), catchError((err) => {
                  if (err.status === 404) {
                    router.navigate([config.homeRoute ?? '/home']);
                  }
                  store.setLoading(false);
                  return of(null);
                })
              )
            }),
            catchError(() => {
              store.setLoading(false);
              return of(null);
            })
          );
        })
      )),
      register: rxMethod<RegisterBody>(pipe(
        tap(() => store.setLoading(true)),
        exhaustMap((registerBody: RegisterBody) => {
          return authService.register(registerBody).pipe(
            tap(() => {
              store.setLoading(false);
              router.navigate(['/']);
            }
            ), catchError(() => {
              store.setLoading(false);
              return of(null);
            }))
        }
        )
      )),

      async validateSession() {
        await firstValueFrom(authService.validateToken())
          .then((valid) => {
            if (valid) {
              router.navigate([config.homeRoute ?? '/home']);
              patchState(store, {
                accessToken: authService.getAccessToken(),
                refreshToken: authService.getRefreshToken(),
              });
            }
          })
          .catch(() => {
            store.setLoading(false);
          })
          .finally(() => store.setLoading(false));
      },

      async refreshTokens() {
        patchState(store, { isLoading: true });
        await firstValueFrom(authService.refreshAccessToken())
          .then((response: LoginResponse) => {
            if (response) {
              patchState(store, {
                accessToken: authService.getAccessToken(),
                refreshToken: authService.getRefreshToken(),
                authData: response.authData

              });
            }
          })
          .catch(() => {
            store.setLoading(false);
          })
          .finally(() => {
            store.setLoading(false);
          });
      },

      logout() {

        authService.logout();
        patchState(store, {
          accessToken: null,
          refreshToken: null,
          profile: null,
        });
        router.navigateByUrl('/')
      },

      async updatePassword(oldPassword: string, newPassword: string) {
        store.setLoading(true);
        try {
          await firstValueFrom(
            authService.updatePassword(oldPassword, newPassword)
          );
        } finally {
          store.setLoading(false);
        }
      },

      async checkUsername(username: string) {
        store.setLoading(true);
        try {
          const res = await firstValueFrom(
            authService.checkUsername(username)
          );
          return res;
        } finally {
          store.setLoading(false);
        }
      },

      fetchProfile: rxMethod<void>(pipe(
        tap(() => store.setLoading(true)),
        exhaustMap(() => {
          return profileService.get().pipe(
            tap((profile) => {
              store.setLoading(false);
              patchState(store, { profile });
            }),
            catchError(() => {
              store.setLoading(false);
              return of(null);
            })
          );
        }))),

      /** ✏️ Update profile */
      async updateProfile(profileData: User) {
        store.setLoading(true);
        try {
          const updatedProfile = await firstValueFrom(
            profileService.patchProfile(profileData)
          );
          store.setLoading(false);

          patchState(store, { profile: updatedProfile });
        } finally {
          store.setLoading(false);
        }
      },
    };
  }
  ),
  withHooks({
    onInit: (store) => {
      const router = inject(Router);
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        router.navigateByUrl('');
      } else {
        store.validateSession();
        store.fetchProfile();
      }
    },
  })
);
