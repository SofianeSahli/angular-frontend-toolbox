# Toolbox architecture

Status: **approved 2026-11-21**. Binding for every app and library in this monorepo. Rationale and diagrams: [architecture doc](https://claude.ai/artifact/D6EsE3LjZTyZvzfH6AaM6U). Visual reference: [Olivier design system](https://claude.ai/artifact/5zWMu9cFRGm9LBrTjZFkoQ).

This monorepo is a **toolbox** (`shared/`) that every app reuses, plus the apps themselves. The toolbox carries no brand, and it holds both UI and logic that every app needs: session, sign-in screens, HTTP errors and stores. Each app writes only its own pages and domain code.

## 1. Layers

UI is organised with atomic design. Everything else uses Nx library types.

| Level | Rule that decides | May import |
|---|---|---|
| tokens | a value, not a component | util |
| atom | one element or visual primitive; holds no other component except an icon | tokens, util |
| molecule | two or more atoms doing one small job | atoms, tokens, util |
| organism | a distinct section of a screen with its own layout | molecules, atoms, tokens, util, domain |
| template | a page layout with named slots and no content | organisms and below |
| page | a routed screen in a `feature` library; the only UI that injects stores | everything except other pages |

Toolbox UI (tokens → templates) is **presentational**: signal inputs and outputs only. No store, no HTTP, no router and no translation keys.

Non-UI library types: `feature` (pages, wiring) · `data-access` (API clients, signal stores, interceptors) · `domain` (models, pure rules, no Angular) · `util` (pure helpers).

## 2. Library map

```
apps/
  expenses-management/            scope:expenses  type:app
  ui-catalog/                     scope:shared    type:app     every component, every state, theme switcher
shared/                           THE TOOLBOX     scope:shared
  ui/tokens/        @shared/ui-tokens         type:ui layer:tokens     semantic CSS variables, theme + accent service, cascade layers
  ui/atoms/         @shared/ui-atoms          type:ui layer:atom
  ui/molecules/     @shared/ui-molecules      type:ui layer:molecule
  ui/organisms/     @shared/ui-organisms      type:ui layer:organism
  ui/templates/     @shared/ui-templates      type:ui layer:template
  themes/olivier/   @shared/theme-olivier     type:ui layer:tokens     default theme (tokens.json -> CSS)
  identity/data-access/   @shared/identity-data-access   type:data-access   SessionStore, AuthStrategy (cookie | token), guards
  identity/feature-auth/  @shared/identity-feature-auth  type:feature       sign-in, register, email code, reset pages
  http/data-access/       @shared/http-data-access       type:data-access   interceptors, ApiError mapping, ErrorBus
  http/feature-errors/    @shared/http-feature-errors    type:feature       ErrorBus -> dialog / toast / redirect
  stores/                 @shared/stores                 type:data-access   withCrudOperations, withLoader, withQuery (existing)
  util/format/            @shared/util-format            type:util          money (fr-TN, millimes), dates (local YYYY-MM-DD)
  util/forms/             @shared/util-forms             type:util          validators, error keys
libs/                             app libraries, imported through @expenses/* (one prefix per app)
  expenses/shell/         @expenses/shell                type:feature       signed-in frame of the expenses app
  expenses/<domain>/      scope:expenses
    feature-<screen>/     type:feature
    data-access/          type:data-access
    domain/               type:domain
    ui/                   type:ui layer:organism   app-specific pieces built from toolbox atoms
```

Rule of placement: if every app does it the same way, it goes in `shared/` and is configured with `provideX({...})` and injection tokens. If only one app does it, it goes in that app's `libs/<app>/`. App code moves to the toolbox only when a second app needs it.

## 3. Boundaries (eslint.config.mjs)

Every project has a `scope` tag and a `type` tag. UI libraries also have a `layer` tag. `@nx/enforce-module-boundaries`:

```js
depConstraints: [
  { sourceTag: 'scope:shared',   onlyDependOnLibsWithTags: ['scope:shared'] },
  { sourceTag: 'scope:expenses', onlyDependOnLibsWithTags: ['scope:expenses', 'scope:shared'] },

  { sourceTag: 'type:app',         onlyDependOnLibsWithTags: ['type:feature', 'type:data-access', 'type:ui', 'type:domain', 'type:util'] },
  { sourceTag: 'type:feature',     onlyDependOnLibsWithTags: ['type:data-access', 'type:ui', 'type:domain', 'type:util'] },
  { sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:data-access', 'type:domain', 'type:util'] },
  { sourceTag: 'type:domain',      onlyDependOnLibsWithTags: ['type:domain', 'type:util'] },
  { sourceTag: 'type:util',        onlyDependOnLibsWithTags: ['type:util'] },
  { sourceTag: 'type:ui',          onlyDependOnLibsWithTags: ['type:ui', 'type:domain', 'type:util'] },

  { sourceTag: 'layer:tokens',   onlyDependOnLibsWithTags: ['type:util'] },
  { sourceTag: 'layer:atom',     onlyDependOnLibsWithTags: ['layer:tokens', 'type:util'] },
  { sourceTag: 'layer:molecule', onlyDependOnLibsWithTags: ['layer:atom', 'layer:tokens', 'type:util'] },
  { sourceTag: 'layer:organism', onlyDependOnLibsWithTags: ['layer:molecule', 'layer:atom', 'layer:tokens', 'type:domain', 'type:util'] },
  { sourceTag: 'layer:template', onlyDependOnLibsWithTags: ['layer:organism', 'layer:molecule', 'layer:atom', 'layer:tokens', 'type:util'] },
]
```

Data-access never imports UI. Where logic must reach the screen (HTTP errors), it publishes on a signal bus, and a `feature` library presents it.

E2E projects are tagged `type:e2e`; they import no library, so no constraint row applies. (Added by spec 001, approved 2026-11-21.)

## 4. Component conventions

- **Selectors:** prefix `ui-` in the toolbox and the app prefix in app libraries. Native elements get attribute selectors (`button[uiButton]`, `a[uiButton]`, `input[uiInput]`, `select[uiSelect]`, `input[type=checkbox][uiSwitch]`), so forms and keyboard work natively. Use ControlValueAccessor only for custom controls with no native element.
- **API:** standalone, `ChangeDetectionStrategy.OnPush`, `input()` / `model()` / `output()`, variants as string unions, no `any`.
- **Text:** no ngx-translate inside toolbox UI. Pages pass translated text in. Built-in strings (Fermer, Chargement…) come from the `UI_TEXT` token, French by default.
- **Icons:** `<ui-icon name="…">`, inline SVG from a registry (`provideIcons`). The source set is Lucide. No icon fonts.
- **Overlays:** Angular CDK (Dialog, Overlay, Menu, A11y). No ng-bootstrap.
- **Money:** `<ui-amount>` and `@shared/util-format` with `Intl.NumberFormat('fr-TN')`. Values are always integer minor units. No `moment`.
- **Accessibility, part of done:** focus ring token, 44 px touch targets, a label or `aria-label`, and a keyboard test per interactive atom.

## 5. Theming

The toolbox is brand-free. Components read only `var(--ui-*)`: semantic and component tokens, never palette tokens and never raw values.

| Layer | Example | Set by |
|---|---|---|
| palette (**optional**) | `--ui-palette-olive-600` | the theme only; never read by components |
| semantic (the contract) | `--ui-color-bg`, `--ui-color-ink`, `--ui-color-accent`, `--ui-font-sans`, `--ui-radius-md`, `--ui-control-height-md` | the theme (must provide) or `@shared/ui-tokens` defaults (may override), see below |
| component | `--ui-button-radius`, `--ui-input-border`, `--ui-card-shadow` | the component's own styles, defaulting to a semantic token; a theme may override |

**Palette.** A semantic token holds either a raw value or an alias of a palette token (`{olive-600}`). The palette is optional: Olivier has none (each semantic token holds its own value). A theme that arrives with a brand colour scale should declare it as a palette and alias it.

**The semantic contract** has two parts:

- **Theme must provide** (the build fails if one is missing): every colour token (surfaces, ink, lines, brand, accent and its tints, `on-*` colours, success/warning/danger and their tints, focus-ring colour), the data colours `data-1` … `data-10`, and the font families.
- **Theme may override** (brand-free defaults live in `@shared/ui-tokens`): sizes, spacing, radius, focus and motion. Defaults:
  - `--ui-control-height-sm/md/lg`: 36 / 44 / 52px
  - `--ui-focus-ring-width`: 2px; `--ui-focus-ring-offset`: 2px (`--ui-focus-ring-color` is a theme colour; Olivier aliases it to `brand`)
  - `--ui-duration-fast/base/slow`: 120 / 200 / 320ms; `--ui-easing-standard`: `cubic-bezier(0.2, 0, 0, 1)`
  - every duration becomes `0ms` under `prefers-reduced-motion: reduce`, in the token CSS.

**Component tokens** follow `--ui-<component>-<property>` and are declared, with a default, in the component's own style file (`switch.scss` declares `--ui-switch-*`). A default is a scale token when one matches the value, otherwise a raw value. A theme may override them. They are the **only** place a raw length may appear outside generated CSS; motion always comes from the `--ui-duration-*` tokens.

- A theme is a `tokens.json` (Olivier format) compiled to one CSS file. The repo copy is the source of truth and changes by pull request (a new export from the design system replaces the file); the build validates its format, the required tokens and WCAG AA contrast. Olivier lives in `shared/themes/olivier`. A client's theme lives in the client app's folder.
- An app selects a theme with `provideUi({ theme, accent })` plus the theme CSS. Bootstrap `--bs-*` variables are mapped from the same tokens. The compiler also emits `--ui-color-<name>-rgb` (`r, g, b`) for Bootstrap's `rgba()`; components never read it.
- Fonts load from Google Fonts through a `<link>` in the app's `index.html` with `display=swap`: Inter, and IBM Plex Sans Arabic for right-to-left text.
- Light and dark: `[data-theme]` on `<html>`. The user's choice is `light | dark | system` (default `system`, which follows `prefers-color-scheme`), saved per device.
- Cascade layers: `@layer reset, vendor, tokens, ui, app;`. Apps override in `app`, never with `!important`, and never fork a component.
- Bootstrap: only Reboot, the grid and utilities, in the `vendor` layer.
- Breakpoints: `medium` 820px (rail vs top bar and bottom tabs, dialog vs sheet, auth brand panel) and `wide` 1100px (page aside column). They are SCSS constants in `ui-tokens` (`_breakpoints.scss`, `@include bp.down(medium)`) and a TS constant (`BREAKPOINTS`, `mediaQueryDown()`); a test keeps the two equal. Component styles reach the shared SCSS through a Sass load path (`@use 'breakpoints' as bp;`, `@use 'focus-ring';`).
- Overlays: `@shared/ui-organisms` ships `styles/overlays.scss` (CDK overlay CSS in `vendor`, backdrop and dialog panes in `ui`). An app that opens dialogs or menus adds it to `styles` after the theme.
- Projected content: a component styles atoms that a page projects into it only with `.own-element ::ng-deep > [atom]` (direct children), or `:host ::ng-deep` for native content inside its own host (table cells). Nothing else uses `::ng-deep`.
- Right-to-left: styles use logical properties and values only (`padding-inline`, `inset-inline-start`, `margin-inline-start`, `text-align: start`), never physical `left`/`right`. Horizontal movement mirrors (logical insets, or `:dir(rtl)`), and directional icons (chevrons, arrows, back, list) are flagged `directional` and mirror in RTL.
- Checks: Stylelint refuses raw colours, sizes and fonts in **every** style file in the repo (no ignore list, no legacy exceptions). Raw lengths are allowed only in a component's own `--ui-<component>-*` tokens and in the compiler output `*.generated.css`. `color-mix()` takes only `var(--ui-*)` tokens, `currentColor` and `transparent`. A CI script verifies WCAG AA contrast for every theme in light and dark.

## 6. Tests

- **Atoms, molecules and organisms:** Vitest + Angular Testing Library (variants, disabled state, keyboard path, accessible name), in jsdom.
- **Logic libraries:** Vitest unit tests (store error paths, `HttpTestingController` for HTTP).
- **No visual or screenshot tests**, and no tests that need a real browser.
- **End-to-end:** a manual check by the owner when needed, plus the Playwright smoke test in CI on `main`.

## 7. Migration of existing code

Spec 002 deleted the old code outright (the old app, its e2e project, `shared/auth` and `shared/ui-components`) instead of migrating it. The right column remains the list of what each old piece is rebuilt as.

| Today | Becomes |
|---|---|
| `TextInput`, `SelectComponent` | `uiInput` / `uiSelect` atoms + `ui-form-field` molecule |
| `SwitchButtons` | `ui-segmented-control` molecule |
| `DateInput`, `FilesInput`, `ErrorAlert`, `ContextMenu` | `ui-alert` and `ui-menu` (CDK) molecules (spec 004); date field and file picker deferred until an app needs them (a native `input[type=date]` in `ui-form-field` covers dates for now) |
| `Loader` | `ui-spinner` atom |
| `ModalWrapper`, `Confirmations`, `Toast` | `ui-dialog`, `ui-confirm-dialog` (CDK), `ui-toast-region` organisms |
| `NavBar`, `AppNavbar`, `DrawerHeader` | `ui-top-bar`, `ui-side-rail`, `ui-bottom-tabs` organisms + `ui-app-shell` template |
| `ImageCropper` (fabric) | its own lazily loaded library |
| `validators`, `validators-messages` | `@shared/util-forms` |
| `TimesAgoPipe`, display-mode service | `@shared/util-format`, `@shared/ui-tokens` |
| `ripple.directive` | removed |
| `shared/auth` | `identity/data-access` + `identity/feature-auth` |
| `errors-displayer.service`, `http-errors-interceptor` | `http/data-access` + `http/feature-errors` |
| `shared/profile-section` | removed (empty) |

## 8. Order of work (one spec each, approved before code)

1. **Foundations:** merge the Angular 22 upgrade, add Vitest and Playwright, tag every project, write the depConstraints above, fix the known build issues.
2. **Tokens and themes:** `ui-tokens`, `theme-olivier`, the theme compiler, cascade layers, Bootstrap trim, `util-format`, the Stylelint and contrast checks.
3. **Atoms and catalog:** the 16 atoms in the Olivier design system, plus `apps/ui-catalog`.
4. **Molecules, organisms and templates:** the 27 components drawn by the design session (spec 004 `design-reference/`), CDK menu and dialog, app shell. (ng-bootstrap, `moment` and bootstrap-icons were already removed in spec 002.)
5. **Identity:** HTTP layer, session, sign-in screens and the signed-in app shell (`http/*`, `identity/*`, `libs/expenses/shell`).
6. **Households and books:** first-run choice, create household, create book, invitations, members, book switcher (backend specs 003–004).
7. **Categories and operations:** category picker, quick add, operations list (backend specs 005–006).
8. **Dashboard and budget:** month summary, plan vs actual (backend spec 007).

From spec 005 on, every spec delivers **both** the shared toolbox part **and** the expenses app part that uses it. A spec is done only when a real screen of `expenses-management` works against the real backend (`personal-accountings-backend`, API at `environment.apiBaseUrl`).
