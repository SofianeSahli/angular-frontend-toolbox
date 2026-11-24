# 005 — Identity: Design

> Status: Approved with the requirements (2026-11-23; the owner skipped the approval stops for this spec)
> Requirements: [requirements.md](./requirements.md) (revision 2)

## Placement

```
shared/http/data-access/        @shared/http-data-access        scope:shared type:data-access
  provide-api.ts                provideApi, API_CONFIG, csrfCookieUrl()
  api-error.ts                  ApiError, ApiErrorKind, toApiError()
  api.interceptor.ts            apiInterceptor (headers, XSRF, 419 retry, mapping, ErrorBus)
  handled-errors.ts             HANDLED_ERROR_CODES (HttpContextToken), handling(...codes)
  error-bus.ts                  ErrorBus (signal)
  session-expiry.ts             SESSION_EXPIRY token (implemented by identity)
shared/http/feature-errors/     @shared/http-feature-errors     scope:shared type:feature
  provide-error-presenter.ts, error-presenter.ts (component), server-error-dialog.ts, i18n/{fr,en,ar}.json
shared/identity/data-access/    @shared/identity-data-access    scope:shared type:data-access
  models.ts, auth-api.ts, auth-strategy.ts (Cookie + Token stub), session.store.ts,
  provide-identity.ts (IDENTITY_CONFIG), guards.ts, return-url.ts
shared/identity/feature-auth/   @shared/identity-feature-auth   scope:shared type:feature
  pages/{sign-in, sign-up, email-code, two-factor, forgot-password, reset-password, account, unavailable}
  shared/{server-errors.ts, countdown.ts, or-divider (styles), google-button}, i18n/{fr,en,ar}.json
libs/expenses/shell/            @expenses/shell                 scope:expenses type:feature
  signed-in-shell.ts (ui-app-shell + rail/top bar/tabs + error presenter)
apps/expenses-management/       app: routes, config, AuthFrame (brand panel + language switch),
                                LanguageService, merged translation loader, i18n/{fr,en,ar}.json, logo SVG
```

The dependency directions follow ARCHITECTURE §3:
- features → data-access → data-access;
- `http/feature-errors` does not import identity. It uses the `SESSION_EXPIRY` token, which `http/data-access` defines and `provideIdentity` provides.

## HTTP (US-1)

- **`provideApi({ baseUrl })`** returns:
  - `provideHttpClient(withFetch(), withInterceptors([apiInterceptor]), withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }))`;
  - `{ provide: API_CONFIG, useValue }`.

  `csrfCookieUrl(config)` is `new URL(config.baseUrl).origin + '/sanctum/csrf-cookie'`.
- **`apiInterceptor`** (functional), for API requests only (REQ-1.1–1.3):
  - clones the request with `withCredentials`, `Accept`, `X-Request-Id` (`crypto.randomUUID()`) and `X-XSRF-TOKEN` read from `document.cookie` (URL-decoded);
  - `catchError`:
    - 419 → fetch the CSRF cookie, re-send once with a fresh XSRF header;
    - otherwise `toApiError()`, publish on `ErrorBus` unless `kind === 'validation'` or the code is in the request's `HANDLED_ERROR_CODES`, then `throwError` with the `ApiError`.
- **`toApiError(HttpErrorResponse, requestId)`:**
  - status 0 → `offline`;
  - otherwise map the status to a kind (REQ-1.4, REQ-1.7);
  - parse the envelope safely: a missing or invalid body gives the code `http.<status>`;
  - `retryAfterSeconds` comes from the body or the `Retry-After` header.
- **`ErrorBus`:** `latest = signal<{ error: ApiError; sequence: number } | null>`, with `publish(error)`.
- **`handling(...codes)`:** returns `HttpContext` with the codes the caller handles (REQ-1.6). `AuthApi` methods take it.

## Error presenter (US-2)

`provideErrorPresenter()` provides the presenter's i18n namespace. `<shared-error-presenter />` (selector `shared-error-presenter`) holds an `effect` on `ErrorBus.latest`:

| Kind | Action |
|---|---|
| `unauthenticated` with `SESSION_EXPIRY.isSignedIn()` | `expire()`, toast `errors.sessionExpired`, `router.navigateByUrl(SESSION_EXPIRY.signInUrl(router.url))` |
| `offline` | one toast `errors.offline`, deduplicated while it is on screen (dismiss handle kept) |
| `forbidden`, `not-found`, `throttled`, `conflict` | toast `errors.codes.<code>` or `errors.kinds.<kind>` (`{{seconds}}` for throttled) |
| `server`, `csrf` | `UiDialog.open(ServerErrorDialog, { data: error })`: title, text, request id in `<code>`, "Fermer", "Réessayer" (`router.navigateByUrl(router.url, { onSameUrlNavigation: 'reload' })`) |

## Identity data-access (US-3)

- **Models:**
  - `Account { id, name, email, phone: string | null, locale: 'fr' | 'en', twoFactorEnabled }`, mapped from snake_case;
  - `Session = { status: 'signed_in', account } | { status: 'code_required', pendingSignIn, expiresInSeconds }`.
- **`AuthApi`:** one method per endpoint, each returning `Observable`, with request bodies in snake_case. Every call takes an optional `HttpContext` from `handling(...)`.
- **`AuthStrategy`** (`AUTH_STRATEGY` token):
  - `prepare(): Observable<void>` (cookie: GET the CSRF cookie);
  - `signInExtras(): Record<string, string>` (cookie: `{}`; token: `device_id`);
  - `signedIn(session)`, `signedOut()` (cookie: no-op).

  `TokenAuthStrategy` throws `Error('TokenAuthStrategy is not implemented (spec 009)')` from each method.
- **`SessionStore`:** `signalStore({ providedIn: 'root' }, withState(...), withComputed(...), withMethods(...))`.
  - **State:** `status`, `account`, `pendingTwoFactor`, `pendingEmail`, `returnUrl`, `restoring`, `unavailable`.
  - **Methods:** `async` functions over `firstValueFrom`, each in `try/catch`, returning `AuthResult = { outcome: 'done' } | { outcome: 'two-factor' } | { outcome: 'error'; error: ApiError }`. No `rxMethod`, so there's no stream that an error could end.
  - **`restore()`:** `restoring: true`, then `prepare()`, then `GET me`:
    - OK → `authenticated`;
    - 401 → `anonymous`;
    - offline or server → `unavailable: true`, with the status kept `unknown`.

    Its calls carry `handling('auth.unauthenticated')`, and the store reads the outcome directly. An offline or server failure *is* published to the bus, so the presenter shows it, which REQ-3.3 allows.
- **`provideIdentity(config)`** provides:
  - `IDENTITY_CONFIG`;
  - `AUTH_STRATEGY` (cookie);
  - `SESSION_EXPIRY`, backed by the store: `isSignedIn` = `authenticated`, `expire` = status `expired`, `signInUrl(url)` = sign-in path with `returnUrl`.

  `config.paths`: `signIn`, `signUp`, `emailCode`, `twoFactor`, `forgotPassword`, `resetPassword`, `unavailable`.
- **Guards:** `authGuard` and `guestGuard` are functional `CanActivateFn`. They wait until `restoring` is false (`toObservable` + `filter` + `take(1)`), then:
  - unavailable → `UrlTree` to `paths.unavailable?returnUrl=<url>`;
  - not allowed → `UrlTree` to `signIn?returnUrl=<url>` (auth) or `afterSignIn` (guest).
- **`safeReturnUrl(value)`:** a string that starts with `/`, not `//`, with no `:` before the first `/` → the value; else `/`.

## Identity pages (US-4–US-7)

Each page is a standalone routed component rendered inside the app's frame. The frame is the app's `AuthFrame`, which owns `ui-auth-layout`, the brand panel and the language switch (REQ-8.1); the pages render only their content (h1, form, links). The account page renders `ui-page` inside the shell.

- **Forms:** reactive forms with `ui-form-field`, built-in validators (`required`, `email`, `minLength(8)`, `maxLength(120)`, `requiredTrue` for terms).
- **Client messages:** they come from `UI_TEXT.errors`, which the app provides through translations (see Languages).
- **Server errors:** `applyServerErrors(form, error, translate)` sets `control.setErrors({ server: { message } })` and marks the control touched. Each page passes `[errors]="{ server: '{{message}}' }"` to its fields. The message is `identity.errors.<code>` (for example `password.min`), else `identity.errors.<field>`.
- **Messages above the form:** `ui-alert tone="danger"` (`role=alert`).
- **`countdown(seconds)`:** a helper returning a signal that counts down to 0 with a `setInterval`, cleaned with `DestroyRef`. It drives the resend countdown (60 s, or `retryAfterSeconds`) and the throttle lock.
- **Handled codes per call (REQ-4.10):**
  - sign-in: `auth.invalid_credentials`, `auth.email_unconfirmed`, `auth.password_locked`, `request.throttled`;
  - register: `email.taken`, `request.throttled`;
  - two-factor: `auth.pending_invalid`, `request.throttled`;
  - Google: `auth.google_invalid`, `auth.google_unavailable`, `auth.google_email_conflict`;
  - account: `two_factor.already_enabled`, `two_factor.not_enabled`.
- **Navigation after a sign-in:** `router.navigateByUrl(safeReturnUrl(store.returnUrl()) ?? afterSignIn)`. The sign-in and sign-up pages copy `?returnUrl` into the store, so it survives the email-code and two-factor steps.
- **Divider:** a local `.identity-or` style in the sign-in and sign-up pages, a flex row with two `--ui-color-line` hairlines and caption text.
- **Unavailable page:** a full-page `ui-empty-state` with a Retry button that calls `restore()`, then `navigateByUrl(returnUrl)`.

## Google (US-6, last task)

Google Identity Services can return an `id_token` only through its own rendered button (or One Tap), not through a custom button. `GoogleButton` therefore:
- loads `https://accounts.google.com/gsi/client` once with a `<script>` element;
- calls `google.accounts.id.initialize({ client_id, callback })` and `renderButton(host, { theme, text: 'continue_with', locale })`;
- passes the credential to `store.signInWithGoogle(idToken, termsAccepted)`.

`auth.terms_required` shows the terms checkbox with a "Continuer" button that re-sends the same token with `terms_version`. **Deviation:** the button is Google's own, not a `uiButton` secondary.

## Expenses app (US-8, US-9)

- **Routes:**

  ```ts
  { path: '', component: AuthFrame, canActivate: [guestGuard], children: [connexion, connexion/code, inscription, inscription/code, mot-de-passe-oublie, mot-de-passe/nouveau] },
  { path: '', component: SignedInShell, canActivate: [authGuard], children: [{ path: '', Home }, { path: 'compte', AccountPage }] },
  { path: 'conditions' | 'confidentialite', LegalPlaceholder }, { path: 'indisponible', UnavailablePage }, { path: '**', redirectTo: '' }
  ```

  The first parent has no empty child, so `/` falls through to the shell.
- **`SignedInShell`** (`libs/expenses/shell`):
  - `ui-app-shell` with the side rail (logo SVG from `public/images/olivier.svg`, the disabled "Ajouter une dépense", items with `routerLink` and `routerLinkActive`, and an account footer with the name and a sign-out button);
  - a top bar showing the route's `title` from the router (`TitleStrategy`-free: `ActivatedRoute` data);
  - bottom tabs;
  - `<shared-error-presenter />`.
- **`AuthFrame`** (app): `ui-auth-layout` with `<app-brand-panel uiAuthBrand />`, `<app-language-switch uiAuthToolbar />` (a `ui-segmented-control` FR / EN / ع) and `<router-outlet />`. It also holds an error presenter, so the signed-out pages show offline and server errors too.
- **`LanguageService`** (app):
  - `language` signal: from `ui.lang`, else `fr`;
  - `use(lang)`: `translate.use`, `<html lang>` and `dir`, storage in `try`/`catch`;
  - an `effect` on `SessionStore.account()?.locale` applies the account rule (REQ-10.3, with the `ar` exception).
- **Translations:**
  - `MergedTranslateLoader` (app) fetches `/i18n/{lang}.json`, `/i18n/identity/{lang}.json` and `/i18n/errors/{lang}.json` and deep-merges them;
  - the library JSON files are copied by the app's `assets` (inputs `shared/identity/feature-auth/src/i18n` and `shared/http/feature-errors/src/i18n`);
  - `UI_TEXT` is provided from translations: an object whose properties are getters reading `ui.*` keys, so built-in toolbox strings follow the language.
- **Initializer:** `provideAppInitializer(() => { void inject(SessionStore).restore(); inject(LanguageService); })`. Guards wait for `restoring`, so the first route never resolves early.
- **Environment:** `termsVersion: '2026-11'`, `googleClientId: ''`.

## Requirement coverage
| REQ | Where |
|---|---|
| 1.x | http/data-access (interceptor, ApiError, ErrorBus, handling) |
| 2.x | http/feature-errors |
| 3.1–3.11 | identity/data-access (AuthApi, SessionStore, strategy, guards, provideIdentity, safeReturnUrl) |
| 4.x, 5.x, 7.x, 8.x | identity/feature-auth pages |
| 6.x | GoogleButton (last task) |
| 9.x | app routes, AuthFrame, SignedInShell, environment, brand panel |
| 10.x | LanguageService, MergedTranslateLoader, i18n files |
| 11.x | tests per task; CLAUDE.md and ARCHITECTURE updates |

## Risks / alternatives considered
- **Angular's XSRF interceptor** skips cross-origin requests, so ours sets the header. `withXsrfConfiguration` is kept only for same-origin production.
- **`SessionStore` methods as `rxMethod`** were rejected: pages need a result per call, and async methods with `try/catch` cannot leave a dead stream.
- **`UI_TEXT` through getters:** a component already on screen updates on its next change detection, not at the instant of a language switch. Every screen here re-renders on navigation, and the language switch is on the auth pages, so this is acceptable.
