# 006 — Households and books: Tasks

> Status: Draft (2026-11-24), waiting for the owner's approval
> Design: [design.md](./design.md)

Each task is at most ~150 lines of diff, with its tests written first. Verification of every task: left to CI and the owner (no tests, lint, build, serve or browser run by Claude). One commit per task at most; push once at the end.

- [x] **T1** — Docs: ARCHITECTURE §2 and §3 (app-specific code lives in the app, no `libs/<app>/`; drop the `@expenses/*` alias rule in CLAUDE.md and CONVENTIONS), ROADMAP status (REQ-8.7)
  - Verification: left to CI and the owner
- [x] **T2** — Move `libs/expenses/shell` into `apps/expenses-management/src/app/shell/`: files, imports in routes, delete the project, its tsconfig path and Nx tags; no behaviour change (decision 5)
  - Verification: left to CI and the owner (shell spec moved with it)
- [x] **T3** — Models, mappers, `fetchAll`, `StoreResult` (REQ-1.1, 1.2, 1.4)
  - Files: `app/households/data/{models,mappers,paginate,store-result}.ts` + specs
  - Verification: left to CI and the owner
- [x] **T4** — `HouseholdsApi`, `BooksApi`, `InvitationsApi` (REQ-1.1, 1.2)
  - Files: `*-api.ts` + `HttpTestingController` specs (paths, snake_case, pagination)
  - Verification: left to CI and the owner
- [x] **T5** — `BooksStore` with `selected-book-storage` and selection fallback (REQ-1.3, 1.5, 1.7, 7.3, 7.4, 3.5)
  - Verify: spec for load de-duplication, fallback order, storage failure, create-and-select
  - Verification: left to CI and the owner
- [x] **T6** — `HouseholdStore`, `InvitationsStore`, `provideHouseholds` reset on account change (REQ-1.3, 1.4, 1.6, 4.1, 4.3, 5.4–5.9, 6.2)
  - Verify: spec per method, success and each handled code, refresh after delete / leave / accept
  - Verification: left to CI and the owner
- [x] **T7** — Guards `workspaceGuard`, `firstRunGuard`, `householdBookGuard` (REQ-2.1, 2.2, 2.6, 3.7)
  - Verify: guard specs (empty, error, owner without book, five personal books)
  - Verification: left to CI and the owner
- [x] **T8** — Households pages part 1: support helpers, `households.*` keys in `public/i18n/{fr,en,ar}.json`, `ReceivedInvitationCard`, `WelcomePage` states A/B/C (REQ-2.3–2.5, 2.7, 4.2–4.7, 8.1, 8.2, 8.4)
  - Verify: page spec (states, skeleton, accept/decline paths and codes)
  - Verification: left to CI and the owner
- [x] **T9** — `HouseholdNewPage` and `BookNewPage` (REQ-3.1–3.4, 3.6, 3.8, 3.9, 8.3)
  - Verify: page specs (validation, `foyer` flag, currency "Autre…", throttled text, stale-state redirects)
  - Verification: left to CI and the owner
- [x] **T10** — `HouseholdPage` part 1: empty state, owner header, rename, delete, member view, leave, `MembersList` (REQ-5.1–5.7, 5.11, 6.1–6.4)
  - Verify: page spec per role, confirmations, 404 / 403 / 422 paths
  - Verification: left to CI and the owner
- [x] **T11** — `HouseholdPage` part 2: `SentInvitations`, `InviteForm`, throttle text (REQ-5.8–5.10)
  - Verify: form and list specs, every invite code
  - Verification: left to CI and the owner
- [x] **T12** — Shell: `BookSwitcher` (rail and top bar), "Foyer" nav, `bookBound` title rule; confirm the slots exist before coding (REQ-7.1, 7.2)
  - Verify: `book-switcher.spec.ts`, shell spec
  - Verification: left to CI and the owner
- [x] **T13** — App wiring: routes and `PATHS`, `BookHome` placeholder, `provideHouseholds`, `shell.*` / `home.*` keys fr/en/ar (REQ-7.5, 7.6, 8.1, 2.1)
  - Verify: routes spec (guards, redirects), loader spec, development build left to the owner
  - Verification: left to CI and the owner
- [x] **T14** — Report: verification table, `specs/README.md` entry, ROADMAP (REQ-8.6, 8.7)
  - Verification: left to CI and the owner

## Deviations from spec
- T5: a minimal `HouseholdStore` (`household`, `loadHousehold`, `reset`) is created with `BooksStore`, because `BooksStore.load` depends on it; T6 completes it.
- T6: `HouseholdStore` reaches `BooksStore` through `Injector` inside its methods, to avoid a circular injection (`BooksStore` injects `HouseholdStore`).
- T6: `provideHouseholds` resets only when a known account id changes or disappears, never on the first sign-in, so a workspace load already started is not dropped.
- T2: the moved shell's selectors are renamed `expenses-*` → `app-*` (the app's ESLint prefix is `app`); its spec file moves with it and runs under the app's test target; the shell's `index.ts` stays in `app/shell/`.

- T9: `BooksStore.create` now passes `handling(...)` for its handled codes (omitted in T5, REQ-8.3), with `household_id.not_found` added to the design's list (REQ-3.6).
- T9: currency and timezone are sent only when the user changed them (REQ-3.5, "fields the user did not choose").
- T10: `support/server-errors.ts` gains `fieldMessage` (one field's translated code), used by `HouseholdPage` to feed `RenameForm.serverError`; the `household.owner_cannot_leave` text now tells the new owner to delete instead (REQ-6.3).
- T12: slots confirmed, no toolbox change: the rail switcher goes in `uiRailAction` (above "Ajouter une dépense"), the bar switcher in `uiTopBarTitle`; both only on `bookBound` routes with a selected book. The shell's `shell.household` / `shell.books.*` keys land here instead of T13. Icons `users` and `chevron-down` are added to `SHELL_ICONS`. The owner's pending `hidden: true` edits to `signed-in-shell.spec.ts` are committed with T12 (same lines).
- T13: `home/home.*` is renamed to `home/book-home.*` (`BookHome` replaces `Home`; `home.text` is removed). The `/foyer/nouveau` inline guard is `noHouseholdGuard` in `app.routes.ts`. The loader spec is unchanged: no new loader entry (design, i18n keys).

## Verification report
| REQ | Verified how | Result |
|---|---|---|
| 1.x | T3–T6 specs | left to CI and the owner |
| 2.x | T7, T8, T13 specs | left to CI and the owner |
| 3.x | T5, T9 specs | left to CI and the owner |
| 4.x | T6, T8 specs | left to CI and the owner |
| 5.x, 6.x | T10, T11 specs | left to CI and the owner |
| 7.x | T5, T12, T13 specs | left to CI and the owner |
| 8.x | all specs, T1, T14 | left to CI and the owner |
