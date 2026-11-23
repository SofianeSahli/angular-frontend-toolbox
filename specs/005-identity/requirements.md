# 005 — Identity: Requirements

> Status: Draft, revision 1 (2026-11-23). Open questions 1–9 below.
> Scope:
> - **Toolbox (`scope:shared`):** `shared/http/data-access`, `shared/http/feature-errors`, `shared/identity/data-access`, `shared/identity/feature-auth`;
> - **App (`scope:expenses`):** `libs/expenses/shell`, plus the sign-in, sign-up and account screens of `expenses-management`, working against the real backend.
>
> Backend contracts:
> - [`personal-accountings-backend/specs/001-foundations/contract.md`](../../../personal-accountings-backend/specs/001-foundations/contract.md): envelope, `X-Request-Id`, global error codes;
> - [`personal-accountings-backend/specs/002-accounts/contract.md`](../../../personal-accountings-backend/specs/002-accounts/contract.md): every endpoint below.
>
> Design source:
> - the mockups canvas "Dépenses — maquettes de l'app (Olivier)", section 1 (`Main`: create account; `Verify`: email code) and section 5 (`ArRegister`: Arabic create account);
> - the spec 004 components.
>
> Architecture: [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) §2 (identity and http libraries), §3, §4, §8.

## Context

Specs 002–004 built the toolbox UI. From this spec on, every spec delivers the shared toolbox part **and** the expenses app part that uses it. A spec is done only when a real screen of `expenses-management` works against the real backend at `environment.apiBaseUrl`.

The backend (spec 002 "Accounts") offers email sign-up with a 6-digit code, email sign-in, optional two-step sign-in by emailed code, password reset by code, Google sign-in, `GET me` and sign-out.
- **Web clients:** use Sanctum's cookie mode: `GET /sanctum/csrf-cookie`, then the session cookie and an `X-XSRF-TOKEN` header on every request.
- **Mobile clients:** use a bearer token and a `device_id`. That is spec 009.

The development backend already allows `http://localhost:4200`: `SANCTUM_STATEFUL_DOMAINS=localhost:4200`, CORS with credentials, and a `lax` session cookie.

Today the app has one placeholder page and no HTTP code. Spec 002 deleted the old `shared/auth`, and with it the old interceptors and the old API paths.

## User stories

- **US-1 — API calls.** As a toolbox developer, I want one configured HTTP layer that talks to the backend the way it expects (cookies, CSRF, JSON, request ids) and turns its error envelope into typed errors, so that no feature handles transport details.
- **US-2 — Error presentation.** As a user, I want problems I can't fix in a form (lost connection, server error, expired session, refusal) explained once, in my language, with a way forward.
- **US-3 — Session.** As a user, I want to stay signed in across reloads while my session lasts, and be sent to sign-in when it ends.
- **US-4 — Create an account.** As a visitor, I want to create an account with my name, email and a password, confirm my email with a code, and land signed in.
- **US-5 — Sign in.** As a user, I want to sign in with my email and password, pass the emailed two-step code when it's on, and recover a forgotten password with a code.
- **US-6 — Google.** As a visitor or user, I want to continue with Google when the app offers it.
- **US-7 — Account.** As a signed-in user, I want to see my account details, turn two-step sign-in on or off, and sign out.
- **US-8 — Signed-in frame.** As a signed-in user, I want the app's navigation around every screen: a rail on desktop, a top bar and tabs on phones.
- **US-9 — Languages.** As a user, I want the app in French, English or Arabic (right to left), and my choice remembered.

## Acceptance criteria (EARS)

### US-1 — HTTP layer (`shared/http/data-access`, `type:data-access`)
- **REQ-1.1** THE SYSTEM SHALL provide `provideApi({ baseUrl })` and an `API_CONFIG` token. An **API request** is a request whose URL starts with `baseUrl`, or the CSRF cookie request `<origin of baseUrl>/sanctum/csrf-cookie`.
- **REQ-1.2** WHEN an API request is sent THE SYSTEM SHALL:
  - set `withCredentials`;
  - add `Accept: application/json`;
  - add `X-Request-Id` with a new UUID;
  - add `X-XSRF-TOKEN` from the `XSRF-TOKEN` cookie when that cookie exists. Angular's built-in XSRF support skips cross-origin URLs, and in development the API is cross-origin to the app.
- **REQ-1.3** THE SYSTEM SHALL leave non-API requests (translation files, Google scripts) untouched.
- **REQ-1.4** WHEN an API request fails THE SYSTEM SHALL turn the failure into an `ApiError`, which has:
  - `kind`: `validation` (422 `validation.failed`), `unauthenticated` (401), `forbidden` (403), `not-found` (404), `conflict` (409), `csrf` (419), `throttled` (429), `server` (5xx and any other status), or `offline` (no response);
  - `status` and `code` (from the envelope, or a fixed code when there's no envelope);
  - `fields`, mapping each failing field path to its codes, when present;
  - `retryAfterSeconds`, from the envelope or the `Retry-After` header, when present;
  - `requestId`, from the response's `X-Request-Id`, else the one sent.
- **REQ-1.5** WHEN an API request fails with `419 auth.csrf_mismatch` THE SYSTEM SHALL fetch the CSRF cookie and retry the request once. IF the retry fails THEN the second error is the result.
- **REQ-1.6** THE SYSTEM SHALL provide an `ErrorBus` (a signal of the latest error, with a counter so the same error can repeat). Every API error except `validation` is published on it, **unless the request declared that it handles that error code itself** (REQ-4.10).
- **REQ-1.7** IF the response is a 422 whose code is not `validation.failed` (for example `code.invalid`, `auth.terms_required`) THEN `kind` is `validation` and `fields` is empty, so the page handles it.

### US-2 — Error presenter (`shared/http/feature-errors`, `type:feature`)
- **REQ-2.1** THE SYSTEM SHALL provide `provideErrorPresenter()` and a component placed once in the app's shell, which reacts to each `ErrorBus` error.
- **REQ-2.2** WHEN an `unauthenticated` error arrives while the session is `authenticated` THE SYSTEM SHALL:
  - mark the session `expired`;
  - show a toast ("Votre session a expiré");
  - go to the sign-in path, keeping the current URL to return to after sign-in (open question 5).
- **REQ-2.3** WHEN an `offline` error arrives THE SYSTEM SHALL show one toast (danger) saying the connection is lost. Several offline errors in a row show one toast, not one each.
- **REQ-2.4** WHEN a `forbidden`, `not-found`, `throttled` or `conflict` error arrives THE SYSTEM SHALL show a toast with the translated message for its code, or a generic message for its kind. A `throttled` message includes the wait in seconds.
- **REQ-2.5** WHEN a `server` or `csrf` error arrives THE SYSTEM SHALL show a dialog with a short explanation, the request id (selectable text, so it can be quoted to support) and a Retry button (open question 1).
- **REQ-2.6** THE SYSTEM SHALL ship the presenter's texts in fr, en and ar, under its own translation namespace (`errors.*`).

### US-3 — Session (`shared/identity/data-access`, `type:data-access`)
- **REQ-3.1** THE SYSTEM SHALL provide `AuthApi`, a typed client for these endpoints:
  - `auth/email/register`, `resend`, `confirm`, `login`;
  - `auth/password/forgot`, `reset`;
  - `auth/google`;
  - `auth/two-factor` and `resend`;
  - `GET me`, `auth/logout`;
  - `me/two-factor` (POST), `me/two-factor/disable-code`, `me/two-factor` (DELETE).

  Requests and responses are typed after the contract (`Account`, `Session` with `signed_in` or `code_required`).
- **REQ-3.2** THE SYSTEM SHALL provide `SessionStore` (NgRx Signals). Its state holds:
  - `status`: `unknown | anonymous | authenticated | expired`;
  - `account`;
  - `pendingTwoFactor`: the pending sign-in token, its expiry and the email;
  - `pendingEmail`: the address waiting for confirmation or reset.

  `pendingTwoFactor` and `pendingEmail` are kept in memory only, never in storage.
- **REQ-3.3** WHEN the app starts THE SYSTEM SHALL `restore()` the session: fetch the CSRF cookie, then `GET me`.
  - success → `authenticated` with the account;
  - 401 → `anonymous`;
  - IF it fails offline or with a server error THEN see open question 2.

  The 401 from `restore()` is never shown to the user.
- **REQ-3.4** THE SYSTEM SHALL offer `register`, `resendCode`, `confirmEmail`, `signIn`, `confirmTwoFactor`, `resendTwoFactor`, `forgotPassword`, `resetPassword`, `signInWithGoogle`, `signOut`, `enableTwoFactor`, `requestDisableCode` and `disableTwoFactor`. Each one:
  - resolves to a result the page can act on (success, a next step, or an `ApiError`);
  - catches its errors, so the store keeps working after any failure.
- **REQ-3.5** WHEN a sign-in answers `code_required` (from `confirmEmail`, `signIn` or `signInWithGoogle`) THE SYSTEM SHALL keep `pendingTwoFactor` and report the two-factor step.
- **REQ-3.6** WHEN any sign-in answers `signed_in` THE SYSTEM SHALL become `authenticated` with the account, and clear `pendingTwoFactor` and `pendingEmail`.
- **REQ-3.7** WHEN `signOut` completes, or fails with 401, THE SYSTEM SHALL become `anonymous` and clear the account and all pending state.
- **REQ-3.8** THE SYSTEM SHALL define an `AuthStrategy` interface (how credentials travel and what a sign-in sends), with:
  - `CookieAuthStrategy`, used on the web now;
  - `TokenAuthStrategy`, a stub that throws "not implemented" (spec 009: token in secure storage, `device_id`).
- **REQ-3.9** THE SYSTEM SHALL provide `authGuard` and `guestGuard`. Both wait for the first `restore()` to finish.
  - `authGuard` sends a visitor who is not `authenticated` to the sign-in path, keeping the requested URL;
  - `guestGuard` sends an `authenticated` user to `afterSignIn`.
- **REQ-3.10** THE SYSTEM SHALL provide `provideIdentity({ termsVersion, googleClientId?, afterSignIn, signInPath, paths })`. `paths` names each auth route (sign-up, email code, two-factor, forgot, reset), so the app chooses its own URLs.

### US-4 — Create an account (`shared/identity/feature-auth`, `type:feature`)
- **REQ-4.1** THE SYSTEM SHALL provide a sign-up page on `ui-auth-layout` with these fields:
  - name (required, at most 120);
  - email (required);
  - password (at least 8, with show/hide);
  - phone (optional, with a fixed `+216` prefix, left-to-right);
  - a terms checkbox linking to the terms and privacy paths.

  It also has a "Se connecter" link, and the Google button (REQ-6.1). The register request sends:
  - `terms_version` from `provideIdentity`;
  - `locale` = the current UI language when it is `fr` or `en`, else `fr` (backend gap B1);
  - `phone` as `+216` followed by the digits typed, when one was typed.
- **REQ-4.2** WHEN the sign-up form is submitted with client-side errors (empty, too short, invalid email, terms not checked) THE SYSTEM SHALL mark the fields touched and show each field's message. Nothing is sent.
- **REQ-4.3** WHEN register succeeds (202) THE SYSTEM SHALL keep the email as `pendingEmail` and go to the email-code page.
- **REQ-4.4** IF register answers `409 email.taken` THEN THE SYSTEM SHALL show it on the email field, with a link to sign in.
- **REQ-4.5** THE SYSTEM SHALL provide an email-code page:
  - it shows the address it was sent to and a 6-digit `ui-code-input`;
  - it confirms automatically at the 6th digit, or with the Confirm button;
  - it offers "Renvoyer le code" after a countdown (open question 3), "Ce n'est pas la bonne adresse" (back to sign-up with the fields kept), and a back button.
- **REQ-4.6** WHEN the email code is confirmed THE SYSTEM SHALL sign the user in (REQ-3.6, or REQ-3.5 for two-step) and go to the return URL or `afterSignIn`.
- **REQ-4.7** IF the email-code page opens without a `pendingEmail` (for example after a reload) THEN THE SYSTEM SHALL go to the sign-up page.
- **REQ-4.8** IF a code is wrong (`422 code.invalid`) THEN THE SYSTEM SHALL show the message on the code field and clear the code, so the user can type it again.
- **REQ-4.9** IF the backend answers `422 validation.failed` THEN THE SYSTEM SHALL put each field code on its field, translated (`identity.errors.<field>.<rule>`, with a generic fallback per field).
- **REQ-4.10** On every identity page, the codes the page handles itself are declared on its request, so the error presenter never shows them as well (REQ-1.6):
  - `auth.invalid_credentials`;
  - `auth.email_unconfirmed`;
  - `auth.password_locked`;
  - `auth.pending_invalid`;
  - `email.taken`;
  - `auth.google_*`;
  - `two_factor.*`;
  - `request.throttled` on email and sign-in routes.

### US-5 — Sign in
- **REQ-5.1** THE SYSTEM SHALL provide a sign-in page (email, password with show/hide, "Mot de passe oublié ?", "Créer un compte", Google button).
- **REQ-5.2** IF sign-in answers `401 auth.invalid_credentials` THEN THE SYSTEM SHALL show one generic message above the form ("E-mail ou mot de passe incorrect") without saying which field is wrong, and keep the email.
- **REQ-5.3** IF sign-in answers `403 auth.email_unconfirmed` THEN THE SYSTEM SHALL send a new code (`auth/email/resend`), keep the email as `pendingEmail` and go to the email-code page.
- **REQ-5.4** IF an answer is `429` (`auth.password_locked` or `request.throttled`) THEN THE SYSTEM SHALL:
  - show "Réessayez dans N s", counting down from `retryAfterSeconds`;
  - disable the submit button until it reaches 0.
- **REQ-5.5** THE SYSTEM SHALL provide a two-factor page for `pendingTwoFactor`:
  - a 6-digit code, confirmed at the 6th digit;
  - resend (`auth/two-factor/resend`), which restarts the code's validity;
  - a back link to sign-in.
- **REQ-5.6** IF the two-factor step answers `401 auth.pending_invalid` (expired, ended after 5 wrong codes, or unknown), or the page opens without `pendingTwoFactor`, THEN THE SYSTEM SHALL go to sign-in with the message "Votre connexion a expiré, recommencez."
- **REQ-5.7** THE SYSTEM SHALL provide a forgot-password page (email):
  - on submit it always says a code was sent if an account exists (the API answers 202 for any address);
  - it keeps `pendingEmail` and goes to the reset page.
- **REQ-5.8** THE SYSTEM SHALL provide a reset-password page: the code, a new password (at least 8, show/hide) and resend.
  - On success (204) it goes to sign-in with a success toast ("Mot de passe modifié. Connectez-vous.").
  - `code.invalid` goes on the code field.
  - Opening the page without `pendingEmail` goes to the forgot-password page.

### US-6 — Google (last task)
- **REQ-6.1** WHILE `googleClientId` is set THE SYSTEM SHALL show "Continuer avec Google" on sign-in and sign-up. Without it, no button is shown and the Google script is never loaded.
- **REQ-6.2** WHEN the button is used THE SYSTEM SHALL:
  - load Google Identity Services lazily (once);
  - obtain an `id_token`;
  - send it to `auth/google` with `locale` (as REQ-4.1), and with `terms_version` when the sign-up page's terms box is checked.
- **REQ-6.3** IF `auth/google` answers `422 auth.terms_required` THEN THE SYSTEM SHALL:
  - ask the user to accept the terms in place (the checkbox with its links);
  - resend the same `id_token` with `terms_version` once they accept.
- **REQ-6.4** IF Google answers `auth.google_invalid`, `auth.google_unavailable` or `auth.google_email_conflict`, or the script fails to load, THEN THE SYSTEM SHALL show a message above the form. The conflict message suggests signing in with email.

### US-7 — Account page
- **REQ-7.1** THE SYSTEM SHALL provide an account page that shows name, email, phone (or "non renseigné") and language read-only (backend gap B2), and a "Se déconnecter" button.
- **REQ-7.2** WHEN the user turns two-step sign-in on THE SYSTEM SHALL call `POST me/two-factor`, update the account and confirm with a toast.
- **REQ-7.3** WHEN the user turns two-step sign-in off THE SYSTEM SHALL:
  - request a disable code (`me/two-factor/disable-code`);
  - show a code field;
  - on a valid code, call `DELETE me/two-factor`, update the account and confirm with a toast.

  `code.invalid` goes on the code field.
- **REQ-7.4** IF either call answers `409 two_factor.already_enabled` or `two_factor.not_enabled` THEN THE SYSTEM SHALL reload the account (`GET me`) and show its real state, without an error dialog.
- **REQ-7.5** WHEN the user signs out THE SYSTEM SHALL call `auth/logout`, clear the session (REQ-3.7) and go to sign-in.

### Shared rules for the identity pages
- **REQ-8.1** The pages SHALL be built only from specs 002–004 components:
  - `ui-auth-layout`, `ui-form-field`, `ui-code-input`, `ui-alert`, `uiButton`, `uiCheckbox` / `uiCheckRow`, `ui-icon`;
  - plus the app's brand panel, projected into `[uiAuthBrand]`, and the language switch, projected into `[uiAuthToolbar]`.

  No new visual style; layout uses Bootstrap utilities and existing tokens.
- **REQ-8.2** The identity library MAY use ngx-translate (the "no translation keys" rule is for `ui-*` libraries). It ships its texts in fr, en and ar under `identity.*`, which the app's loader merges with the app's own files.
- **REQ-8.3** Every submit button SHALL show `loading` while its request runs, and a second submit SHALL be ignored.
- **REQ-8.4** Every page SHALL have one `h1`, labelled fields, and errors linked to their fields (spec 004 FormField). A message above the form SHALL be a `ui-alert` announced to assistive technology.

### US-8 — Expenses app: routes and shell (`scope:expenses`)
- **REQ-9.1** THE SYSTEM SHALL serve these routes in `expenses-management`.
  - **Signed out**, behind `guestGuard`, on the identity pages:

    | Route | Page |
    |---|---|
    | `/connexion` | sign in |
    | `/inscription` | create account |
    | `/inscription/code` | email code |
    | `/connexion/code` | two-factor code |
    | `/mot-de-passe-oublie` | forgot password |
    | `/mot-de-passe/nouveau` | reset password |

  - **Signed in**, behind `authGuard`, inside the shell: `/` ("Accueil", today's Home placeholder) and `/compte` (account page).
  - **Placeholders**, reachable by anyone: `/conditions` and `/confidentialite` (backend gap B3).
  - Any other path goes to `/`.
- **REQ-9.2** THE SYSTEM SHALL provide `libs/expenses/shell` (`@expenses/shell`, `scope:expenses type:feature`), a signed-in frame on `ui-app-shell`:
  - **side rail:** the Olivier brand, "Ajouter une dépense" (disabled until spec 007), Accueil, Compte, and a footer with the account name and sign out;
  - **phones:** a top bar with the page title, and bottom tabs Accueil and Compte;
  - the toast region (in `ui-app-shell`) and the error presenter.

  Destinations of later specs (Opérations, Budget, Foyer) are not shown.
- **REQ-9.3** THE SYSTEM SHALL configure the app:
  - `environment` with `apiBaseUrl` (spec 001), `termsVersion: '2026-11'` and `googleClientId` (empty in development);
  - `provideApi`, `provideIdentity`, `provideErrorPresenter`;
  - an app initializer that runs `SessionStore.restore()` before the first route resolves;
  - `overlays.scss` in the styles (spec 004).
- **REQ-9.4** THE SYSTEM SHALL provide the brand panel for the auth pages in fr, en and ar, copied from the mockups:
  - the Olivier logo mark and name;
  - the promise "Vos dépenses du foyer, à deux, sans prise de tête.";
  - three benefits;
  - the footer note.

  The Arabic text comes from section 5. "Olivier" stays in Latin script, left-to-right.

### US-9 — Languages
- **REQ-10.1** THE SYSTEM SHALL offer fr (default), en and ar. A language switch on the auth pages (a `ui-segmented-control`, as in the mockups) sets the UI language, saved per device as `ui.lang`.
- **REQ-10.2** WHEN the language changes THE SYSTEM SHALL:
  - load the translations;
  - set `<html lang>`;
  - set `<html dir>` (`rtl` for ar, else `ltr`).

  The page reflows without reloading. The IBM Plex Sans Arabic font is already loaded (spec 002).
- **REQ-10.3** WHEN a user signs in THE SYSTEM SHALL switch to the account's `locale` (open question 6).
- **REQ-10.4** THE SYSTEM SHALL keep app texts in `public/i18n/{fr,en,ar}.json`. The Arabic files, the app's and the identity library's, are a draft marked for review by a native reader.
- **REQ-10.5** IF storage is unavailable or holds an unknown language THEN THE SYSTEM SHALL use French.

### Tests and checks
- **REQ-11.1** THE SYSTEM SHALL have unit tests (Vitest, jsdom, `HttpTestingController`) for:
  - the interceptor: the headers, the request id, XSRF from the cookie, non-API requests untouched, every `ApiError` kind, the 419 retry once, ErrorBus publication and handled codes;
  - `SessionStore`: each method's success and error paths, `restore()`, `code_required`, sign-out;
  - the guards;
  - the error presenter: each kind;
  - one spec per page: client validation, server field errors, the page-specific codes, the two-factor branch, redirects without pending state;
  - the shell and the language service.
- **REQ-11.2** THE SYSTEM SHALL verify each task with affected lint, affected unit tests and the development builds (CLAUDE.md "Testing rules"). No e2e, no dev server, no browser; the owner runs e2e.
- **REQ-11.3** THE SYSTEM SHALL write the new roadmap into CLAUDE.md and ARCHITECTURE §8:
  - from 005 on, each spec delivers the toolbox part and a working app screen;
  - 005 Identity;
  - 006 Households and books;
  - 007 Categories and operations;
  - 008 Dashboard and budget.

## Backend gaps (known limits; no workaround is built)
- **B1** The account `locale` accepts only `fr | en`. Until the backend adds `ar`, Arabic is UI-only: register and Google sign-up send `fr` when Arabic is selected.
- **B2** There is no endpoint to edit the profile (name, phone, language) or to change the password while signed in. The account page shows them read-only.
- **B3** The terms and privacy pages don't exist yet. The links point to `/conditions` and `/confidentialite`, which are placeholders until the legal texts come with production readiness.
- **B4** (from the mockups) Amounts in Arabic should use `ar-TN` formatting; `util-format` is `fr-TN` only. No amount appears in this spec, so this is left for spec 007 or 008.

## Unhappy paths checklist
- [x] Loading state: submit buttons `loading` (REQ-8.3); guards wait for `restore()` (REQ-3.9)
- [x] Empty state: account phone "non renseigné" (REQ-7.1)
- [x] HTTP / network errors:
  - offline toast (REQ-2.3);
  - server dialog with the request id (REQ-2.5);
  - CSRF retry (REQ-1.5);
  - Google failures (REQ-6.4).
- [x] Validation errors: client (REQ-4.2); server fields (REQ-4.9); codes (REQ-4.8); terms (REQ-6.3)
- [x] Unauthenticated: guards (REQ-3.9); session expiry (REQ-2.2); a missing pending state on a page (REQ-4.7, REQ-5.6, REQ-5.8)
- [x] Throttling and lock: countdown (REQ-5.4); resend countdown (REQ-4.5)
- [x] Date & timezone: n/a (no dates in this spec)
- [x] i18n / RTL: REQ-10.x; email, phone and code stay left-to-right
- [x] Duplicate submit: REQ-8.3

## Non-goals
- `TokenAuthStrategy` (Capacitor), secure storage and `device_id`: spec 009 (interface and stub only here, REQ-3.8).
- Editing the profile or changing the password while signed in; deleting the account (B2).
- Households, books, first-run choice, invitations: spec 006. After sign-in the user lands on "Accueil" until then.
- The legal texts (B3).
- e2e tests run by the assistant (open question 9 asks whether one should be *written*).

## Open questions
1. [ ] **"Retry" in the server-error dialog (REQ-2.5).** The page that made the request already received the error. Options:
   - **(a)** Retry reloads the current route (re-runs the page's loads), which is simple and works for screens that load data;
   - **(b)** the HTTP layer holds the failed request until the user chooses, and re-sends it, so the caller gets the retried result. This is more complex and keeps the caller waiting;
   - **(c)** no Retry: just "Fermer".

   I recommend **(a)**, plus showing "Fermer".
2. [ ] **`restore()` fails offline or with a server error at startup (REQ-3.3).** Options:
   - **(a)** status stays `unknown`, guards wait, and the error presenter shows its offline toast or server dialog with Retry, which runs `restore()` again;
   - **(b)** treat it as `anonymous` and show sign-in, which would send a signed-in user to sign-in whenever the backend is down.

   I recommend **(a)**.
3. [ ] **Resend countdown.** The mockup shows "Nouveau code possible dans 0:42", but the contract gives no minimum delay (email routes allow 3 sends per 15 min per address). Use **60 s** after each send, with the server's `retry_after_seconds` winning on a 429? (recommended)
4. [ ] **Language switch.** The French mockup shows only FR / EN and the Arabic one shows ع / FR / EN. Show all three everywhere (recommended), or hide Arabic while it is UI-only?
5. [ ] **Return after sign-in.** After an expired session (REQ-2.2) or a guarded link (REQ-3.9), go back to the requested URL after sign-in (recommended), or always to `afterSignIn`?
6. [ ] **The account's `locale` after sign-in (REQ-10.3) vs. Arabic (B1).** An Arabic user's account is saved as `fr`, so "the account's locale wins" would switch them to French at every sign-in. Options:
   - **(a)** keep the device's `ui.lang` when it is `ar` and the account says `fr`, and apply the account's locale otherwise (recommended until the backend accepts `ar`);
   - **(b)** the account always wins.
7. [ ] **Library names and folders.** Following ARCHITECTURE §2:
   - `shared/http/data-access` (`@shared/http-data-access`);
   - `shared/http/feature-errors` (`@shared/http-feature-errors`);
   - `shared/identity/data-access` (`@shared/identity-data-access`);
   - `shared/identity/feature-auth` (`@shared/identity-feature-auth`);
   - `libs/expenses/shell` (`@expenses/shell`), with a new `@expenses/*` alias prefix for app libraries.

   OK?
8. [ ] **"Or" divider and logo.** The mockups have an "ou avec votre e-mail" divider between Google and the form, and an olive-branch logo mark. Neither is a toolbox component. Draw the divider with existing tokens inside the identity pages (no new toolbox component), and keep the logo as an app asset in the brand panel? (recommended)
9. [ ] **The e2e smoke test.** CLAUDE.md says a new smoke test comes with "the spec that brings back the first real screen", which is this one. Should this spec *write* a Playwright smoke test (the sign-in page renders; you run it), and bring back `@playwright/test` and the CI e2e job on `main`, or leave e2e entirely to you?
