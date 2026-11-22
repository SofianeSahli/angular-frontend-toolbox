# 001 — Foundations: Requirements

> Status: Approved (2026-11-21), open questions resolved below. Implemented (2026-11-22): see the verification report in tasks.md.
> Scope: whole workspace — `apps/expenses-management`, `shared/auth`, `shared/stores`, `shared/ui-components`, root config (`nx.json`, `eslint.config.mjs`, `tsconfig.base.json`, `package.json`), new `.github/workflows/`, new e2e project. Removes `apps/launcher`, `apps/uncensored`, `shared/profile-section`.
> Architecture: [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) §3 (boundaries), §6 (tests), §8 step 1.

## Context

The workspace is on Angular 22.2 / Nx 24, but it has no working safety net. Unit tests can't run, there are no end-to-end tests and no CI, and module boundaries aren't enforced (every project has `tags: []`). Lint fails with 90 errors. Three projects are dead or broken, and the production build of the only real app points at files that don't exist. Every later toolbox spec (002–005) depends on being able to test, lint and build reliably and to enforce the library rules in ARCHITECTURE §3. This spec delivers that foundation **without changing what the app does or how it looks**.

## User stories

- **US-1 — Unit tests.** As a developer, I want a Vitest runner for apps and libraries, so that each later spec can write tests first, as `CLAUDE.md` requires.
- **US-2 — End-to-end smoke test.** As a developer, I want a Playwright project for `expenses-management` with a smoke test, so that I know the app still starts and renders after each change.
- **US-3 — Enforced boundaries.** As a maintainer, I want every project tagged and the ARCHITECTURE §3 rules enforced by lint, so that the toolbox layers can't be broken by accident.
- **US-4 — Only the projects the architecture keeps.** As a maintainer, I want the projects that are not in the architecture removed, so that the workspace contains only what we build on.
- **US-5 — Builds that work.** As a developer, I want the production build and every remaining build target to succeed, so that "it builds" means something.
- **US-6 — Continuous integration.** As a maintainer, I want lint, test and build to run on every pull request and e2e to run on `main`, so that regressions are caught before and after merge.

## Acceptance criteria (EARS)

### US-1 — Unit tests
- **REQ-1.1** WHEN a developer runs `npx nx test <project>` for `expenses-management`, `auth`, `stores` or `ui-components` THE SYSTEM SHALL run that project's `*.spec.ts` files with Vitest and report pass/fail per test.
- **REQ-1.2** WHEN a developer runs `npx nx affected -t test` THE SYSTEM SHALL run tests only for projects affected by the changes against the base branch.
- **REQ-1.3** WHEN a new library or app is generated with the workspace generators THE SYSTEM SHALL configure it with the same Vitest test target by default (`nx.json` generator defaults no longer set `unitTestRunner: none`).
- **REQ-1.4** THE SYSTEM SHALL contain no test file that imports `@ionic/angular` or any other package that is not a workspace dependency. (Today: 5 files.)
- **REQ-1.5** WHEN `npx nx run-many -t test` runs THE SYSTEM SHALL pass. Every existing `*.spec.ts` (28 today) is either made to pass against the current code or deleted. Each deleted file is listed in `tasks.md` with the reason.
- **REQ-1.6** IF a test fails THEN THE SYSTEM SHALL exit with a non-zero code so that CI fails.
- **REQ-1.7** THE SYSTEM SHALL include at least one meaningful test per library that has testable logic beyond "should create", proving the runner covers library code: for example a `withCrudOperations` error path in `stores` and a validator in `ui-components`.

### US-2 — End-to-end smoke test
- **REQ-2.1** WHEN a developer runs the e2e target for `expenses-management` THE SYSTEM SHALL build and serve the app, open it in a headless Chromium browser, and run the Playwright tests.
- **REQ-2.2** WHEN the smoke test opens `/` with empty browser storage THE SYSTEM SHALL show the sign-in page (the sign-in form with its username and password fields) and the test SHALL pass.
- **REQ-2.3** IF no backend is running THEN the smoke test SHALL still pass. It needs no API, and it does not fail because of the app's network-error dialog when storage is empty.
- **REQ-2.4** WHEN the smoke test runs THE SYSTEM SHALL fail the test if the browser console shows an uncaught error during page load.
- **REQ-2.5** IF an e2e test fails THEN THE SYSTEM SHALL keep a trace or screenshot that can be downloaded from CI.

### US-3 — Enforced boundaries
- **REQ-3.1** THE SYSTEM SHALL give every project a `scope:*` tag and a `type:*` tag, plus a `layer:*` tag for UI libraries where one level applies, following ARCHITECTURE §2–3.
- **REQ-3.2** WHERE an existing library mixes several types or levels (`shared/auth` holds pages, a store and interceptors; `shared/ui-components` holds widgets at several atomic levels plus validators) THE SYSTEM SHALL give it an honest interim tag that describes it as it is today. A comment in its `project.json` or `tasks.md` names the spec that splits it: auth → 005, ui-components → 002–004.
- **REQ-3.3** THE SYSTEM SHALL configure `@nx/enforce-module-boundaries` in `eslint.config.mjs` with exactly the `depConstraints` listed in ARCHITECTURE §3, replacing today's `*` → `*` rule.
- **REQ-3.4** WHEN a project imports another project in a way the constraints forbid THE SYSTEM SHALL report a lint error, not a warning.
- **REQ-3.5** WHEN `npx nx run-many -t lint` runs at the end of this spec THE SYSTEM SHALL report **zero errors**. This covers today's 90 errors, including the 43 added by the Angular 22 upgrade (86 in the kept projects: 53 of other rules + 33 `prefer-on-push-component-change-detection`).
- **REQ-3.5a** THE SYSTEM SHALL switch every component flagged by `prefer-on-push-component-change-detection` (33 in the kept projects) from `ChangeDetectionStrategy.Eager` to `OnPush`.
- **REQ-3.5b** THE SYSTEM SHALL not disable, downgrade or suppress (`eslint-disable`, rule override) any lint rule to meet REQ-3.5.
- **REQ-3.5c** WHEN a component has been switched to `OnPush` THE SYSTEM SHALL show the same content and react to the same user actions as before. This includes values written by a parent form into a form control, results of HTTP calls, timers, and content placed in modals. A switch that would need a visible or functional change to keep working is stopped and brought back to the user, not shipped.
- **REQ-3.6** THE SYSTEM SHALL have no deep imports into other projects: no `apps/<app>/src/...`, no `shared/<lib>/src/...`. Apps import their own files by relative path and libraries by `@shared/...` alias.

### US-4 — Only the projects the architecture keeps
- **REQ-4.1** THE SYSTEM SHALL no longer contain `apps/launcher`, `apps/uncensored` or `shared/profile-section`, nor any reference to them: `tsconfig.base.json` paths (`@env/launcher`, `profile-section`), `fileReplacements`, docs tables and Known issues.
- **REQ-4.2** THE SYSTEM SHALL keep `apps/expenses-management`, `shared/auth`, `shared/stores` and `shared/ui-components`. These are in the architecture as either a target library (§2) or the source of a planned migration (§7).
- **REQ-4.3** WHEN `npx nx show projects` runs THE SYSTEM SHALL list only the kept projects plus the new e2e project.
- **REQ-4.4** THE SYSTEM SHALL not move, split or rename the kept libraries. That is done in specs 002–005.
- **REQ-4.5** THE SYSTEM SHALL no longer depend on `@angular-architects/module-federation`, which nothing in the code uses.

### US-5 — Builds that work
- **REQ-5.1** WHEN `npx nx build expenses-management` runs with the default (production) configuration THE SYSTEM SHALL succeed, replacing `expenses-management`'s own development environment file with its own production environment file.
- **REQ-5.2** THE SYSTEM SHALL not hard-code `localhost` URLs in the production environment file. Until the real production URLs are known, it uses clearly marked placeholders on a reserved domain (for example `https://api.example.invalid`) with a comment saying they must be replaced before the first deployment.
- **REQ-5.3** THE SYSTEM SHALL have no build target that cannot succeed. `ui-components:build` (missing `ng-package.json`) is either made to work or removed.
- **REQ-5.4** WHEN `npx nx run-many -t build` runs THE SYSTEM SHALL succeed for every project that has a build target.
- **REQ-5.6** THE SYSTEM SHALL configure each app with **exactly one API base URL** (`apiBaseUrl` in its environment files). Every service and library config in that app builds its request URLs from it: auth, profile, categories and money transactions. No second base URL (`mainAppUrl`, `profileBaseUrl`) and no hard-coded host remain.
- **REQ-5.7** WHILE running in development THE SYSTEM SHALL use `http://localhost:8001/api/v1` as `apiBaseUrl`, the address of the rebuilt backend ([personal-accountings-backend](https://github.com/SofianeSahli/personal-accountings-backend)). Only the base URL changes. The endpoint paths the frontend calls stay as they are, even though the rebuilt backend doesn't serve them yet; adapting the calls is spec 005 and the expenses work.
- **REQ-5.5** IF the production build exceeds the bundle budget THEN THE SYSTEM SHALL report it as it does today. Budgets are not loosened to make the build pass without the change being listed and approved.

### US-6 — Continuous integration
- **REQ-6.1** WHEN a pull request is opened or updated against `main` THE SYSTEM SHALL run lint, test and build for the affected projects on GitHub Actions.
- **REQ-6.2** WHEN a commit lands on `main` THE SYSTEM SHALL run lint, test and build for affected projects and the e2e smoke test.
- **REQ-6.3** IF any of these steps fails THEN THE SYSTEM SHALL mark the workflow run as failed.
- **REQ-6.4** THE SYSTEM SHALL install dependencies with `npm ci` on **Node 24**, pinned for CI and recorded for local development (`.nvmrc` and `package.json` `engines`).
- **REQ-6.7** WHEN a developer runs `npm run ci` locally THE SYSTEM SHALL run the same lint, test and build steps as the pull-request workflow and exit non-zero if any fails. e2e is available locally through its own command.
- **REQ-6.5** WHILE CI runs THE SYSTEM SHALL use no secrets and no external backend.

## Unhappy paths checklist
- [x] Loading state: n/a, no UI change
- [x] Empty state: smoke test with empty storage (REQ-2.2, REQ-2.3)
- [x] HTTP / network errors: no backend in e2e or CI (REQ-2.3, REQ-6.5)
- [x] Validation errors: n/a
- [x] Unauthenticated session: smoke test starts unauthenticated (REQ-2.2)
- [x] Date & timezone edge cases: n/a in this spec
- [x] i18n: no new user-visible text

## Non-goals
- No new UI libraries, design tokens, themes or atoms (specs 002–003).
- No removal of ng-bootstrap, `moment` or bootstrap-icons (spec 004).
- No change to auth, session or HTTP error behaviour (spec 005), even where the review found bugs.
- No visual change and no change to what the app does. Switching components to `OnPush` (REQ-3.5a) is in scope only as a behaviour-preserving change (REQ-3.5c).
- No moving, splitting or renaming of the kept libraries (REQ-4.4).
- No Playwright visual screenshots or catalog tests (spec 003).

## Decisions (open questions resolved 2026-11-21)
1. [x] **Node version:** Node 24, pinned in CI and locally (REQ-6.4).
2. [x] **CI location:** GitHub Actions **and** a local `npm run ci` script running the same steps (REQ-6.7).
3. [x] **Production environment values:** clearly marked placeholders for now; the real URLs replace them before the first deployment (REQ-5.2).
4. [x] **Kept libraries:** delete only `launcher`, `uncensored` and `profile-section`. Keep `shared/auth` and `shared/ui-components` until specs 002–005 replace them (REQ-4.1, REQ-4.2).
5. [x] **Lint target:** first decided as "zero except `prefer-on-push`"; **changed during design review (2026-11-21): zero errors, all rules.** The 33 components are switched to `OnPush` without changing behaviour (REQ-3.5, REQ-3.5a – 3.5c).
8. [x] **One API base URL per app** (added 2026-11-21, during design review): REQ-5.6, REQ-5.7. The backend has been rebuilt; the old auth service on `:3000` and the old API are gone.
7. [x] **E2E tag:** the Playwright project is tagged `scope:expenses type:e2e`, and `type:e2e` is added to ARCHITECTURE §3's tag list, with no constraint row (design D2).
6. [x] **Unused dependency:** remove `@angular-architects/module-federation` in this spec (REQ-4.5).
