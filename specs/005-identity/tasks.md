# 005 — Identity: Tasks

> Status: Done, in review (2026-11-24)
> Design: [design.md](./design.md)

Each task: unit tests, `nx affected -t lint`, `nx affected -t test`, the development build of `expenses-management`; commit, and push to `spec/005-identity`. No e2e, no serve, no browser.

- [x] **T1** — Roadmap and alias rules in the docs (REQ-11.3, REQ-11.4)
- [x] **T2** — `@shared/http-data-access`: `provideApi`, `ApiError`, interceptor, `ErrorBus`, handled codes, `SESSION_EXPIRY` (REQ-1.1–1.7)
- [x] **T3** — `@shared/identity-data-access`: models, `AuthApi`, strategies, `SessionStore`, guards, `provideIdentity`, `safeReturnUrl` (REQ-3.1–3.11)
- [x] **T4** — `@shared/http-feature-errors`: presenter, server-error dialog, i18n (REQ-2.1–2.6)
- [x] **T5** — `@shared/identity-feature-auth` part 1: shared helpers, sign-in, sign-up, email code, i18n (REQ-4.x, REQ-5.1–5.4, REQ-8.x)
- [x] **T6** — part 2: two-factor, forgot and reset password, unavailable page (REQ-5.5–5.8, REQ-3.3)
- [x] **T7** — part 3: account page (REQ-7.x)
- [x] **T8** — `@expenses/shell`: the signed-in shell (REQ-9.2)
- [x] **T9** — App: routes, config, `AuthFrame`, brand panel, logo, language service, merged loader, i18n fr/en/ar, `UI_TEXT` from translations (REQ-9.1, 9.3, 9.4, 10.x)
- [x] **T10** — Google button (REQ-6.x)
- [x] **T11** — Report

## Deviations from spec

- **Error presenter (REQ-9.2, design "AuthFrame", "SignedInShell"):** one `<shared-error-presenter />` in the app root instead of one in the shell and one in `AuthFrame`. Two presenters would both react to the same `ErrorBus` event, and the root one also covers the unavailable and legal pages.
- **`provideErrorPresenter()` (REQ-9.3, design "Error presenter"):** not created. The presenter needs no provider: its texts reach ngx-translate through the app's `MergedTranslateLoader` (`/i18n/errors/{lang}.json`).
- **Toasts on the auth pages:** `AuthFrame` adds a `ui-toast-region`, because `ui-auth-layout` has none (the signed-in pages use the one in `ui-app-shell`).
- **Divider (design "Identity pages"):** an `identity-or-divider` component inside `identity/feature-auth` instead of a local `.identity-or` style repeated in two pages. It is used once, by the Google button. Still built from existing tokens, no new molecule.
- **`IdentityConfig.paths`:** also has `terms` and `privacy`, used by the terms links of sign-up and the Google terms step.
- **Google (REQ-6.2):** the button is Google's own (already in the design). Google Identity Services can render it only once the script is loaded, so the script loads when a page that shows the button opens (once per session, and only when `googleClientId` is set), not on click. The button reports its messages through a `problem` output; the page shows them in a `ui-alert` above the form (REQ-6.4).
- **Docs (REQ-11.3, REQ-11.4):** the merge of `main` moved the roadmap and conventions out of CLAUDE.md. The 005 roadmap now lives in `docs/ROADMAP.md`, the `@expenses/*` alias rule in CLAUDE.md and `docs/CONVENTIONS.md`; ARCHITECTURE §2 and §8 are unchanged from T1.

## Verification report

Verification: left to CI and the owner (CLAUDE.md "Testing rules"). No e2e, no dev server, no browser.

| REQ | Verified how | Result |
|---|---|---|
| 1.1–1.7 | `api.interceptor.spec.ts` (`HttpTestingController`: headers, XSRF, 419 retry, every `ApiError` kind, `ErrorBus`, handled codes) | left to CI and the owner |
| 2.1–2.6 | `error-presenter.spec.ts` (with the server-error dialog) | left to CI and the owner |
| 3.1–3.11 | `session.store.spec.ts`, `guards.spec.ts`, `return-url.spec.ts` | left to CI and the owner |
| 4.x, 5.x, 8.x | page specs for sign-in, sign-up, email code, two-factor, forgot and reset password (`testing/page-harness.ts`) | left to CI and the owner |
| 6.1–6.4 | `google-button.spec.ts` (no client id → no script; token, locale, terms version; two-factor; terms step; Google codes; script failure), `google-identity.spec.ts` (one script, retry after failure) | left to CI and the owner |
| 7.x | `account.page.spec.ts` | left to CI and the owner |
| 9.1 | `app.routes.spec.ts` (guards, return URL, unavailable, unknown paths) | left to CI and the owner |
| 9.2 | `signed-in-shell.spec.ts`, `app.spec.ts` (one presenter) | left to CI and the owner |
| 9.3 | `app.config.ts` review; development build | left to CI and the owner |
| 9.4 | `auth-frame.spec.ts` (brand panel, benefits, note) | left to CI and the owner |
| 10.1–10.5 | `language.service.spec.ts`, `auth-frame.spec.ts` (switch, RTL, key parity), `merged-translate-loader.spec.ts`, `translated-ui-text.spec.ts` | left to CI and the owner |
| 11.1–11.2 | the specs above; `nx affected -t lint`, `nx affected -t test`, development build of `expenses-management` | left to CI and the owner |
| 11.3–11.4 | `docs/ROADMAP.md`, CLAUDE.md, `docs/CONVENTIONS.md`, ARCHITECTURE §2 and §8 | done |
