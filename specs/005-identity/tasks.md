# 005 — Identity: Tasks

> Status: In progress (2026-11-23)
> Design: [design.md](./design.md)

Each task: unit tests, `nx affected -t lint`, `nx affected -t test`, the development build of `expenses-management`; commit, and push to `spec/005-identity`. No e2e, no serve, no browser.

- [ ] **T1** — Roadmap and alias rules in the docs (REQ-11.3, REQ-11.4)
- [ ] **T2** — `@shared/http-data-access`: `provideApi`, `ApiError`, interceptor, `ErrorBus`, handled codes, `SESSION_EXPIRY` (REQ-1.1–1.7)
- [ ] **T3** — `@shared/identity-data-access`: models, `AuthApi`, strategies, `SessionStore`, guards, `provideIdentity`, `safeReturnUrl` (REQ-3.1–3.11)
- [ ] **T4** — `@shared/http-feature-errors`: presenter, server-error dialog, i18n (REQ-2.1–2.6)
- [ ] **T5** — `@shared/identity-feature-auth` part 1: shared helpers, sign-in, sign-up, email code, i18n (REQ-4.x, REQ-5.1–5.4, REQ-8.x)
- [ ] **T6** — part 2: two-factor, forgot and reset password, unavailable page (REQ-5.5–5.8, REQ-3.3)
- [ ] **T7** — part 3: account page (REQ-7.x)
- [ ] **T8** — `@expenses/shell`: the signed-in shell (REQ-9.2)
- [ ] **T9** — App: routes, config, `AuthFrame`, brand panel, logo, language service, merged loader, i18n fr/en/ar, `UI_TEXT` from translations (REQ-9.1, 9.3, 9.4, 10.x)
- [ ] **T10** — Google button (REQ-6.x)
- [ ] **T11** — Report

## Deviations from spec
(Recorded during implementation.)

## Verification report
| REQ | Verified how | Result |
|---|---|---|
