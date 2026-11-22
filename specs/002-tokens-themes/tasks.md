# 002 — Tokens and themes: Tasks

> Status: Done, in review (2026-11-22)
> Design: [design.md](./design.md)

Each task ends with: `nx affected -t lint`, `nx affected -t test`, and `nx build expenses-management --configuration=development` once the new app exists (T9). No e2e, no dev server, no browser.

- [x] **T1** — Delete the old apps and libraries, and every reference to them
  - Fulfils: REQ-8.1, REQ-8.2, REQ-8.3
  - Files: `apps/**`, `shared/auth/**`, `shared/ui-components/**`, `tsconfig.base.json`, `nx.json` (Playwright plugin, generator defaults), `package.json` scripts, `.github/workflows/ci.yml` (e2e steps), `shared/stores/tsconfig.lib.json` (stray include of an auth file)
  - Verify: `nx show projects` → `["stores"]`; `nx run-many -t lint test -p stores` ✅
- [x] **T2** — Remove unused dependencies; add Stylelint
  - Fulfils: REQ-8.8
  - Files: `package.json`, `package-lock.json`
  - Verify: a search finds no import or config use of the 15 removed packages (only mentions in docs); the lockfile keeps the Linux bindings (`@esbuild/linux-x64`, `@rolldown/binding-linux-x64-gnu`, `@nx/nx-linux-x64-gnu`, …); `nx run-many -t lint test -p stores` ✅
- [x] **T3** — `ui-tokens` library scaffold, `contract.json`, compiler and contrast checker with tests
  - Fulfils: REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.7, REQ-3.1–3.4, REQ-7.3, REQ-7.4, REQ-9.1
  - Files: `shared/ui/tokens/**`, `tsconfig.base.json`
  - Verify: `compile.spec.ts` (23 tests), `contrast.spec.ts` (6) ✅
- [x] **T4** — `theme-olivier` library: `tokens.json`, `contrast-pairs.json`, generated CSS/TS; `compile-tokens` / `check-tokens` targets on both libraries
  - Fulfils: REQ-2.1–2.5, REQ-2.7, REQ-3.5, REQ-3.6, REQ-7.5
  - Files: `shared/themes/olivier/**`, `shared/ui/tokens/project.json`, `nx.json`
  - Verify: `nx run-many -t check-tokens -p ui-tokens theme-olivier` ✅ (39 pairs pass in both themes). Changing `bg` in `tokens.json` without recompiling fails with "olivier.generated.css is out of date"; lowering `ink-muted` fails with "ink-muted on bg (text, light): 2.86:1, needs 4.5:1" ✅
- [x] **T5** — Global styles: `ui.scss`, `_bootstrap-map.scss`, ui-tokens README
  - Fulfils: REQ-1.4, REQ-1.6, REQ-4.1–4.4
  - Files: `shared/ui/tokens/src/styles/**`, `shared/ui/tokens/README.md`
  - Verify (T9 build): `styles.css` starts with `@layer reset,vendor,tokens,ui,app;`; Bootstrap content is Reboot, grid and utilities only (no `.btn`, `.modal`, `.navbar`, `.card`); `--bs-primary: var(--ui-color-accent)` in the tokens layer ✅
- [x] **T6** — `UiThemeService` and `provideUi` with tests
  - Fulfils: REQ-1.5, REQ-5.1–5.8, REQ-4.3, REQ-9.1
  - Files: `shared/ui/tokens/src/lib/**`, `shared/ui/tokens/src/index.ts`
  - Verify: `ui-theme.service.spec.ts` (9 tests), `provide-ui.spec.ts` (3) ✅
- [x] **T7** — `util-format` library with tests
  - Fulfils: REQ-6.1–6.7, REQ-9.1
  - Files: `shared/util/format/**`, `tsconfig.base.json`
  - Verify: `money.spec.ts` (16), `dates.spec.ts` (10), `pipes.spec.ts` (2) ✅
- [x] **T8** — Stylelint config and `stylelint` targets
  - Fulfils: REQ-7.1, REQ-7.2
  - Files: `stylelint.config.mjs`, each `project.json`, `nx.json`
  - Verify: `nx run-many -t lint` runs Stylelint for every project, 0 errors. A scratch file with `#fff`, `12px` padding, `Arial`, `2px solid red` and `--foo: 3rem` gets 6 errors; `1px solid var(--ui-color-line)` and `var(--ui-space-4)` pass ✅
- [x] **T9** — New `expenses-management` app
  - Fulfils: REQ-2.6, REQ-4.5, REQ-8.4, REQ-8.5, REQ-9.1
  - Files: `apps/expenses-management/**`
  - Verify: `app.spec.ts`, `home.spec.ts` (2 tests) ✅; lint (ESLint + Stylelint) ✅; development build ✅; production build ✅ with the restored budgets: initial 414.87 kB (warning 500 kB, error 1 MB), no component-style warning
- [x] **T10** — CI, scripts and docs
  - Fulfils: REQ-3.5, REQ-8.2, REQ-8.6, REQ-9.2
  - Files: `.github/workflows/ci.yml`, `package.json`, `CLAUDE.md`, `README.md`, `docs/ARCHITECTURE.md`
  - Verify: `npm run ci` (lint, test, build and check-tokens of the affected projects) ✅

## Deviations from spec
- **T1 (REQ-8.3, "stores unchanged"):** `shared/stores/tsconfig.lib.json` included a file of the deleted `shared/auth` (`../auth/src/lib/auth/auth.signals.ts`). That include was removed. It is the only change to `stores`.
- **T2 (REQ-8.8):**
  - Also removed `@angular-devkit/build-angular` (only the deleted `extract-i18n` target used it) and `@nx/web` (only the deleted `serve-static` target used it), under "any other tool no target uses".
  - Stylelint is pinned to `~17.16.0`, because 18.x needs Node ≥ 24.15 and the development machine runs 24.13.
- **T4 (REQ-2.2, REQ-2.7):** the repo `tokens.json` adds `type.families.arabic`, which is not in the design-system export. It should be added to the design system so that the next export keeps it.
- **T5 (REQ-4.2):**
  - The `--bs-*` mapping uses `radius-sm/md/lg/pill` and the `body` text style. These are not in the "must provide" list, so a theme used with Bootstrap must define them (documented in the ui-tokens README).
  - Every colour also gets a derived `--ui-color-<name>-rgb` for Bootstrap's `rgba()`; components never read it.
- **T7 (tests):** tests in `ui-tokens` and `util-format` failed at random with "contains Angular decorators but is not in the TypeScript program". Vite's file watcher was making Analog drop its compiled output mid-run.
  - Fix: `server: { watch: null }` in both `vite.config.mts` files; 5 of 5 runs passed afterwards.
  - Cost: `vitest --watch` does not re-run in those two libraries.
  - Recorded in CLAUDE.md "Known issues".
- **T9:**
  - The environment files are named `environment.ts` / `environment.prod.ts` (the old app used `environments.*`).
  - The app's tests fail with "Vitest failed to find the runner" when run from a Git Bash session whose current directory has a lowercase drive letter, even with `NX_WORKSPACE_ROOT_PATH` unset. Run from PowerShell in `C:\...`, they pass. Recorded in CLAUDE.md.

## Verification report
| REQ | Verified how | Result |
|---|---|---|
| 1.1 | `contract.json` (31 colours + `sans`); compile tests "fails when a must provide colour/font is missing" | ✅ |
| 1.2 | compile test "accepts the real contract with the documented defaults"; `defaults.generated.css` | ✅ |
| 1.3 | compile tests: reduced-motion block in the defaults and for an overridden duration | ✅ |
| 1.4 | production `styles.css` starts with the layer statement | ✅ |
| 1.5 | `provide-ui.spec.ts` | ✅ |
| 1.6 | `shared/ui/tokens/README.md` lists every variable, its list, its default and the component-token convention | ✅ |
| 1.7 | compile test "holds no brand value" | ✅ |
| 2.1 | `shared/themes/olivier`, tags `scope:shared type:ui layer:tokens` | ✅ |
| 2.2 | `tokens.json` copied unchanged except the Arabic family (deviation); hex values emitted as written | ✅ |
| 2.3 | `olivier.generated.css` has 5 `[data-accent]` blocks; `olivierTheme.accents` | ✅ |
| 2.4 | `focus-ring` → `var(--ui-color-brand)` in the generated CSS | ✅ |
| 2.5 | Olivier README; `check-tokens` drift check | ✅ |
| 2.6 | app `index.html`: Google Fonts `<link>` with `display=swap` (Inter, IBM Plex Sans Arabic) | ✅ (by inspection; no browser check) |
| 2.7 | compile test for `:lang(ar)`; generated CSS | ✅ |
| 3.1–3.4 | `compile.spec.ts` | ✅ |
| 3.5 | drift check failed on a stale file (T4); `check-tokens` in the CI step | ✅ (CI run pending on the PR) |
| 3.6 | `compile-tokens` / `check-tokens` targets, cached | ✅ |
| 4.1 | production CSS: only Reboot, grid and utilities, inside `@layer vendor` | ✅ |
| 4.2 | `_bootstrap-map.scss`; `--bs-primary: var(--ui-color-accent)` in the output | ✅ |
| 4.3 | service test: `data-bs-theme` follows the theme | ✅ |
| 4.4 | layer order: `app` is last; nothing toolbox-side is unlayered | ✅ |
| 4.5 | production build within 500 kB / 1 MB and 4 kB / 8 kB | ✅ |
| 5.1–5.8 | `ui-theme.service.spec.ts`, `provide-ui.spec.ts` | ✅ |
| 6.1–6.7 | `money.spec.ts`, `dates.spec.ts`, `pipes.spec.ts`; `money.ts` / `dates.ts` import nothing from Angular | ✅ |
| 7.1, 7.2 | Stylelint in every project's `lint`, 0 errors; scratch-file check (T8) | ✅ |
| 7.3–7.5 | `contrast.spec.ts`; `contrast-pairs.json`; contrast failure shown in T4 | ✅ |
| 8.1, 8.2 | T1: projects, aliases, Playwright plugin, e2e CI steps and script removed | ✅ |
| 8.3 | `stores` lint and tests pass; one config change (deviation) | ✅ |
| 8.4, 8.5 | T9 tests, lint, dev and production builds | ✅ |
| 8.6 | `CLAUDE.md`, `README.md`, ARCHITECTURE §5 and §7 updated | ✅ |
| 8.7 | nothing was deleted before the owner approved implementation (2026-11-22) | ✅ |
| 8.8 | T2 | ✅ |
| 9.1 | the specs listed above: 41 (ui-tokens) + 28 (util-format) + 2 (app) | ✅ |
| 9.2 | no e2e, no dev server, no browser were used | ✅ |
