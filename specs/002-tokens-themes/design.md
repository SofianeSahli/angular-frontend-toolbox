# 002 — Tokens and themes: Design

> Status: Approved with the requirements (2026-11-22; the owner asked to implement directly)
> Requirements: [requirements.md](./requirements.md) (revision 4)

## Overview

Three new libraries, one compiler, one guard rail, one new app:

```
shared/ui/tokens/      @shared/ui-tokens      scope:shared type:ui layer:tokens
  contract.json                      the semantic contract: required tokens + brand-free defaults
  compiler/                          theme compiler + contrast checker (Node 24, TypeScript run directly)
  src/styles/ui.scss                 layer order, trimmed Bootstrap (vendor), defaults, --bs-* mapping
  src/styles/defaults.generated.css  compiled from contract.json
  src/styles/_bootstrap-map.scss     --bs-* ← --ui-* (tokens layer)
  src/lib/                           UiThemeService (signals), provideUi, types
shared/themes/olivier/ @shared/theme-olivier  scope:shared type:ui layer:tokens
  tokens.json                        repo copy of the Olivier export (source of truth)
  contrast-pairs.json                declared contrast pairs
  src/olivier.generated.css          compiled theme CSS
  src/olivier.generated.ts           theme descriptor (name, accents, default accent)
shared/util/format/    @shared/util-format    scope:shared type:util
  src/lib/money.ts, dates.ts         pure functions, no Angular
  src/lib/pipes.ts                   one pure pipe per formatter
apps/expenses-management/            scope:expenses type:app   (new, from scratch)
stylelint.config.mjs                 one config for every style file
```

Deleted: `apps/expenses-management` (old), `apps/expenses-management-e2e`, `shared/auth`, `shared/ui-components`.

## Placement

- The compiler lives **inside `ui-tokens`** (`shared/ui/tokens/compiler/`), not in a new project: the contract and the code that enforces it change together, and the library map (ARCHITECTURE §2) needs no new entry. It is excluded from the Angular library build and tested by the library's Vitest run.
- `theme-olivier` holds data and generated files only. Its TypeScript descriptor is structurally typed (`as const`) so that it does not import `ui-tokens` (both are `layer:tokens`, which may depend only on `type:util`).
- The app lists the style entries in `project.json` (`styles`), so no style file reaches into another project by a relative path.

## Token naming (REQ-1.1, REQ-1.6, REQ-2.2)

| Source in `tokens.json` | CSS variable |
|---|---|
| colour `bg` | `--ui-color-bg` (+ derived `--ui-color-bg-rgb: 251, 248, 243` for Bootstrap's `rgba()`; not for components) |
| family `sans` | `--ui-font-sans` |
| family `arabic` (optional) | `--ui-font-arabic`, plus `:lang(ar) { font-family: var(--ui-font-arabic) }` |
| type style `body` | `--ui-text-body-size`, `-line-height`, `-weight`, `-tracking` (when set) |
| `space-4`, `radius-md`, `shadow-sheet` | `--ui-space-4`, `--ui-radius-md`, `--ui-shadow-sheet` |
| default `control-height-md` | `--ui-control-height-md` |

**Contract** (`contract.json`):
- *must provide*: colours `bg, surface, surface-sunken, surface-raised, line, line-strong, ink, ink-muted, brand, on-brand, brand-soft, accent, on-accent, accent-soft, success, success-soft, warning, warning-soft, danger, danger-soft, focus-ring, data-1 … data-10`, font `sans`.
- *may override* (defaults): `control-height-sm/md/lg` 36/44/52px, `focus-ring-width` 2px, `focus-ring-offset` 2px, `duration-fast/base/slow` 120/200/320ms, `easing-standard` `cubic-bezier(0.2, 0, 0, 1)`. A theme overrides one through an optional `overrides` section (`[{ name, value }]`); an unknown name is an error.
- Anything else a theme defines (spacing, radius, type scale, shadow, extra accents) is emitted but not required.

**Accents** (REQ-2.3, REQ-5.7): every colour named `accent-<id>` (not ending in `-soft`) is an accent. For each one the compiler emits `[data-accent='<id>'] { --ui-color-accent: var(--ui-color-accent-<id>); --ui-color-accent-soft: var(--ui-color-accent-<id>-soft) }` (and the `-rgb` twins). `on-accent` stays the theme's single value. The theme's own `accent` alias is the default, so the page is correct before Angular starts.

## Theme compiler (US-3)

`compiler/compile.ts` (pure): `compileTheme(tokensJson, contract) → { css, ts, theme }` and `compileDefaults(contract) → css`. Throws `TokenError` (message names the token) and returns nothing on any error (REQ-3.3):
- unknown alias, alias cycle; name used twice (across all sections);
- value not allowed: colours `#rgb`, `#rrggbb`, `#rrggbbaa` or `{alias}`; lengths `0` or number + `px|rem|em|%`; weights 100–900; any string containing `;`, `{`, `}` or `<` is refused;
- a colour missing a value for `light` or `dark` (themes must be exactly `light` and `dark`);
- a "must provide" token missing (REQ-1.1).

Output (REQ-3.1, REQ-3.2), LF line endings, source order, no timestamp (REQ-3.4):
```css
/* Generated from tokens.json by the theme compiler. Do not edit. */
@layer tokens {
  :root, [data-theme='light'] { --ui-color-*: light values; aliases as var(); non-colour tokens }
  [data-theme='dark'] { --ui-color-*: dark values }
  [data-accent='olive'] { … } …
  :lang(ar) { font-family: var(--ui-font-arabic); }
}
```

`compiler/contrast.ts`: WCAG 2.1 relative luminance; `checkContrast(theme, pairs)` resolves aliases per theme and returns failures `{ fg, bg, theme, ratio, required }`. Thresholds: `text` 4.5, `large` 3, `ui` 3 (REQ-7.3). Colours with alpha are refused in a pair.

`compiler/cli.ts` (Node 24 runs `.ts` directly; erasable syntax only):
- `node shared/ui/tokens/compiler/cli.ts theme <dir> [--check]` — reads `<dir>/tokens.json` and `<dir>/contrast-pairs.json`, writes `<dir>/src/<name>.generated.css|ts`.
- `node shared/ui/tokens/compiler/cli.ts defaults [--check]` — writes `src/styles/defaults.generated.css`.
- `--check` writes nothing; it fails if validation or contrast fails (naming pair, theme and ratio, REQ-7.4) or if a committed file differs from fresh output, ignoring CR (REQ-3.5).

Nx targets (REQ-3.6), cached, inputs = the JSON files, the compiler and the outputs: `compile-tokens` (writes) and `check-tokens` (fails) on `ui-tokens` and `theme-olivier`. CI runs `nx affected -t lint test build check-tokens`.

## Styles and Bootstrap (US-1, US-4)

`ui.scss` (first `styles` entry, so its first rule is the first CSS in the bundle, REQ-1.4):
```scss
@use 'sass:meta';
@layer reset, vendor, tokens, ui, app;
@layer vendor {
  @include meta.load-css('bootstrap/dist/css/bootstrap-reboot');
  @include meta.load-css('bootstrap/dist/css/bootstrap-grid');
  @include meta.load-css('bootstrap/dist/css/bootstrap-utilities');
}
@include meta.load-css('defaults.generated');            // @layer tokens, reduced motion (REQ-1.2, REQ-1.3)
@layer tokens { @include meta.load-css('bootstrap-map'); } // REQ-4.2
```
Bootstrap's own `:root` and `[data-bs-theme=dark]` variables sit in `vendor`; the mapping in `tokens` wins by layer order, whatever the selector specificity. Mapped: body bg/colour (+`-rgb`), secondary colour/bg, tertiary bg, emphasis colour, border colour, primary (→ accent), success, warning, danger (+`-rgb`), link colour (→ brand, +`-rgb`) and hover, border radius (sm/md/lg/pill), `--bs-font-sans-serif` and body font size/line height/weight from the `body` text style. The app's styles: `ui.scss`, then `olivier.generated.css`. Nothing unlayered except component styles (REQ-4.4).

Production budgets back to 500 kB / 1 MB and 4 kB / 8 kB (REQ-4.5).

## Light, dark and accent (US-5)

`@shared/ui-tokens` exports:
```ts
type ThemeChoice = 'light' | 'dark' | 'system';
type ActiveTheme = 'light' | 'dark';
interface UiTheme { readonly name: string; readonly accents: readonly string[]; readonly defaultAccent: string }
interface UiConfig<T extends UiTheme = UiTheme> { theme: T; accent?: T['accents'][number] }
const UI_THEME_STORAGE_KEY = 'ui.theme';
function provideUi<T extends UiTheme>(config: UiConfig<T>): EnvironmentProviders;
@Injectable({ providedIn: 'root' }) class UiThemeService {
  readonly choice: Signal<ThemeChoice>;   // storage value if valid, else 'system' (REQ-5.2, REQ-5.5)
  readonly active: Signal<ActiveTheme>;   // computed from choice + device (REQ-5.3)
  setChoice(choice: ThemeChoice): void;   // applies now, persists (REQ-5.4)
}
```
- `provideUi` provides `UI_CONFIG` and an app initializer that creates the service. An accent not in `theme.accents` throws at startup with a message naming it.
- The service reads `matchMedia('(prefers-color-scheme: dark)')` into a signal and listens for `change` (removed on `DestroyRef`); no `matchMedia` → light.
- It applies synchronously (no `effect`) on start, on `setChoice` and on device change: `data-theme` and `data-bs-theme` (REQ-4.3, REQ-5.1) and `data-accent` on `<html>`.
- Every storage read and write is in `try/catch` (REQ-5.6). Only `ui.theme` is read (REQ-5.5).
- `index.html` has a five-line inline script that sets `data-theme` / `data-bs-theme` from `ui.theme` and the device before the CSS paints, so there is no flash; the service then takes over.

## Money and dates (US-6) — `@shared/util-format`

| Function | Behaviour |
|---|---|
| `formatMillimes(m)` | `Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', 3 decimals })` of `m / 1000` → `1 234,500 DT` (U+202F group separator, U+00A0 before `DT`) (REQ-6.2) |
| `formatMillimesHeadline(m)` | same, 0 decimals, half away from zero → `1 235 DT` (REQ-6.3) |
| `formatSignedMillimes(m)` | `signDisplay: 'exceptZero'` → `+1 234,500 DT`, `-2,000 DT` (REQ-6.4) |
| `toLocalIsoDate(d)` / `fromLocalIsoDate(s)` | local `getFullYear/Month/Date`; parse `YYYY-MM-DD` to local midnight; refuse impossible dates (REQ-6.6) |

Every money function throws `RangeError` unless `Number.isSafeInteger(m)` (REQ-6.5). Pipes (REQ-6.7): `uiMillimes`, `uiMillimesHeadline`, `uiSignedMillimes`, `uiLocalIsoDate`, standalone and pure, in `pipes.ts`; the functions import nothing from Angular (REQ-6.1).

## Stylelint (US-7)

Root `stylelint.config.mjs`, `postcss-scss` for `.scss`. Rules (REQ-7.1):
- `color-no-hex`, `color-named: never`, `function-disallowed-list` (`rgb`, `rgba`, `hsl`, `hsla`, `hwb`, `lab`, `lch`, `oklab`, `oklch`, `color`);
- `font-family` and `font` must be `var(--ui-…)` or `inherit`;
- `declaration-property-unit-allowed-list`: spacing, inset, gap, size, radius, font-size, line-height and letter-spacing properties allow only `%` (and unitless `0`);
- border and outline widths allow only the hairline `1px`;
- custom properties (`--*`) may not hold raw colours or lengths.

The only ignored files are `**/*.generated.css` (compiler output, REQ-7.1) and `node_modules`/`dist`. Each project has a `stylelint` target (`stylelint "<root>/**/*.{css,scss}" --allow-empty-input`), and its `lint` target depends on it, so `nx affected -t lint` runs both (REQ-7.2).

## The new app (REQ-8.4)

- `project.json`: build (application builder, `zone.js` polyfill, styles = `ui.scss` + `olivier.generated.css`, restored budgets), serve, test (`@angular/build:unit-test`, Vitest). No `extract-i18n`, no `serve-static`.
- `index.html`: `lang="fr"`, Google Fonts preconnect + `<link>` for Inter (400/500/600) and IBM Plex Sans Arabic (400/500/600) with `display=swap` (REQ-2.6), the theme script.
- `app.config.ts`: global error listeners, zone change detection, router, `provideHttpClient(withFetch())`, ngx-translate (HTTP loader `/i18n/*.json`, `fr`), `provideUi({ theme: olivierTheme, accent: 'olive' })`.
- Routes: `''` → lazy `Home`; `'**'` → `''`.
- `App`: `<router-outlet />` only. `Home`: app name and one line from `fr.json`, Bootstrap utilities for layout, `var(--ui-*)` for type and colour.
- `environments.ts` / `.prod.ts`: `apiBaseUrl` only (`http://localhost:8001/api/v1` / placeholder).

**Arabic font (REQ-2.7):** Olivier's export has no Arabic family. The repo `tokens.json` gains `type.families.arabic = "\"IBM Plex Sans Arabic\", \"Inter\", \"Segoe UI\", system-ui, sans-serif"` (recorded as a deviation from the export, to be added to the design system).

## i18n keys
`app.name`, `home.title`, `home.text` in `apps/expenses-management/public/i18n/fr.json`.

## Requirement coverage
| REQ | Where |
|---|---|
| 1.1, 1.2, 1.6, 1.7 | `contract.json`, `defaults.generated.css`, ui-tokens README |
| 1.3 | defaults CSS reduced-motion block; compiler test |
| 1.4, 4.1, 4.2, 4.3, 4.4 | `ui.scss`, `_bootstrap-map.scss`, service attributes |
| 1.5, 5.1–5.8 | `provideUi`, `UiThemeService`, `index.html` script; service tests |
| 2.1–2.5, 2.7 | `theme-olivier` (`tokens.json`, generated CSS/TS), accents, `arabic` family |
| 2.6 | new app `index.html` |
| 3.1–3.6 | compiler, CLI, Nx targets, CI step; compiler tests |
| 4.5 | app production build with restored budgets |
| 6.1–6.7 | `util-format`; tests |
| 7.1, 7.2 | `stylelint.config.mjs`, `stylelint` targets |
| 7.3–7.5 | `contrast.ts`, `contrast-pairs.json`, `check-tokens` |
| 8.1–8.3, 8.6–8.8 | T1, T2, T10 |
| 8.4, 8.5 | new app; build, lint, test |
| 9.1, 9.2 | specs listed in tasks; no e2e |

## Risks / alternatives considered
- **Bootstrap from SCSS sources** would allow a finer trim, but Bootstrap 5.3's SCSS uses `@import` and floods modern Sass with deprecation warnings. The three dist CSS files (Reboot, grid, utilities) are loaded into the `vendor` layer instead.
- **A separate compiler project in `tools/`** was rejected to keep the library map unchanged.
- **`effect()` to apply the theme** was rejected: synchronous application is simpler and testable without flushing effects.
- **Raw values in `ui-tokens` defaults** would break "no raw values outside generated CSS", so the defaults are data in `contract.json` and compiled too.
