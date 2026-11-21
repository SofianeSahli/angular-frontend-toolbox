# 001 — Foundations: Design

> Status: Approved (2026-11-21)
> Requirements: [requirements.md](./requirements.md) (approved 2026-11-21)
> Architecture: [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) §2, §3, §6

## Overview

Workspace and tooling only. The order is:

1. **Remove** the projects the architecture doesn't keep, so nothing below has to deal with them.
2. **Repair builds**: production environment, `ui-components:build`, budgets.
3. **Tag projects and enforce `depConstraints`**, then fix lint to zero errors, including switching 33 components to `OnPush` without changing behaviour.
4. **Add unit tests**: Angular's Vitest builder for the app, and Nx's Vitest setup for the libraries.
5. **Add Playwright** with one smoke test.
6. **Add CI**: a GitHub Actions workflow plus `npm run ci`.

App code changes only where a requirement forces it (lint fixes and import paths). Each such change is mechanical and keeps behaviour the same, and the few exceptions are named in "Behaviour-sensitive changes".

## Facts this design relies on (checked 2026-11-21)

- Angular 22.2 ships `@angular/build:unit-test` with `runner: vitest` (the default), supporting Vitest `^4 || ^5`. It needs a `buildTarget`, so it fits **applications**.
- Nx 24's `@nx/angular` generators choose `vitest-angular` (`@nx/angular:unit-test`) only for **buildable** libraries. For non-buildable libraries (all three of ours) they choose `vitest-analog` (`@nx/vitest` + `@analogjs/vitest-angular`). Peer ranges: `@nx/vitest@24.0.6` supports Vitest `^3–^5`, and `@analogjs/vitest-angular@2.9.7` supports Vitest `^1–^5` and Angular devkit `< 0.2300`.
- 28 `*.spec.ts` files exist: 12 in the app, 5 in auth, 11 in ui-components, 0 in stores. 5 of them import `@ionic/angular`.
- Lint on the kept projects: **53 errors to fix** (app 10, auth 9, ui-components 34) and **33 `prefer-on-push` errors** (app 12, auth 6, ui-components 15). The launcher and uncensored errors disappear with those projects.
- Trial production build (`environment` problem bypassed): initial bundle **1.34 MB** (error budget 1 MB), and `nav-bar.scss` **8.08 kB** (error budget 8 kB). Six more component styles exceed the 4 kB *warning* budget.
- Nothing imports `@env/expenses`, `@env/launcher` or `profile-section` except the launcher itself. `@angular-architects/module-federation` has no imports.

## D1 — Unit test runner (REQ-1.1 – 1.7)

**Decision: Angular's own builder where it fits, Nx's default where it doesn't.**

| Project | Target `test` | Why |
|---|---|---|
| `expenses-management` | `@angular/build:unit-test`, `runner: vitest`, `buildTarget: expenses-management:build:development`, jsdom | Angular's own builder, which you preferred. The app has a build target. |
| `auth`, `stores`, `ui-components` | `@nx/vitest` with `@analogjs/vitest-angular`, jsdom, via `nx g @nx/vitest:configuration` | The libraries have no build target. Making them buildable just for tests would add ng-packagr builds we don't publish. This is also what Nx 24 generates for every future non-buildable library (specs 002–005), so new libraries match without hand-made config. |

- **Shared test setup:** each project gets `src/test-setup.ts`, initialising the TestBed environment the same way the app runs (zone-based change detection), so tests behave like the app. The app uses it via `setupFiles`, the libraries via their `vitest.config.mts`.
- **Generator defaults (REQ-1.3):** in `nx.json`, `@nx/angular:application` gets `unitTestRunner: vitest-angular` and `e2eTestRunner: playwright`; `@nx/angular:library` gets `unitTestRunner: vitest-analog`.
- **Targets and caching:** `test` gets `cache: true` and `production`-style inputs in `targetDefaults`, so `nx affected -t test` works (REQ-1.2). Failure exits non-zero (REQ-1.6), which is the default for both runners.
- **Alternative considered:** Analog for all four projects (one config style). Rejected: Angular's builder is preferred wherever a project can use it (decided 2026-11-21).

### Existing specs (REQ-1.4, REQ-1.5)

These rules apply in order to each of the 28 files:

1. **The 5 files importing `@ionic/angular`:** rewrite them as standalone TestBed tests (`imports: [Component]`, no `declarations`, no Ionic), or delete them if rule 3 applies.
2. **Generated "should create" tests that fail only for missing providers:** add the providers the component really needs: `provideHttpClient()` + `provideHttpClientTesting()`, `provideRouter([])`, `provideTranslateService()`, an `AUTH_CONFIG` value, and `NgbActiveModal` for modal content. Keep the test.
3. **Delete a test** only if making it pass would need a code change outside this spec's scope (for example a component that can't be created without a backend). Each deletion is listed in `tasks.md` with its reason.

### New meaningful tests (REQ-1.7)
- `stores`: `withCrudOperations` load success, and a load error that leaves the loader off. The second exposes the known "stream dies on error" bug, so it is written to document **today's** behaviour, with a comment pointing to spec 005. It must not fail CI or change store code.
- `ui-components`: `regexValidator`, `passwordMatchValidator` and `dateRangeValidator`, including the same-day case, which documents today's `start >= end` behaviour.
- `auth`: `authRoutes` contains the 4 expected paths. That's a pure check that needs no HTTP.

Covers: REQ-1.1 – REQ-1.7.

## D2 — End-to-end (REQ-2.1 – 2.5)

- **New project `apps/expenses-management-e2e`** (`@nx/playwright`), tags `scope:expenses type:e2e`, with an implicit dependency on `expenses-management`.
- `playwright.config.ts`: Chromium only, `webServer` runs `npx nx serve expenses-management` on `http://localhost:4200` and reuses an already running server locally, `trace: 'retain-on-failure'`, `screenshot: 'only-on-failure'` (REQ-2.5).
- **Smoke test `smoke.spec.ts`:**
  1. Fresh browser context, so storage is empty (REQ-2.2, REQ-2.3). With no token, the auth store makes no HTTP call. This was checked manually in step 1: `/` showed no console errors.
  2. Listen to `pageerror` and `console` messages of type `error`, and fail if any appears during load (REQ-2.4).
  3. `goto('/')`, then expect the sign-in title ("Se connecter"), the username field and the password field to be visible.
- **No backend and no mocks are needed.** Translations come from the dev server (`/i18n/fr.json`).
- **Tag `type:e2e`:** ARCHITECTURE §3 doesn't define it. It adds **no** constraint row, because e2e projects import nothing from libraries. Approved 2026-11-21: ARCHITECTURE §3 gets one sentence, "E2E projects are tagged `type:e2e`; they import no library, so no constraint row applies."

Covers: REQ-2.1 – REQ-2.5.

## D3 — Tags and boundaries (REQ-3.1 – 3.6)

### Tags

| Project | Tags | Notes |
|---|---|---|
| `expenses-management` | `scope:expenses`, `type:app` | |
| `expenses-management-e2e` | `scope:expenses`, `type:e2e` | see D2 |
| `stores` | `scope:shared`, `type:data-access` | matches ARCHITECTURE §2 |
| `auth` | `scope:shared`, `type:feature` | **Interim.** It holds pages, a store and interceptors. `feature` is the only type allowed to hold pages and import both `ui` (`@shared/ui-components`, 6 imports) and `data-access` (`@shared/stores`, 2 imports). Split into `identity/*` + `http/*` in **spec 005**, noted in `project.json` (REQ-3.2). |
| `ui-components` | `scope:shared`, `type:ui` | **Interim, no `layer:*` tag.** It mixes atoms, molecules, organisms and form validators. Any single layer tag would be false. It imports no other library, so the `type:ui` constraint holds. It is split by level in **specs 002–004**, noted in `project.json`. |

`project.json` has no comment syntax, so the note goes in a `"// tags"` string property, the same pattern Nx already uses with `"// targets"`.

### `eslint.config.mjs`
- Replace the `*` → `*` constraint with the **exact** `depConstraints` block from ARCHITECTURE §3 (REQ-3.3). Violations are errors (REQ-3.4). Keep `enforceBuildableLibDependency: true`.
- With the tags above, all current imports are allowed: app → feature/data-access/ui, feature → ui/data-access, ui and data-access → nothing. No new boundary error is expected; T8 verifies this.

### Deep imports (REQ-3.6): 6 errors, all in the app
- `apps/expenses-management/src/...` imports (5 places) become relative imports.
- `shared/stores/src/lib/signals/base-crud.signals` in `categories.signal.ts` becomes `@shared/stores`, which already exports it. This one wasn't flagged as an error, but REQ-3.6 covers it.

### Lint fixes (REQ-3.5): 53 errors of other rules, by kind (the 33 `prefer-on-push` errors are D3.1)

| Rule (count) | Fix | Behaviour |
|---|---|---|
| `component-selector` / `directive-selector` (11) | Rename to the project prefix (`app-loader` → `lib-loader`, `appRipple` → `libRipple`, …) and update every template that uses them | none (renames only) |
| `no-empty-function` (14) | CVA placeholders such as `onChange = () => {}` get a body comment (`/* replaced by registerOnChange */`), which the rule accepts. Truly dead code (empty `effect`, empty `ngOnInit`, empty `logout()`) is deleted after checking that no template calls it. | none |
| `no-empty-lifecycle-method` (1) | delete the empty `ngOnInit` | none |
| `no-inferrable-types` (6) | drop the redundant type annotation | none |
| `prefer-inject` (5) | constructor parameters become `inject()` fields | none |
| `no-output-native` (1) | `context-menu` output `select` becomes `itemSelected`. No template uses it today. | none |
| `no-input-rename` (1) | `switch-buttons`: `valueInput = input('', {alias:'value'})` + `value = linkedSignal(...)` becomes `value = input('')` + internal `selected = linkedSignal(this.value)` | none: same public `value` / `valueChange` API, so `[(value)]` still works |
| `template/eqeqeq` (3) | see "Behaviour-sensitive changes" | kept the same |
| a11y: `click-events-have-key-events`, `interactive-supports-focus` (8), `alt-text` (1), `elements-content` (3) | Add `tabindex="0"`, a matching `(keydown.enter)` / `(keydown.space)` handler, `alt` text and `aria-label`s | ⚠️ **small behaviour addition:** these elements become reachable and usable by keyboard. Nothing visible changes. |
| `enforce-module-boundaries` (6) | see "Deep imports" above | none |

### D3.1 — Switch 33 components to `OnPush` (REQ-3.5a, REQ-3.5c)

**Decided 2026-11-21: fix, don't list.** Each component flagged by `prefer-on-push-component-change-detection` goes from `ChangeDetectionStrategy.Eager` to `OnPush`. No lint override is used (REQ-3.5b).

**Why it can break things.** With `OnPush`, Angular redraws a component only when one of these happens: an input changes, a template event fires in it, a signal it reads changes, or someone calls `markForCheck()`. Any template-visible field changed **any other way** stops showing up on screen. Examples are a `subscribe` callback, `setTimeout`, `queueMicrotask`, a `.then()`, `writeValue` from a parent form, or a property set from outside on a dynamically created component.

**Rule for each component.** Find every field the template reads. If it can change outside those four triggers:
1. **Preferred:** turn it into a `signal()` (matches the `CLAUDE.md` signals-first rule) and update the template to call it.
2. **Where a signal would ripple through many files** (for example `image-cropper`'s 11 fields driven by fabric.js events), inject `ChangeDetectorRef` and call `markForCheck()` at each async mutation point.
3. **Dynamically created components** (modal content): `AppModalWrapperComponent` sets inputs with `ComponentRef.setInput()` instead of assigning `instance[key]`, so OnPush children are marked dirty.

**Risk groups** (from a scan of async patterns and mutable fields; each component is still read in full during its task):

| Group | Components | Risk | Specific concern |
|---|---|---|---|
| A — presentational / signal-driven | app, dashboard, list-items, summary, summary-item, bar-chart, chart-item, parameters, profile-form, form, login, register, confirmations, context-menu, drawer-header, error-alert, loader, toast, app-navbar, nav-bar | low | Fields only change in template events or via signals/inputs. Charts draw on a canvas in an `effect`, which OnPush doesn't affect. |
| B — form controls (CVA) | text-input, select-component, date-input, switch-buttons, files-input | **high** | `writeValue()` from `form.patchValue()` / `reset()` sets `_value` without redrawing. Fix: store the value in a signal (or `markForCheck()` in `writeValue` and `setDisabledState`). `files-input` also has 10 async callbacks (FileReader). |
| C — HTTP results in plain fields | request-reset-password, reset-password, update-password-form, security-settings | **high** | Fields set inside `subscribe` callbacks (success/error messages, loading flags). |
| D — dynamic / timers | modal-wrapper, list, date-range, image-cropper | **high** | modal-wrapper sets `isLoading` in a subscription and assigns properties on the created child; list uses `queueMicrotask`; date-range's patching comes from quick-period clicks (probably fine, verify); image-cropper reacts to fabric.js canvas events. |

**Verification (REQ-3.5c), beyond the build and lint:**
- **Unit tests** for group B: one test per form control proving `setValue()` / `reset()` on the parent form updates the rendered value, and `setDisabledState` updates the disabled state. These double as REQ-1.7 tests.
- **Component tests with fake HTTP** for groups C and D (changed 2026-11-21: the backend was rebuilt, so the old API these screens call no longer exists anywhere). Each test renders the real component with `HttpTestingController`, answers the request with a success and an error response, and checks the rendered DOM updates *without* calling `fixture.detectChanges()` on the component directly. This is the way OnPush bugs actually show: run the change detection the app runs, through `fixture.autoDetectChanges()` and `whenStable()`. Dynamic modal content (modal-wrapper) is checked by opening it the way `List` does.
- **Manual checks in the browser** only where no backend is needed: the sign-in, register and reset-password pages, and the modal open/close behaviour. Screens behind sign-in can't be reached without a compatible backend, so they rely on the component tests. The verification report says so explicitly.
- Group A gets a component render test per screen with fake store data (one per component that has no test yet), instead of a manual smoke pass.
- If a component can't keep its behaviour without a visible or functional change, stop and ask (REQ-3.5c).

Covers: REQ-3.1 – REQ-3.6.

## D4 — Remove what the architecture doesn't keep (REQ-4.1 – 4.5)

- Delete `apps/launcher`, `apps/uncensored` and `shared/profile-section`.
- `tsconfig.base.json`: remove the `@env/launcher`, `@env/expenses` (broken and unused) and `profile-section` paths.
- `package.json`: remove `@angular-architects/module-federation` and regenerate the lockfile through `npm install`.
- Docs: remove these from the `CLAUDE.md` and `README.md` tables and Known issues. Also in `CLAUDE.md`:
  - drop the convention "Existing components are pinned to `Eager`… switch them only when you touch them", since after D3.1 every component is `OnPush`;
  - Known issues keeps only what is still true, plus the budget entry (D5.1);
  - the Commands section gains `test`, `e2e` and `npm run ci`.
- Docs: `README.md` commands lose "coming in spec 001", and ARCHITECTURE §3 gains the `type:e2e` sentence (D2).
- `nx show projects` should then list `expenses-management`, `expenses-management-e2e`, `auth`, `stores` and `ui-components` (REQ-4.3).
- No move or rename of kept libraries (REQ-4.4).

Covers: REQ-4.1 – REQ-4.5.

## D5 — Builds and API base URL (REQ-5.1 – 5.7)

- **Production environment:** add `apps/expenses-management/src/environments/environments.prod.ts` with the same keys as `environments.ts`, and `apiBaseUrl: 'https://api.example.invalid/api/v1'` with a `// TODO(deploy): replace before first deployment` comment. Point `fileReplacements` at the app's **own** two files (REQ-5.1, REQ-5.2).

### D5.2 — One API base URL per app (REQ-5.6, REQ-5.7)

Today there are three base URLs: `apiBaseUrl` (`:3000`, auth), `mainAppUrl` (`:8000`, categories and transactions), and `profileBaseUrl`, hard-coded in `app.config.ts`. Two calls use no base at all. After this change:

| Where | Today | After |
|---|---|---|
| `environments.ts` | `apiBaseUrl: :3000`, `mainAppUrl: :8000`, plus endpoint paths | `apiBaseUrl: 'http://localhost:8001/api/v1'` (rebuilt backend), plus the same endpoint paths; `mainAppUrl` removed |
| `environments.prod.ts` | missing | `apiBaseUrl` placeholder (above) |
| `app.config.ts` `AUTH_CONFIG` | `apiBaseUrl` + hard-coded `profileBaseUrl` | `apiBaseUrl` only |
| `shared/auth` `AuthConfig` | `apiBaseUrl`, optional `profileBaseUrl` | `profileBaseUrl` removed |
| `ProfileService.get` / `patchProfile` | `profileBaseUrl! + profileEndpoint!` | `apiBaseUrl + profileEndpoint` |
| `ProfileService.getById` | `profileEndpoint ?? 'profile' + '/' + id` (no base, and an operator-precedence bug that drops `id`) | `` `${apiBaseUrl}${profileEndpoint ?? '/profile'}/${id}` `` |
| `AuthService.logout` | `logoutEndpoint ?? 'logout'` (no base) | `` `${apiBaseUrl}${logoutEndpoint ?? '/auth/logout'}` `` |
| `MoneyTransitionService`, `CategoriesService` | `environment.mainAppUrl` | `environment.apiBaseUrl` |

- **Only base URLs change; endpoint paths stay as they are** (REQ-5.7). The rebuilt backend doesn't serve those paths yet. Adapting the calls is spec 005 and the expenses work, so in development every API call after sign-in will return 404 until then. That's expected, and not a regression this spec introduces: the old services on `:3000`/`:8000` no longer exist.
- `getById` and `logout` are the only call sites whose URL *form* changes (they gain the base, and `getById` keeps its `id`). Both are listed under "Behaviour-sensitive changes".
- Verified by unit tests with `HttpTestingController` that assert the request URL of each service method (T-task), plus a grep proving no `localhost` or second base URL remains (REQ-5.6).
- **`ui-components:build`:** **remove the target** (REQ-5.3). The library is consumed from source like the others. Its config points at a missing `ng-package.json` and a non-existent `libs/shared-styles` folder. A real build target can come back when a spec needs a publishable library.

### D5.1 — Production budgets (REQ-5.1 vs REQ-5.5)

**Decided 2026-11-21: option A.** Error limits: initial **1.5 MB**, component style **10 kB**. Warning limits unchanged (500 kB / 4 kB). Listed in `CLAUDE.md` Known issues, to be restored by specs 002 and 004. This is the approval REQ-5.5 requires.

Once the environment is fixed, the production build **still fails** on two budget **errors**: the initial bundle is 1.34 MB (limit 1 MB) and `nav-bar.scss` is 8.08 kB (limit 8 kB). REQ-5.5 forbids loosening budgets without your approval, and the non-goals forbid the real fixes in this spec (removing ng-bootstrap and `moment`, trimming Bootstrap, rebuilding the nav bar). Options:

| Option | What | Trade-off |
|---|---|---|
| **A (recommended)** | Raise the **error** limits just above today's size: initial 1.5 MB, component style 10 kB. Keep the **warning** limits at 500 kB / 4 kB so the overage stays visible on every build. List it in Known issues, to be restored in spec 002 (Bootstrap trim) and spec 004 (ng-bootstrap, `moment`, nav bar). | Build passes, the overage stays visible, nothing in the app changes. |
| B | Keep the budgets and accept that `nx build` (production) fails until spec 004. CI builds the development configuration only. | Honest, but REQ-5.1/5.4 fail and production builds go unchecked for several specs. |
| C | Reduce the bundle now (for example lazy-load Chart.js and fabric). | Changes app code beyond this spec's scope and breaks a non-goal. |

Covers: REQ-5.1 – REQ-5.7.

## D6 — CI (REQ-6.1 – 6.7)

**`.github/workflows/ci.yml`**, one workflow:

```yaml
on:
  pull_request: { branches: [main] }
  push:         { branches: [main] }
jobs:
  main:
    runs-on: ubuntu-latest
    env: { NX_NO_CLOUD: true }
    steps:
      - actions/checkout (fetch-depth: 0)        # full history for nx affected
      - actions/setup-node (node-version-file: .nvmrc, cache: npm)
      - npm ci
      - nrwl/nx-set-shas                          # base = last green main / PR base
      - npx nx affected -t lint test build
      - if push to main: npx playwright install --with-deps chromium
      - if push to main: npx nx e2e expenses-management-e2e
      - if failure: upload playwright-report/ and test-results/ as artifacts
```

- Actions pinned to their current major versions. No secrets and no backend (REQ-6.5). Any failing step fails the run (REQ-6.3).
- `build` in CI uses each project's **default** configuration, which is production for the app. That's why D5.1 matters.
- **Node 24:** `.nvmrc` contains `24`, and `package.json` gets `"engines": { "node": ">=24 <25" }` (REQ-6.4).
- **`npm run ci`** (REQ-6.7): `nx affected -t lint test build --base=main`, the same steps as the PR job, compared against local `main`. Also `npm run ci:all` (`nx run-many -t lint test build`) for a full run, and `npm run e2e` (`nx e2e expenses-management-e2e`).

Covers: REQ-6.1 – REQ-6.7.

## Behaviour-sensitive changes (all other code changes are mechanical)

1. **`list-items.html` `==` (3 places).** The API may send `is_income` as `0`/`1`, `"0"`/`"1"` or `true`/`false`; elsewhere the code calls `is_income.toString()`. A plain `===` would change which border colour shows. The fix is a `computed` in `ListItems`, `isIncome = computed(() => Number(this.moneyTransition().categorie.is_income) === 1)`, used by all three bindings. That's the same result as `==` for every one of those values. The only difference is `null`/`undefined`, which `==` treats as neither 0 nor 1 and the new code treats as "expense". Checked manually in T7.
2. **Keyboard access** added by the a11y fixes (D3). It adds behaviour without changing anything visible.
3. **One API base URL** (D5.2). The development host moves from `:3000`/`:8000` (old services, gone) to `:8001` (rebuilt backend). `ProfileService.getById` and `AuthService.logout` now include the base URL, and `getById` keeps its `id`.
4. **`OnPush` on 33 components** (D3.1). Intended to be invisible; the risk groups B–D get targeted fixes and checks.

## Requirement coverage

| REQ | Covered by |
|---|---|
| 1.1, 1.2, 1.3, 1.6 | D1 |
| 1.4, 1.5 | D1 "Existing specs" |
| 1.7 | D1 "New meaningful tests", D3.1 (form-control tests) |
| 2.1 – 2.5 | D2 |
| 3.1, 3.2 | D3 Tags |
| 3.3, 3.4 | D3 eslint config |
| 3.5, 3.5b | D3 Lint fixes, D3.1 |
| 3.5a, 3.5c | D3.1 |
| 3.6 | D3 Deep imports |
| 4.1 – 4.5 | D4 |
| 5.1 – 5.5 | D5, D5.1 (option A) |
| 5.6, 5.7 | D5.2 |
| 6.1 – 6.5, 6.7 | D6 |

## Risks
- **OnPush regressions** (D3.1): the largest risk in this spec. With no compatible backend, screens behind sign-in are verified only by component tests, never by hand. That is weaker than a real click-through, and the report says so.
- **Zone vs zoneless TestBed:** Angular 22's test defaults may differ from the app's zone-based setup. `test-setup.ts` pins it, and T-tasks verify it with an existing component test.
- **Analog + Angular 22.2:** the peer ranges fit (checked above), but this is a young combination. If the Analog setup fails on Angular 22.2, the fallback is to give the three libraries an ng-packagr build target so they can use Angular's builder through `@nx/angular:unit-test`. That is a bigger change, so I'll stop and ask before switching.
- **Existing specs** may hide real bugs that make them fail. Rule 3 in D1 stops scope creep: list and delete, don't fix app code.

## Decisions (resolved 2026-11-21)
1. [x] **D5.1 budgets:** option A.
2. [x] **`prefer-on-push`:** fix all 33 components (D3.1). No override.
3. [x] **D2 tag `type:e2e`:** added; ARCHITECTURE §3 tag list updated to mention it, with no constraint row.
4. [x] **D1 runners:** Angular builder for the app, Analog for the libraries.
