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
libs/
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

## 4. Component conventions

- **Selectors:** prefix `ui-` in the toolbox and the app prefix in app libraries. Native elements get attribute selectors (`button[uiButton]`, `a[uiButton]`, `input[uiInput]`, `select[uiSelect]`, `input[type=checkbox][uiSwitch]`), so forms and keyboard work natively. Use ControlValueAccessor only for custom controls with no native element.
- **API:** standalone, `ChangeDetectionStrategy.OnPush`, `input()` / `model()` / `output()`, variants as string unions, no `any`.
- **Text:** no ngx-translate inside toolbox UI. Pages pass translated text in. Built-in strings (Fermer, Chargement…) come from the `UI_TEXT` token, French by default.
- **Icons:** `<ui-icon name="…">`, inline SVG from a registry (`provideIcons`). The source set is Lucide. No icon fonts.
- **Overlays:** Angular CDK (Dialog, Overlay, Menu, A11y). No ng-bootstrap.
- **Money:** `<ui-amount>` and `@shared/util-format` with `Intl.NumberFormat('fr-TN')`. Values are always integer minor units. No `moment`.
- **Accessibility, part of done:** focus ring token, 44 px touch targets, a label or `aria-label`, and a keyboard test per interactive atom.

## 5. Theming

The toolbox is brand-free. Components read only `var(--ui-*)`.

| Layer | Example | Set by |
|---|---|---|
| palette | `--ui-palette-olive-600` | the theme only; never read by components |
| semantic (the contract) | `--ui-color-bg`, `--ui-color-ink`, `--ui-color-accent`, `--ui-color-accent-soft`, `--ui-color-danger`, `--ui-font-sans`, `--ui-radius-md`, `--ui-control-height` | the theme |
| component | `--ui-button-radius`, `--ui-input-border`, `--ui-card-shadow` | defaults to semantic; a theme may override |

- A theme is a `tokens.json` (Olivier format) compiled to one CSS file. Olivier lives in `shared/themes/olivier`. A client's theme lives in the client app's folder.
- An app selects a theme with `provideUi({ theme, accent })` plus the theme CSS. Bootstrap `--bs-*` variables are mapped from the same tokens.
- Light and dark: `[data-theme]` on `<html>`.
- Cascade layers: `@layer reset, vendor, tokens, ui, app;`. Apps override in `app`, never with `!important`, and never fork a component.
- Bootstrap: only Reboot, the grid and utilities, in the `vendor` layer.
- Checks: Stylelint refuses raw colours, sizes and fonts in toolbox styles, and a CI script verifies WCAG AA contrast for every theme in light and dark.

## 6. Tests

- **Atoms and molecules:** Vitest + Angular Testing Library (variants, disabled, keyboard path, accessible name).
- **Organisms and templates:** add two viewport widths.
- **Catalog:** Playwright screenshots, light and dark, on `main`.
- **Logic libraries:** the existing CLAUDE.md rules (store error paths, `HttpTestingController`).

## 7. Migration of existing code

| Today | Becomes |
|---|---|
| `TextInput`, `SelectComponent` | `uiInput` / `uiSelect` atoms + `ui-form-field` molecule |
| `SwitchButtons` | `ui-segmented-control` molecule |
| `DateInput`, `FilesInput`, `ErrorAlert`, `ContextMenu` | `ui-date-field`, `ui-file-picker`, `ui-alert`, `ui-menu` (CDK) molecules |
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
4. **Molecules, organisms and templates:** CDK overlays, app shell; remove ng-bootstrap, `moment` and bootstrap-icons.
5. **Shared logic:** `http/*` and `identity/*`, with the auth pages rebuilt on the auth layout (Sanctum cookie strategy).

App architecture (expenses) comes after this, in `libs/expenses/`.
