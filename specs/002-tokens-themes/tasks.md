# 002 — Tokens and themes: Tasks

> Status: Approved (2026-11-22; the owner asked to implement directly)
> Design: [design.md](./design.md)

Each task ends with: `nx affected -t lint`, `nx affected -t test`, and `nx build expenses-management --configuration=development` once the new app exists (T9). No e2e, no dev server, no browser.

- [ ] **T1** — Delete the old apps and libraries, and every reference to them
  - Fulfils: REQ-8.1, REQ-8.2, REQ-8.3
  - Files: `apps/**`, `shared/auth/**`, `shared/ui-components/**`, `tsconfig.base.json`, `nx.json` (Playwright plugin, generator defaults), `package.json` scripts, `.github/workflows/ci.yml` (e2e steps), `shared/stores/tsconfig.lib.json` (stray include of an auth file)
  - Verify: `nx show projects` lists only `stores`; `nx lint stores`, `nx test stores`
- [ ] **T2** — Remove unused dependencies; add Stylelint
  - Fulfils: REQ-8.8
  - Files: `package.json`, `package-lock.json`
  - Verify: search shows no import or config use of a removed package; `npm ci` succeeds; `nx test stores`
- [ ] **T3** — `ui-tokens` library scaffold, `contract.json`, compiler and contrast checker with tests
  - Fulfils: REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.7, REQ-3.1–3.4, REQ-7.3, REQ-7.4, REQ-9.1
  - Files: `shared/ui/tokens/**`, `tsconfig.base.json`
  - Verify: `compile.spec.ts`, `contrast.spec.ts`
- [ ] **T4** — `theme-olivier` library: `tokens.json`, `contrast-pairs.json`, generated CSS/TS; `compile-tokens` / `check-tokens` targets on both libraries
  - Fulfils: REQ-2.1–2.5, REQ-2.7, REQ-3.5, REQ-3.6, REQ-7.5
  - Files: `shared/themes/olivier/**`, `shared/ui/tokens/project.json`, `nx.json`
  - Verify: `nx run-many -t check-tokens -p ui-tokens theme-olivier` passes; editing a value without recompiling fails it
- [ ] **T5** — Global styles: `ui.scss`, `_bootstrap-map.scss`, ui-tokens README
  - Fulfils: REQ-1.4, REQ-1.6, REQ-4.1–4.4
  - Files: `shared/ui/tokens/src/styles/**`, `shared/ui/tokens/README.md`
  - Verify: through the T9 build (CSS output contains the layer order first and no other Bootstrap component CSS)
- [ ] **T6** — `UiThemeService` and `provideUi` with tests
  - Fulfils: REQ-1.5, REQ-5.1–5.8, REQ-4.3, REQ-9.1
  - Files: `shared/ui/tokens/src/lib/**`, `shared/ui/tokens/src/index.ts`
  - Verify: `ui-theme.service.spec.ts`, `provide-ui.spec.ts`
- [ ] **T7** — `util-format` library with tests
  - Fulfils: REQ-6.1–6.7, REQ-9.1
  - Files: `shared/util/format/**`, `tsconfig.base.json`
  - Verify: `money.spec.ts`, `dates.spec.ts`, `pipes.spec.ts`
- [ ] **T8** — Stylelint config and `stylelint` targets
  - Fulfils: REQ-7.1, REQ-7.2
  - Files: `stylelint.config.mjs`, each `project.json`, `nx.json`
  - Verify: `nx affected -t lint` runs Stylelint with 0 errors; a raw hex in a scratch file is refused
- [ ] **T9** — New `expenses-management` app
  - Fulfils: REQ-2.6, REQ-4.5, REQ-8.4, REQ-8.5, REQ-9.1
  - Files: `apps/expenses-management/**`
  - Verify: `app.spec.ts`, `home.spec.ts`; dev and production builds within the restored budgets
- [ ] **T10** — CI, scripts and docs
  - Fulfils: REQ-3.5, REQ-8.2, REQ-8.6, REQ-9.2
  - Files: `.github/workflows/ci.yml`, `package.json`, `CLAUDE.md`, `README.md`, `docs/ARCHITECTURE.md`
  - Verify: the CI command run locally (`npm run ci`) passes

## Deviations from spec
(Recorded during implementation.)

## Verification report
| REQ | Verified how | Result |
|---|---|---|
