# 002 — Tokens and themes: Requirements

> Status: Draft, revision 3 (2026-11-22): the owner decided to delete both existing apps and the `auth` and `ui-components` libraries, keep `shared/stores`, and create a new `expenses-management` app from scratch as a minimal shell (US-8). Revision 4: all open questions resolved (unused dependencies removed; no theme control on the placeholder page).
> Scope: new libraries `shared/ui/tokens` (`@shared/ui-tokens`), `shared/themes/olivier` (`@shared/theme-olivier`), `shared/util/format` (`@shared/util-format`); a theme compiler; Stylelint and contrast checks; Bootstrap trimmed; the old apps and libraries deleted and a new minimal `apps/expenses-management` created on the tokens (US-8).
> Architecture: [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) §2, §4 (money), §5 (theming, updated with these answers), §6 (tests), §8 step 2.
> Source of the Olivier values: the Olivier design system's `tokens.json` and README (read 2026-11-22). From now on the repo copy is the source of truth (REQ-2.5).

## Context

The toolbox must be brand-free: components read only semantic CSS variables (`var(--ui-*)`), and a theme supplies the values. Nothing like that exists yet. Today the app is styled by full Bootstrap 5 plus custom SCSS that reads `--bs-*` variables and raw colours. Light/dark is a `ThemeService` in `shared/ui-components` that sets `data-bs-theme` on `<body>`. Money is shown with Angular's `CurrencyPipe` from decimal strings.

The Olivier design system defines the values:
- 38 colour tokens with light and dark values: surfaces, ink, lines, brand, one aliased `accent` plus 5 app accents, success/warning/danger with tints, focus ring and 10 data colours;
- the Inter type scale, 7 spacing steps, 4 radii and 1 shadow, with contrast notes.

This spec delivers the token contract, the Olivier theme, the tooling that keeps themes correct, the money/date formatting the atoms will rely on, and a repo where **every** style file obeys the contract. Every existing screen calls the old API and every existing widget is replaced by specs 003–005, so the owner decided to **delete the existing apps and the `auth` and `ui-components` libraries outright** and start a new app from scratch. The new app is a minimal shell on the tokens; real screens come back in later specs.

## User stories

- **US-1 — Token contract.** As a toolbox developer, I want one library that defines the semantic `--ui-*` variables, the brand-free defaults, the cascade layers and the theme/accent switching, so that every component reads the same contract and never a raw value.
- **US-2 — Olivier theme.** As an app developer, I want the Olivier design system available as a theme library, so that an app gets the approved look by selecting it.
- **US-3 — Theme compiler.** As a theme author, I want a `tokens.json` compiled into one CSS file and validated, so that themes are data and a broken theme can't be merged.
- **US-4 — Bootstrap under the tokens.** As an app developer, I want only Bootstrap's Reboot, grid and utilities, inside a known cascade layer and fed by the same tokens, so that layout comes from Bootstrap and looks from the toolbox, and app overrides never need `!important`.
- **US-5 — Light, dark and accent.** As a user of the app, I want the theme to follow my device unless I choose light or dark, and my choice remembered, and as an app developer I want to choose my app's accent once.
- **US-6 — Money and dates.** As an app developer, I want shared helpers that format integer millimes as Tunisian dinars and handle local calendar dates, so that every app shows amounts and dates the same way and never shifts a day.
- **US-7 — Guard rails.** As a maintainer, I want Stylelint to refuse raw colours, sizes and fonts in every style file, and CI to verify contrast for every theme, so that the contract and accessibility can't erode.
- **US-8 — Start clean.** As the owner, I want the existing apps and the `auth` and `ui-components` libraries deleted, and a new `expenses-management` app created from scratch on the tokens, so that the repo holds only code that follows the architecture, with no ignore list and no "legacy" exception.

## Acceptance criteria (EARS)

### US-1 — Token contract (`@shared/ui-tokens`)
- **REQ-1.1** THE SYSTEM SHALL provide a library `shared/ui/tokens` (`@shared/ui-tokens`), tagged `scope:shared type:ui layer:tokens`, that declares the semantic CSS variable contract `--ui-*` in two documented lists (ARCHITECTURE §5):
  - **theme must provide:** every colour token, including the `on-*` colours, the tints, the focus-ring colour and the data colours `data-1` … `data-10`, plus the font families;
  - **theme may override:** sizes, spacing, radius, focus ring width and offset, and motion.
- **REQ-1.2** THE SYSTEM SHALL define these brand-free defaults in `@shared/ui-tokens`, which a theme may override:
  - `--ui-control-height-sm/md/lg` = 36 / 44 / 52px;
  - `--ui-focus-ring-width` = 2px and `--ui-focus-ring-offset` = 2px;
  - `--ui-duration-fast/base/slow` = 120 / 200 / 320ms;
  - `--ui-easing-standard` = `cubic-bezier(0.2, 0, 0, 1)`.
- **REQ-1.3** WHILE the user's device asks for reduced motion (`prefers-reduced-motion: reduce`) THE SYSTEM SHALL make every `--ui-duration-*` variable `0ms`, in the token CSS.
- **REQ-1.4** THE SYSTEM SHALL declare the cascade layer order `@layer reset, vendor, tokens, ui, app;` once, loaded before any other style in an app that uses the toolbox.
- **REQ-1.5** THE SYSTEM SHALL provide `provideUi({ theme, accent })` that an app calls once in its config to select its theme and accent.
- **REQ-1.6** THE SYSTEM SHALL document in the library's README every `--ui-*` variable: its meaning, its list (must provide / may override), its default where it has one, and the component-token convention `--ui-<component>-<property>` (declared in the component's own styles, defaulting to a semantic token). No component token is created in this spec.
- **REQ-1.7** THE SYSTEM SHALL not contain any brand value in `@shared/ui-tokens`: no colour, and no font name specific to a brand.

### US-2 — Olivier theme (`@shared/theme-olivier`)
- **REQ-2.1** THE SYSTEM SHALL provide a library `shared/themes/olivier` (`@shared/theme-olivier`), tagged `scope:shared type:ui layer:tokens`, holding the Olivier `tokens.json` and the CSS compiled from it (US-3).
- **REQ-2.2** THE SYSTEM SHALL reproduce every Olivier token value exactly (hex, sizes, weights, line heights, letter spacing) in both light and dark themes. Olivier keeps all its own values, and has no palette layer.
- **REQ-2.3** THE SYSTEM SHALL expose all 5 Olivier accents (`olive`, `terracotta`, `safran`, `lagune`, `figue`), each with its `-soft` tint where the source defines one, so that an app can select any of them.
- **REQ-2.4** THE SYSTEM SHALL map Olivier's focus-ring colour to its `brand` token, as the source does.
- **REQ-2.5** THE SYSTEM SHALL treat the repo copy of `tokens.json` as the source of truth. It changes only by pull request: the owner exports a new `tokens.json` from the design system and replaces the file.
- **REQ-2.6** WHEN the app loads THE SYSTEM SHALL load Inter and IBM Plex Sans Arabic from Google Fonts through a `<link>` in the app's `index.html` with `display=swap`, so that text shows immediately in the fallback font.
- **REQ-2.7** WHEN text is in Arabic script THE SYSTEM SHALL render it in IBM Plex Sans Arabic, with the theme's fallback stack after it.

### US-3 — Theme compiler
- **REQ-3.1** WHEN a theme's `tokens.json` is compiled THE SYSTEM SHALL produce one CSS file that sets every `--ui-*` variable the theme defines, in the `tokens` layer, for the light theme, the dark theme and each accent.
- **REQ-3.2** WHEN a token is an alias (`"{other-token}"`), including an alias to an optional palette token, THE SYSTEM SHALL resolve it to the referenced variable, so that a change to the referenced token flows through.
- **REQ-3.3** IF `tokens.json` is invalid THEN THE SYSTEM SHALL fail with a message naming the token, and produce no CSS. Invalid means any of:
  - an unknown alias;
  - a name used twice;
  - a value the format does not allow;
  - a token missing for a theme with no fallback;
  - **any "must provide" token missing** (REQ-1.1).
- **REQ-3.4** WHEN the compiler runs twice on the same input THE SYSTEM SHALL produce byte-identical output.
- **REQ-3.5** IF the committed compiled CSS differs from what the compiler produces from the committed `tokens.json` THEN CI SHALL fail.
- **REQ-3.6** THE SYSTEM SHALL run the compiler and the theme validation (REQ-3.3, REQ-7.3) as Nx targets, so that they are cached and run as part of the affected tasks in CI.

### US-4 — Bootstrap under the tokens
- **REQ-4.1** THE SYSTEM SHALL load only Bootstrap's Reboot, grid and utilities, inside the `vendor` cascade layer. No other Bootstrap CSS is loaded.
- **REQ-4.2** THE SYSTEM SHALL map Bootstrap's variables from the tokens, in both light and dark themes. The mapping covers at least:
  - body background and colour, and secondary text colour;
  - border colour;
  - primary (→ accent), success, warning and danger;
  - link colour (→ brand);
  - border radius;
  - the body font family.
- **REQ-4.3** WHEN the dark theme is active THE SYSTEM SHALL also set Bootstrap's own dark mode, so that the Bootstrap utilities follow the same theme.
- **REQ-4.4** THE SYSTEM SHALL let an app override any style in the `app` layer without `!important`.
- **REQ-4.5** WHEN `nx build expenses-management` runs in production THE SYSTEM SHALL pass with the original bundle budgets restored (errors at 1 MB initial and 8 kB per component style; warnings at 500 kB and 4 kB), undoing spec 001's temporary raise. IF it does not fit THEN this is reported to the owner, and the budgets are not raised without approval.

### US-5 — Light, dark and accent
- **REQ-5.1** THE SYSTEM SHALL select the active theme with `data-theme="light"` or `data-theme="dark"` on the `<html>` element.
- **REQ-5.2** THE SYSTEM SHALL offer three user choices, `light`, `dark` and `system`, saved per device under the storage key `ui.theme`. The default is `system`.
- **REQ-5.3** WHILE the choice is `system` THE SYSTEM SHALL follow the device's `prefers-color-scheme`, including when the device setting changes while the app is open.
- **REQ-5.4** WHEN the user picks a theme THE SYSTEM SHALL apply it immediately and remember it for the next visit on that device.
- **REQ-5.5** THE SYSTEM SHALL not read the old `theme` storage key; there is nothing to migrate.
- **REQ-5.6** IF browser storage is unavailable THEN THE SYSTEM SHALL still apply and switch the theme for the session, without an error.
- **REQ-5.7** WHEN an app selects an accent through `provideUi` THE SYSTEM SHALL make `--ui-color-accent`, `--ui-color-accent-soft` and their `on-` text colour resolve to that accent in both themes, with no other change.
- **REQ-5.8** THE SYSTEM SHALL expose the choice and the active theme as signals in `@shared/ui-tokens` (the old `ThemeService` goes with `shared/ui-components`, REQ-8.1).

### US-6 — Money and dates (`@shared/util-format`)
- **REQ-6.1** THE SYSTEM SHALL provide a library `shared/util/format` (`@shared/util-format`), tagged `scope:shared type:util`, whose formatting functions have no Angular dependency.
- **REQ-6.2** WHEN an amount in integer millimes is formatted THE SYSTEM SHALL produce the `fr-TN` TND format with 3 decimals, for example `1234500` → `1 234,500 DT` (exact output pinned by tests).
- **REQ-6.3** WHEN a headline amount is requested THE SYSTEM SHALL round to whole dinars.
- **REQ-6.4** WHEN a signed amount is formatted THE SYSTEM SHALL show the sign explicitly for income ("+"), and never rely on colour alone.
- **REQ-6.5** IF the value given is not an integer number of millimes THEN THE SYSTEM SHALL refuse it with an error rather than round silently.
- **REQ-6.6** WHEN a local calendar date is converted to and from `YYYY-MM-DD` THE SYSTEM SHALL use the local date parts, so that the day never shifts in UTC+1/+2.
- **REQ-6.7** THE SYSTEM SHALL provide an Angular pipe for each formatter, for use in templates.

### US-7 — Guard rails
- **REQ-7.1** THE SYSTEM SHALL run Stylelint as part of `lint` for every project. It SHALL refuse:
  - raw colours (hex, `rgb()`, `hsl()`, named colours);
  - raw font families;
  - raw lengths for colour-, spacing-, radius- and font-size properties.

  This applies to **every** style file in the repo, with no ignore list and no per-file exception. The only allowed raw values are `0`, `100%`, the documented hairline width, and the theme CSS generated from `tokens.json`.
- **REQ-7.2** WHEN spec 002 is complete THE SYSTEM SHALL report **zero Stylelint errors** and zero ESLint errors (`nx affected -t lint` on the changed projects; CI lints every affected project).
- **REQ-7.3** THE SYSTEM SHALL check, for every theme in both light and dark, the contrast of each text/background and control/background pair the theme declares, against WCAG AA:
  - 4.5:1 for text;
  - 3:1 for large text (24px+), control borders, focus rings and icons.
- **REQ-7.4** IF any declared pair is below its threshold THEN the theme validation SHALL fail and name the pair, the theme and the ratio; CI fails with it.
- **REQ-7.5** THE SYSTEM SHALL list the declared pairs in a file next to the theme, so that a new theme states its pairs explicitly.

### US-8 — Start clean: delete the old code, create a new app
- **REQ-8.1** THE SYSTEM SHALL delete the projects `apps/expenses-management`, `apps/expenses-management-e2e`, `shared/auth` and `shared/ui-components` entirely: source, styles, tests, assets, i18n files, project configuration, and their path aliases in `tsconfig.base.json`.
- **REQ-8.2** WHEN a project is deleted THE SYSTEM SHALL also remove every reference to it, so that no dead reference remains:
  - the e2e job in `.github/workflows/ci.yml`;
  - lint and `depConstraints` entries that only those projects used;
  - root scripts and configuration that name them.
- **REQ-8.3** THE SYSTEM SHALL keep `shared/stores` (`@shared/stores`) unchanged, with its tests.
- **REQ-8.4** THE SYSTEM SHALL create a new app `apps/expenses-management`, tagged `scope:expenses type:app`, built with the Angular application builder and Vitest unit tests like spec 001. It contains only:
  - the global style entry: layer order, token CSS, the Olivier theme, trimmed Bootstrap; nothing else;
  - `index.html` with the Google Fonts `<link>` (REQ-2.6) and the initial `data-theme`;
  - an app config with `provideUi({ theme: olivier, accent })`, the router and ngx-translate (default language `fr`);
  - environments with the single `apiBaseUrl` (spec 001), unused for now;
  - one placeholder home page: the app name and a short line of text, styled only with `var(--ui-*)` tokens and Bootstrap utilities, with no theme control (the theme follows the saved choice, or the device by default). Its text comes from `public/i18n/fr.json`. It exists only so that the app has something to render; the owner does no manual check of it before the spec that rebuilds the app.
- **REQ-8.5** WHEN spec 002 is complete THE SYSTEM SHALL build the new app in development and production, and lint and unit-test it with zero errors.
- **REQ-8.6** THE SYSTEM SHALL update `CLAUDE.md`, `README.md` and ARCHITECTURE §7 so that they no longer describe the deleted projects, the old smoke test or the known issues that belonged to the deleted code.
- **REQ-8.7** THE SYSTEM SHALL not delete anything before the owner has approved this spec's tasks.
- **REQ-8.8** WHEN the deletions are done THE SYSTEM SHALL remove from `package.json` every dependency that nothing in the repo imports or configures any more, and regenerate the lockfile. Expected, to be confirmed by a search in the design:
  - runtime: `@angular/animations`, `@angular/forms`, `@angular/localize`, `@ng-bootstrap/ng-bootstrap`, `@ngx-formly/core`, `@popperjs/core`, `bootstrap-icons`, `chart.js`, `fabric`, `moment`;
  - development: `@nx/playwright`, `@playwright/test`, `eslint-plugin-playwright`, and any other tool no target uses.

  A dependency is added back by the spec that first needs it (for example Playwright with the new smoke test, `@angular/forms` with the form atoms).

### Tests (applies to all stories)
- **REQ-9.1** THE SYSTEM SHALL have Vitest unit tests for:
  - the compiler: valid input, every REQ-3.3 error, aliases, determinism;
  - the theme service: the three choices, following the device setting, persistence, storage unavailable;
  - every `util-format` function: negative, zero and large amounts, non-integers, the UTC boundary for dates;
  - the contrast checker;
  - `provideUi`: accent selection;
  - the new app's placeholder page: it renders its translated text (TestBed, jsdom).
- **REQ-9.2** THE SYSTEM SHALL verify each task with lint, unit tests of the affected projects, and a development build of the app (CLAUDE.md "Testing rules"). No e2e run, no dev server and no browser are used during this spec. The old e2e project and its CI job are deleted (REQ-8.1, REQ-8.2); a new smoke test is added by the spec that brings back the first real screen.

## Existing code decisions (US-8)

Decided by the owner on 2026-11-22: delete all existing apps, keep only the shared stores, and build the app again from scratch.

| Project | Decision | What goes with it |
|---|---|---|
| `apps/expenses-management` | **delete**, then **create a new one** with the same name (REQ-8.4) | every screen (sign-in shell, transactions list and modals, summary and charts, settings and profile), its SCSS, assets, i18n file, environments and tests |
| `apps/expenses-management-e2e` | **delete** | the Playwright smoke test and the e2e job in CI; a new smoke test comes with the first real screen |
| `shared/auth` (`@shared/auth`) | **delete** | sign-in, register and reset-password pages, auth store, AuthService, ProfileService, `AUTH_CONFIG`, interceptors, auth background image; rebuilt as `identity/*` and `http/*` in spec 005 |
| `shared/ui-components` (`@shared/ui-components`) | **delete** | every widget, the legacy SCSS theme, `ThemeService`, validators, pipes and utilities; replaced by specs 003–004 (`util-forms` in 004) |
| `shared/stores` (`@shared/stores`) | **keep unchanged** | — |

**After this spec:** the repo holds `shared/stores`, the three new libraries and a new app with one placeholder page. Lint (ESLint and Stylelint), unit tests and both builds pass with zero errors.

## Unhappy paths checklist
- [x] Loading state: n/a (styles load with the app)
- [x] Empty state: no saved theme → `system` (REQ-5.2, REQ-5.3)
- [x] HTTP / network errors: Google Fonts unreachable → fallback font, text still visible (`display=swap`, REQ-2.6)
- [x] Validation errors: invalid or incomplete `tokens.json` (REQ-3.3); contrast failure (REQ-7.4); non-integer millimes (REQ-6.5)
- [x] Unauthenticated: n/a (no auth until spec 005; the placeholder page is public)
- [x] Date & timezone: REQ-6.6
- [x] i18n / RTL: Arabic font (REQ-2.7); formats are `fr-TN`
- [x] Storage unavailable: REQ-5.6
- [x] Reduced motion: REQ-1.3

## Non-goals
- No atoms, molecules or other components, no `UI_TEXT` token, and no component tokens: spec 003.
- No `apps/ui-catalog`: spec 003.
- No rebuilt screens and no auth: the deleted screens come back in specs 003–005 and the expenses work, not here.
- No new e2e smoke test: it comes with the first real screen.
- No theme control in the app: the theme API is unit-tested; a control comes with the atoms or the app shell.
- No relative-time formatting ("il y a 5 minutes"): spec 004.
- No migration of amounts to integer millimes in app code: there is no app code left to migrate (US-8). `util-format` is delivered and tested, not yet used by a screen.
- No changes to `shared/stores`.
- No logo and no rename of "Olivier"; both are still open in the design system.
- No visual, screenshot or browser tests; no e2e run.

## Decisions (open questions 1–10, resolved 2026-11-22)
1. [x] **App look:** (a) the app takes the Olivier colours and fonts now; a mixed look until spec 004 is accepted (REQ-4.2).
2. [x] **Bootstrap trim:** (a) now; only Reboot, grid and utilities, in `vendor`. Broken-looking screens until 004 are accepted; the app must build (REQ-4.1, REQ-8.4).
3. [x] **Palette layer:** optional. A semantic token holds a raw value or aliases a palette token; components read only semantic and component tokens; Olivier has no palette (ARCHITECTURE §5; REQ-2.2, REQ-3.2).
4. [x] **Missing tokens:** brand-free defaults in `ui-tokens` that themes may override (REQ-1.2, REQ-1.3). The contract is split into "must provide" and "may override" (REQ-1.1). Component tokens: convention only (REQ-1.6), created in spec 003.
5. [x] **Source of truth:** the repo copy, changed by PR; the build validates format, required tokens and contrast (REQ-2.5, REQ-3.3, REQ-7.3).
6. [x] **Fonts:** Inter and IBM Plex Sans Arabic from Google Fonts, `<link>` with `display=swap` (REQ-2.6, REQ-2.7).
7. [x] **Stylelint:** everything, existing code included; no ignore list; existing code is deleted or refactored (REQ-7.1, US-8).
8. [x] **Data colours:** in the contract now, "theme must provide" (REQ-1.1).
9. [x] **First visit:** follow the device setting (REQ-5.2, REQ-5.3).
10. [x] **Saved theme:** new key `ui.theme` with `light | dark | system`, default `system`; the old `theme` key is not read (REQ-5.2, REQ-5.5).

## Decisions (revision 3, 2026-11-22)
11. [x] **Smoke test vs. deleting the sign-in page:** superseded. Both apps are deleted, the e2e project and its CI job go with them, and a new smoke test comes with the first real screen (REQ-8.1, REQ-8.2, REQ-9.2).
13. [x] **Empty libraries:** `shared/auth` and `shared/ui-components` are deleted as projects (REQ-8.1). `shared/stores` stays (REQ-8.3).
- [x] **New app:** a minimal shell named `expenses-management`, created in this spec (REQ-8.4).
12. [x] **Unused dependencies:** remove all of them in this spec (REQ-8.8).
14. [x] **Theme control on the placeholder page:** none; no manual testing before the app is rebuilt (REQ-8.4).

## Open questions
None.
