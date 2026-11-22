# 001 — Foundations: Tasks

> Status: Approved (2026-11-21)
> Design: [design.md](./design.md) (approved 2026-11-21, D5.2 and the D3.1 verification method added the same day)
> Branch: `spec/001-foundations`. One commit per task: `<type>(<scope>): <summary> [spec 001, REQ-x.y]`.

Order: removal → tooling (Node, test runner) → config (URLs, builds) → tags and boundaries → lint fixes → OnPush (tests first) → e2e → CI → docs → final report.
"Base checks" means `npx nx run-many -t lint test build` with no new failure compared to the previous task. Lint reaches zero errors at T15. T12–T14 come first because they are the riskiest switches.

## Removal and tooling

- [ ] **T1 — Remove the projects the architecture doesn't keep**
  - Fulfils: REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4, REQ-4.5
  - Files: `auth`, `stores`, `ui-components` and the app stay where they are, with the same names (checked again at T19). Delete `apps/launcher`, `apps/uncensored`, `shared/profile-section`; `tsconfig.base.json` (remove `@env/launcher`, `@env/expenses`, `profile-section`); `package.json` and `package-lock.json` (remove `@angular-architects/module-federation`)
  - Verify: `npx nx show projects` → `expenses-management`, `auth`, `stores`, `ui-components`; `grep -rn "launcher\|uncensored\|profile-section\|module-federation"` outside `docs/`, `specs/` and `node_modules` → nothing; `nx build expenses-management --configuration=development` passes

- [ ] **T2 — Pin Node 24**
  - Fulfils: REQ-6.4
  - Files: `.nvmrc` (`24`), `package.json` (`engines.node: ">=24 <25"`)
  - Verify: `npm ci` passes on Node 24.13

- [ ] **T3 — Vitest for the app (Angular builder)**
  - Fulfils: REQ-1.1, REQ-1.6
  - Files: `apps/expenses-management/project.json` (`test` target: `@angular/build:unit-test`, `runner: vitest`, `buildTarget: expenses-management:build:development`), `apps/expenses-management/src/test-setup.ts`, `tsconfig.spec.json`; devDependencies `vitest`, `jsdom`
  - Verify: `nx test expenses-management` runs. Failures in existing specs are expected here and are handled in T5. One trivial spec (`summary-item`) passes, proving the setup and zone-based change detection work.

- [ ] **T4 — Vitest for the libraries (Analog)**
  - Fulfils: REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.6
  - Files: `nx g @nx/vitest:configuration` for `auth`, `stores`, `ui-components` (Analog plugin, jsdom, `src/test-setup.ts` each); `nx.json` (generator defaults `vitest-angular` for apps and `vitest-analog` for libraries, `e2eTestRunner: playwright`; `test` target defaults with cache and inputs)
  - Verify: `nx test stores` runs (0 specs yet, so it passes); `nx affected -t test` selects only the touched projects after editing one file in `stores`

- [ ] **T5 — Existing specs: fix or delete**
  - Fulfils: REQ-1.4, REQ-1.5
  - Files: the 28 `*.spec.ts` files. The 5 `@ionic/angular` files are rewritten as standalone tests. Missing providers are added (`provideHttpClient` + testing, `provideRouter([])`, `provideTranslateService()`, `AUTH_CONFIG`, `NgbActiveModal`).
  - Verify: `nx run-many -t test` passes; `grep -rn "@ionic" --include=*.spec.ts` → nothing; each deleted file is listed below under "Deleted specs" with its reason

## Config and builds

- [ ] **T6 — One API base URL (tests first)**
  - Fulfils: REQ-5.6, REQ-5.7, REQ-1.7
  - First: service tests with `HttpTestingController` asserting the request URL of `ProfileService.get/patchProfile/getById`, `AuthService.login/logout`, `MoneyTransitionService.load`, and `CategoriesService.load`. They fail before the change.
  - Then: `environments.ts` (single `apiBaseUrl: http://localhost:8001/api/v1`, `mainAppUrl` removed), `app.config.ts`, `shared/auth` `AuthConfig` (drop `profileBaseUrl`), `profile.service.ts`, `auth.service.ts` (`logout`), `money-transition.service.ts`, `Categories.service.ts`
  - Verify: the new tests pass; `grep -rn "localhost\|mainAppUrl\|profileBaseUrl" apps shared --include=*.ts` → only `environments.ts`; base checks

- [ ] **T7 — Production build**
  - Fulfils: REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4, REQ-5.5
  - Files: `environments.prod.ts` (placeholder + `TODO(deploy)`), `fileReplacements` → the app's own files, budgets (errors 1.5 MB / 10 kB, warnings unchanged), remove the `ui-components:build` target
  - Verify: `nx build expenses-management` (production) passes and still prints the budget **warnings**; the built `main-*.js` contains `api.example.invalid` and no `localhost`; `nx run-many -t build` passes

## Boundaries and lint

- [ ] **T8 — Tags and `depConstraints`**
  - Fulfils: REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4
  - Files: the 4 `project.json` (tags, plus a `"// tags"` note on `auth` → spec 005 and on `ui-components` → specs 002–004); `eslint.config.mjs` (the exact §3 block)
  - Verify: `nx show project <p> --json` shows the tags; a temporary import of `@shared/auth` from `stores` gives a boundary **error** (reverted before commit); no new boundary error beyond the 6 known deep imports

- [ ] **T9 — Deep imports**
  - Fulfils: REQ-3.6
  - Files: the 5 `apps/expenses-management/src/...` imports become relative; `categories.signal.ts` → `@shared/stores`
  - Verify: `grep -rnE "from '(apps|shared)/" apps shared` → nothing; `enforce-module-boundaries` errors → 0; base checks

- [ ] **T10 — Mechanical lint fixes**
  - Fulfils: REQ-3.5, REQ-3.5b
  - Files: selector renames to `lib-` / `libRipple` (11) plus every template using them; `no-empty-function` (14); `no-empty-lifecycle-method` (1); `no-inferrable-types` (6); `prefer-inject` (5); `context-menu` `select` → `itemSelected`; `switch-buttons` input rename fix
  - Verify: these rules → 0 errors; `grep -rn "eslint-disable"` → nothing new; `nx build` (strict templates) passes, which proves all renamed selectors are matched. For `switch-buttons`, a host test of the `[(value)]` binding is written **first** in this task and passes before and after the input-rename fix.

- [ ] **T11 — `eqeqeq` and a11y fixes**
  - Fulfils: REQ-3.5
  - First: a `ListItems` test covering `is_income` = `0`, `1`, `"0"`, `"1"`, `true`, `false`, checking the same classes as today.
  - Then: `isIncome` computed in `list-items`; `tabindex`, key handlers, `alt` and `aria-label` in `files-input`, `image-cropper`, `nav-bar`, `app-navbar` and `security-settings`
  - Verify: tests pass; these rules → 0 errors; manual check: on the sign-in page and its links, Tab reaches each control

## OnPush (REQ-3.5a, REQ-3.5c), tests first in each task

- [ ] **T12 — Group B: form controls**
  - Components: `text-input`, `select-component`, `date-input`, `switch-buttons`, `files-input`
  - First: per control, a host-component test showing that `form.setValue()`, `form.reset()` and `disable()` from the parent update the rendered control, run with `autoDetectChanges`, against `Eager` (passes). It then must still pass after the switch.
  - Then: `OnPush` + value/disabled state in signals (or `markForCheck()` in `writeValue` / `setDisabledState`); `files-input` FileReader callbacks update signals
  - Verify: tests pass; manual check: sign-in and register fields type, clear and show validation as before

- [ ] **T13 — Group C: pages with HTTP results**
  - Components: `request-reset-password`, `reset-password`, `update-password-form`, `security-settings`
  - First: per component, a test answering its request with success and with error via `HttpTestingController`, checking the message and loading state shown
  - Then: `OnPush` + fields set in callbacks become signals
  - Verify: tests pass; manual check: reset-password pages render and validate as before (submitting shows the network-error dialog, as today, since the old endpoint is gone)

- [ ] **T14 — Group D: dynamic content and timers**
  - Components: `modal-wrapper`, `list`, `date-range`, `image-cropper`
  - First: tests for modal-wrapper content creation with inputs (`setInput`), its `isLoading` after `done`, `list` load-more after a scroll event with a fake HTTP page 2, and `date-range` quick-period buttons updating the labels
  - Then: `OnPush`, `ComponentRef.setInput()` in modal-wrapper, signals or `markForCheck()` in `image-cropper` canvas callbacks
  - Verify: tests pass; `prefer-on-push` errors for these 4 → 0; image-cropper is checked by a render test only (it isn't reachable without sign-in), and the report says so

- [ ] **T15 — Group A: the other 20 components**
  - Components: app, dashboard, list-items, summary, summary-item, bar-chart, chart-item, parameters, profile-form, form, login, register, confirmations, context-menu, drawer-header, error-alert, loader, toast, app-navbar, nav-bar
  - First: a render test with fake store or input data for each that has none after T5
  - Then: `OnPush`
  - Verify: tests pass; **`nx run-many -t lint` → 0 errors (REQ-3.5)**; manual check: sign-in and register pages, the theme toggle, and the error dialog (shown by submitting sign-in with no matching backend) open and close as before

## E2E, CI and docs

- [ ] **T16 — Playwright smoke test**
  - Fulfils: REQ-2.1 – REQ-2.5
  - Files: `apps/expenses-management-e2e` (`@nx/playwright`, tags `scope:expenses type:e2e`), `playwright.config.ts`, `src/smoke.spec.ts`
  - Verify: `nx e2e expenses-management-e2e` passes locally with the backend **stopped**; temporarily breaking the sign-in title makes it fail and leaves a trace (reverted)

- [ ] **T17 — CI workflow and `npm run ci`**
  - Fulfils: REQ-6.1 – REQ-6.5, REQ-6.7
  - Files: `.github/workflows/ci.yml`, `package.json` scripts `ci`, `ci:all`, `e2e`
  - Verify: `npm run ci` passes locally; the PR for this spec shows the workflow green; a deliberately failing test on a throwaway commit turns it red (reverted); e2e runs after merge to `main`

- [ ] **T18 — Docs**
  - Fulfils: REQ-4.1 (doc references), design D2/D4
  - Files: `CLAUDE.md` (project table, Known issues, Commands, drop the `Eager` convention, add the budget entry), `README.md` (projects, commands), `docs/ARCHITECTURE.md` §3 (`type:e2e` sentence)
  - Verify: no doc mentions removed projects as existing; every Known issue is still true

- [ ] **T19 — Final verification report**
  - Fill in the report below; mark `requirements.md`, `design.md` and this file as Done; open the PR

## Deleted specs
None. All 28 existing specs were kept and fixed (providers, required inputs, standalone imports instead of Ionic). Two chart specs (`bar-chart`, `summary`) stub `getContext` and `Chart.prototype.update`, because jsdom has no canvas; drawing is not under test.

## Deviations from spec
- **T3, app test setup:** no `src/test-setup.ts` for the app. Angular's `@angular/build:unit-test` generates its own TestBed setup, including `zone.js/testing` and `provideZoneChangeDetection()`, so zone-based change detection matches the app without extra code. Simplification of D1; no behaviour impact.
- **T3, Windows-only environment issue:** if `NX_WORKSPACE_ROOT_PATH` is set with a lowercase drive letter (`c:\projects\...`), for example by an editor's Nx integration, every app test fails with "Vitest failed to find the runner" (Vitest is loaded twice; see angular/angular-cli#33559). Workaround: unset that variable or set it to `C:\projects\...`. Not a repo problem; CI (Linux) is unaffected. Documented in CLAUDE.md in T18.

## Verification report
| REQ | Verified how | Result |
|---|---|---|
- **T4, Vitest version:** pinned to **Vitest 4** (`^4.1`), not 5. `nx g @nx/vitest:configuration` refuses Vitest 5 because a workspace package only accepts Vitest ≤ 4. Angular's builder supports both (`^4.0.8 || ^5`). Revisit when the Nx/Analog peers allow 5. Nx also chose Analog `~2.7.3`.
- **T4, stores tests in T4:** the planned `withCrudOperations` tests (D1, REQ-1.7) were written here rather than later, because a project with no tests fails `nx test`. The error-path test documents today's behaviour (the unhandled error ends the load stream), pointing to spec 005.
- **T10, regression from the Angular 22 migration found and fixed:** the migration turned `switch-buttons`' `value = model('')` into `valueInput = input('', {alias:'value'})` + `linkedSignal`, but `ngOnChanges` still read `changes['value']`, which no longer fires (changes are keyed by the property name). Result on `main`: the Summary and Parameters tab switches did not highlight the selected tab. Fixed by going back to `value = model('')` (which also fixes `no-input-rename`); covered by 3 host tests that failed before the fix.
- **T12, test hosts:** in Angular 22 a test host component is OnPush by default, and an OnPush parent never re-checks its children for them. The form-control tests therefore use an OnPush parent and run every case twice: once where the parent re-renders itself (the action came from an event in the parent) and once where it does not (the action came from elsewhere, e.g. an effect), with parent actions run inside `NgZone` the way an event handler does. The "does not re-render" cases failed before the fix. (A first version used an Eager test host; it was replaced because an Eager component breaks the zero-lint rule, REQ-3.5b. That version also showed a pre-existing dev-mode `NG0100 ExpressionChangedAfterItHasBeenChecked` in `select`, which the signal-based fix removes.)
- **T12, `select` assertions:** jsdom renders the select with `size="0"` and does not reflect option selection, so the select test checks the redraw through the `is-valid` class (with `showValid`) instead of `select.value`.
- **T12, existing gaps kept as they are (out of scope):** `text-input` and `select` ignore `setDisabledState` ("handled by input binding"), so `form.disable()` from a parent never disabled them; `date-input` drops a value written before its view initialises. Neither changed.
- **T11–T15, manual checks:** done in one browser pass after T15 (same screens for every task), recorded in the verification report.
- **T13, library tests were zoneless:** Angular 22's TestBed is zoneless by default and Analog 2.7's `setupTestBed({ zoneless: false })` only skips adding zoneless mode, so the T4 library setup ran with `NoopNgZone`. Fixed in each `test-setup.ts` (load `zone.js` + `zone.js/testing`, provide `provideZoneChangeDetection()`), matching the app's builder. All earlier tests still pass under zone. A mutation check (plain `loading` field under OnPush) makes the T13 error-case test fail, as intended.
- **T13, known issues kept (spec 005):** `updatePassword`, `resetPassword` and `resetPasswordRequest` build URLs with a line break and spaces inside the template literal (tests match the trimmed URL); `ResetPassword` never resets `loading` after the response; `SecuritySettingsComponent.openPasswordModal` assigns strings over the modal wrapper's `title`/`contentComponent` signals.
- **T14, `setInput()` not used (design D3.1 point 3 changed):** every caller passes `contentInputs` into writable signals (`ImageCropperComponent.images`, `ConfirmationModalComponent.message`) or plain properties, not `input()`s, so `ComponentRef.setInput()` would throw for them. The existing mechanism already works under OnPush (a signal write marks the child for redraw; plain properties are set before the child's first render), proven by the modal tests opened through `NgbModal` like `List`. No change to `modal-wrapper` beyond `OnPush`.
- **T14, other group D components:** `list` reads only signals, `date-range` changes its fields only in click/switch events, `image-cropper` changes template fields only in events or before its own `detectChanges()`. All switched without code changes; covered by tests (infinite scroll with fake HTTP pages, month navigation, cropper render).
- **T15, app-navbar:** its highlighted link (`btn-primary` etc.) comes from `isActive(router.url)`, which an OnPush component would normally not re-evaluate after a navigation. A test written first shows it still updates: `routerLinkActive` on each link marks the navbar's view for check on every navigation end. No code change needed.
- **T15, lint:** `nx run-many -t lint` reports **0 errors** in all 4 projects (warnings remain: `no-explicit-any`, `no-non-null-assertion`, `no-unused-vars`; REQ-3.5 is about errors). No `eslint-disable` anywhere.
