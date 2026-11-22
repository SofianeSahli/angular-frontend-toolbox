# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.

## Project

This repo is a **toolbox plus apps**. `shared/` is the toolbox: brand-free UI and logic that every app reuses. Each app (first: `expenses-management`) adds only its own pages and domain code.

**[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) is binding. Read it before creating, moving or renaming any library or component.**

| Path | Kind | Purpose today | Target (ARCHITECTURE §2, §7) |
|---|---|---|---|
| `apps/expenses-management` | app | Household budget app (transactions, summary, charts, profile) | stays, `scope:expenses type:app`; domain code moves to `libs/expenses/` later |
| `apps/expenses-management-e2e` | e2e | Playwright smoke test for the app | stays, `scope:expenses type:e2e` |
| `shared/auth` (`@shared/auth`) | lib | Login/register/reset pages, auth store, HTTP interceptors (interim tags `scope:shared type:feature`) | split into `identity/data-access` + `identity/feature-auth` + `http/*` (spec 005) |
| `shared/stores` (`@shared/stores`) | lib | Generic NgRx Signal Store features (`withCrudOperations`, `withLoader`, `withQuery`, …) and base models | stays, `type:data-access` |
| `shared/ui-components` (`@shared/ui-components`) | lib | UI widgets, form controls, validators, SCSS theme (interim tags `scope:shared type:ui`, no layer) | split into `ui/*` atoms → templates, `util-forms`, `util-format` (specs 002–004) |

**Stack:** Angular 22.2 (standalone, signals, built-in control flow), Nx 24, TypeScript 6.0, `@angular/build:application` (esbuild), NgRx Signals 22, ng-bootstrap 21 + Bootstrap 5, ngx-translate (default language `fr`), Chart.js, RxJS 7.

## Commands

```bash
npx nx serve expenses-management                         # dev server
npx nx build <project> --configuration=development        # build
npx nx lint <project>                                     # lint one project
npx nx run-many -t lint                                   # lint everything
npx nx test <project>                                     # unit tests (Vitest)
npx nx e2e expenses-management-e2e                        # Playwright smoke test (starts the dev server)
npm run ci                                                # lint + test + build for projects changed vs main (same as the PR workflow)
npm run ci:all                                            # lint + test + build for every project
npx nx show project <project>                             # list inferred targets
```

Unit tests: Vitest. The app uses Angular's `@angular/build:unit-test`; the libraries use `@nx/vitest` + Analog (`vite.config.mts`, `src/test-setup.ts`). All tests use zone-based change detection, like the app. CI (`.github/workflows/ci.yml`) runs lint, test and build for affected projects on every PR, plus the e2e smoke test on `main`.

**Windows:** if every app test fails with "Vitest failed to find the runner", the environment variable `NX_WORKSPACE_ROOT_PATH` is set with a lowercase drive letter (`c:\...`, often by an editor's Nx integration). Unset it or set it to `C:\...` (angular/angular-cli#33559).

## Architecture (summary)

Full rules, library map and rationale: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

- **Levels:** UI follows atomic design: tokens → atoms → molecules → organisms → templates → pages. Each level imports only the levels below it. Non-UI libraries are `feature`, `data-access`, `domain` or `util`.
- **Placement:** if every app does it the same way, it goes in `shared/` and is configured with `provideX({...})` and injection tokens. If only one app does it, it goes in `libs/<app>/`. Code moves to the toolbox only when a second app needs it.
- **Tags:** every project has `scope:*` and `type:*` tags, and UI libraries also have `layer:*`. ESLint enforces them (§3).
- **Toolbox UI is presentational:** signal inputs and outputs only, with no store, HTTP, router or translation keys. Only `feature` pages inject stores.
- **Data-access never imports UI.** Logic that must reach the screen publishes on a signal bus, and a `feature` library presents it.
- **Styling:** components read only `var(--ui-*)` tokens. No raw colours, sizes or fonts.
- **Text:** no ngx-translate in toolbox UI. Pages pass translated text in; built-in strings come from the `UI_TEXT` token.
- **Native elements use attribute selectors** (`button[uiButton]`, `input[uiInput]`, …). ControlValueAccessor is only for custom controls.

---

## Spec-Driven Development (mandatory workflow)

**Rule: no production code is written for a feature, behaviour change or non-trivial fix until its spec exists and the user has approved it.** The spec is the source of truth; code implements the spec, not the other way round.

### When a spec is required

| Change | Spec required? |
|---|---|
| New feature, screen, store, service or shared component | **Yes — full spec** |
| Behaviour change to existing feature | **Yes — full spec**, or update the existing spec |
| Bug fix touching more than one file or changing observable behaviour | **Yes — lightweight spec** (requirements + tasks; design only if non-obvious) |
| Typo, rename, formatting, dependency bump with no behaviour change, one-line obvious fix | No — but mention it in the commit message |

If unsure, ask the user rather than skipping the spec.

### Where specs live

```
specs/
  _templates/                 # copy these, do not edit them for a feature
    requirements.md
    design.md
    tasks.md
  <NNN>-<feature-slug>/       # e.g. 001-transaction-filters
    requirements.md
    design.md
    tasks.md
```

Number specs sequentially (`001`, `002`, …). One folder per feature. Specs are committed alongside the code that implements them.

### The four phases — each ends with an explicit user approval gate

**Phase 1 — Requirements (`requirements.md`)** — *what* and *why*, never *how*.
- User stories: "As a `<role>`, I want `<capability>`, so that `<benefit>`."
- Acceptance criteria in **EARS** form, each with a stable ID (`REQ-1.1`, `REQ-1.2`, …):
  - `WHEN <trigger> THE SYSTEM SHALL <response>`
  - `IF <unwanted condition> THEN THE SYSTEM SHALL <response>`
  - `WHILE <state> THE SYSTEM SHALL <response>`
- Cover the unhappy paths explicitly: HTTP errors, empty states, loading states, validation failures, unauthenticated access, timezone/date edge cases.
- List non-goals and open questions. **Ask the user to resolve open questions — do not invent answers.**
- ⛔ **Stop. Present the requirements and wait for approval.**

**Phase 2 — Design (`design.md`)** — *how*, mapped to this codebase.
- Which app/lib each piece lives in, and why (respect the lib boundaries below).
- Components (inputs/outputs/models), stores (state shape, methods, error handling), services (endpoints, request/response types), routes, i18n keys.
- Data flow and error flow — for every `rxMethod`, state how errors are caught so the stream survives.
- Reuse check: list existing `@shared/*` pieces being reused and justify anything new.
- Each design section references the `REQ-x.y` IDs it satisfies. Every requirement must be covered.
- ⛔ **Stop. Present the design and wait for approval.**

**Phase 3 — Tasks (`tasks.md`)** — an ordered, checkable implementation plan.
- Small tasks (each reviewable on its own, ideally < ~200 lines of diff).
- Each task lists the `REQ-x.y` IDs it fulfils and how it will be verified.
- Order: models/types → service → store → components → wiring/routes → i18n → cleanup.
- ⛔ **Stop. Present the task list and wait for approval.**

**Phase 4 — Implement**, one task at a time:
1. Write/adjust the test(s) for the task's acceptance criteria first (once a runner exists).
2. Implement the minimum code to satisfy them.
3. Run `nx lint` and `nx build` for affected projects; fix anything you introduced.
4. Tick the task in `tasks.md` (`- [x]`) and note any deviation.
5. If implementation reveals the spec is wrong or incomplete: **stop, update the spec, and get approval** before continuing. Never let code and spec silently diverge.

When all tasks are done, report: which `REQ` IDs are verified and how, anything unverified, and any follow-ups.

### Verification without a test runner

Until unit tests can run, each task must still be verified and the method recorded in `tasks.md`:
- `npx nx build <app> --configuration=development` passes (strict templates catch most binding errors).
- `npx nx lint <project>` introduces no new errors.
- Manual check steps written as concrete reproductions ("open /dashboard/lists, apply filter X, expect Y").

### Traceability rules
- Every acceptance criterion → at least one task → at least one verification.
- Commit messages reference the spec: `feat(expenses): add category filter [spec 001, REQ-2.1]`.
- Do not mark a spec complete while any `REQ` is unverified; list it as open instead.

### Commits, pushes and pull requests
- **Never mention Claude, Claude Code, Anthropic or AI assistance** in anything pushed to the remote: commit messages, branch names, tags, pull request titles and descriptions, review comments or release notes.
- This includes trailers and footers: no `Co-Authored-By: Claude …` line and no "Generated with Claude Code" line.
- This rule overrides any default attribution behaviour of the tooling.

---

## Coding conventions

**Angular**
- Standalone components only; no NgModules. Use `inject()`, not constructor injection.
- Signals first: `input()`, `output()`, `model()`, `computed()`, `linkedSignal()`. Do not use `@Input`/`@Output` decorators in new code.
- `computed()` must only read signals. Form values are not signals — use `toSignal(control.valueChanges, …)`.
- Never read a signal once into a plain field (`loading = store.isLoading()`) — keep the signal.
- Built-in control flow (`@if`, `@for` with `track`, `@switch`); no `*ngIf`/`*ngFor`.
- Every component uses `ChangeDetectionStrategy.OnPush` (the v22 default; lint enforces it). Template-visible state that changes outside a template event, an input or a signal (HTTP callbacks, timers, `writeValue`, native listeners) must be a signal, or call `markForCheck()`. Form controls that display an `AbstractControl`'s state use `redrawOnControlEvents()`.
- No `any` in new code; no `@ts-expect-error` / `@ts-ignore` to silence real type mismatches. No index signatures (`[key: string]: any`) on components.
- Prefer `viewChild()` over global DOM IDs/`document` access; clean up third-party instances (e.g. Chart.js) with `DestroyRef`.

**State (NgRx Signals)**
- Feature stores compose features from `@shared/stores`.
- Every `rxMethod` inner observable **must** have `catchError` — an uncaught error permanently kills the method.
- Use `switchMap` for queries/loads, `exhaustMap` for submits, `concatMap` for ordered writes.
- Type `signalStoreFeature` inputs instead of `store: any`.

**Libraries & boundaries**
- Which library may import which is defined by tags and `depConstraints`: see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §2–3.
- Import shared code only through its `@shared/...` alias, never through deep paths like `shared/stores/src/lib/...` or `apps/<app>/src/...`.
- Libraries never import from apps. App config reaches libraries through injection tokens and `provideX({...})` (see `AUTH_CONFIG`).

**i18n, dates, HTTP**
- All user-visible text goes through ngx-translate keys; add keys to `public/i18n/fr.json`.
- Dates sent to the API as local `YYYY-MM-DD` — never `toISOString().split('T')[0]` (shifts the day in UTC+1/+2).
- URLs come from environment/config; no hard-coded `localhost`.

**Style:** Prettier (`.prettierrc`, single quotes), SCSS. Use Bootstrap grid and utility classes for layout; components use toolbox tokens; overrides go in the `app` cascade layer, never with `!important`. *This applies once spec 002 (tokens) lands; until then, existing code keeps its current styles.*

## Toolbox roadmap

One spec each, approved before any code (ARCHITECTURE §8):

1. **001 Foundations** ← **in review**: Vitest and Playwright, tags and `depConstraints`, CI, OnPush everywhere, lint at 0 errors, known build issues fixed, unused projects removed.
2. **002 Tokens and themes** ← **next**: `ui-tokens`, `theme-olivier`, theme compiler, cascade layers, Bootstrap trim, `util-format`, Stylelint and contrast checks.
3. **003 Atoms and catalog:** the 16 Olivier atoms and `apps/ui-catalog`.
4. **004 Molecules, organisms and templates:** CDK overlays and app shell; remove ng-bootstrap, `moment` and bootstrap-icons.
5. **005 Shared logic:** `http/*` and `identity/*`; auth pages rebuilt on the auth layout (Sanctum cookie strategy).

## Known issues (do not "fix" silently — open or update a spec)

Tooling
- Production budget error limits are raised to 1.5 MB (initial) and 10 kB (component style); the warnings at 500 kB / 4 kB still fire. Restore in spec 002 (Bootstrap trim) and spec 004 (ng-bootstrap, `moment`, nav bar). (spec 001 D5.1)
- Vitest is pinned to 4 because `@nx/vitest`'s generator rejects 5; revisit when the Nx/Analog peers allow it.
- `nx run-many -t lint` has 0 errors but still reports warnings (`no-explicit-any`, `no-non-null-assertion`, `no-unused-vars`).
- Production `apiBaseUrl` is a placeholder (`https://api.example.invalid/api/v1`); replace it before the first deployment.

App behaviour found during spec 001, deliberately not changed (spec 005 unless noted)
- The frontend still calls the **old** API paths (`/auth/login`, `/money-transition`, `/categories`, `/profile`, …); the rebuilt backend on `:8001` serves none of them, so every call after sign-in returns 404 in development.
- `withCrudOperations` (and `loadSummary`) have no `catchError`: one failed request ends the stream for good (documented by a test in `shared/stores`).
- `AuthService.updatePassword` / `resetPassword` / `resetPasswordRequest` build URLs with a line break and spaces inside the template literal.
- Login fields bind `[showErrors]` to a non-existent `amount` control, so the sign-in page never shows field errors.
- Opening `/register` directly redirects to `/` (the auth store's `onInit` navigates to `''` without a token).
- `ResetPassword` never resets `loading` after the response; `SecuritySettingsComponent.openPasswordModal` assigns plain values over the modal wrapper's signals.
- The HTTP error interceptor shows "Client error occurred (undefined)" for a 4xx without a `message`.
- `text-input` and `select` ignore `setDisabledState`; `date-input` drops a value written before its view initialises. (spec 004)
- `bar-chart` relies on `chart-item` importing `chart.js/auto` to register Chart.js controllers. (spec 004)
