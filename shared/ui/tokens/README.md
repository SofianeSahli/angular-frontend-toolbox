# @shared/ui-tokens

The brand-free token contract of the toolbox (spec 002; ARCHITECTURE §5). Components read only `var(--ui-*)`. A theme (for example `@shared/theme-olivier`) supplies the values.

## Using it in an app

```jsonc
// project.json, build options: the toolbox entry FIRST, then the theme CSS
"styles": [
  "shared/ui/tokens/src/styles/ui.scss",
  "shared/themes/olivier/src/olivier.generated.css"
]
```

```ts
// app.config.ts
provideUi({ theme: olivierTheme, accent: 'olive' });
```

`UiThemeService` exposes `choice()` (`light | dark | system`, saved per device under `ui.theme`, default `system`), `active()` (`light | dark`) and `setChoice()`. It sets `data-theme`, `data-bs-theme` and `data-accent` on `<html>`.

## Cascade layers

`@layer reset, vendor, tokens, ui, app;` is declared once, first, by `ui.scss`.

| Layer | Holds |
|---|---|
| `reset` | reserved |
| `vendor` | Bootstrap Reboot, grid and utilities, nothing else |
| `tokens` | the defaults, the theme CSS and the `--bs-*` mapping |
| `ui` | toolbox component styles (spec 003+) |
| `app` | app overrides; never `!important` |

## The contract

### Theme must provide
The build fails if one of these is missing (`contract.json` → `required`).

| Variable | Meaning |
|---|---|
| `--ui-color-bg` | page background |
| `--ui-color-surface` | cards and sheets, on `bg` |
| `--ui-color-surface-sunken` | inputs, table stripes, chart tracks |
| `--ui-color-surface-raised` | menus, drawers, dialogs |
| `--ui-color-line` | hairline dividers and card borders (decorative) |
| `--ui-color-line-strong` | control borders (3:1 on `surface` and `bg`) |
| `--ui-color-ink` | primary text and amounts |
| `--ui-color-ink-muted` | secondary text, labels, dates |
| `--ui-color-brand`, `--ui-color-on-brand`, `--ui-color-brand-soft` | ecosystem colour, text on it, its tint |
| `--ui-color-accent`, `--ui-color-on-accent`, `--ui-color-accent-soft` | the current app's accent, text on it, its tint |
| `--ui-color-success`, `-warning`, `-danger` and their `-soft` tints | status colours; never colour alone |
| `--ui-color-focus-ring` | keyboard focus ring colour |
| `--ui-color-data-1` … `--ui-color-data-10` | data and category colours |
| `--ui-font-sans` | the main font stack |

Every colour also has a derived `--ui-color-<name>-rgb` (`r, g, b`), used only by the Bootstrap mapping for `rgba()`. Components do not read it.

### Theme may override
Brand-free defaults (`contract.json` → `defaults`, compiled to `src/styles/defaults.generated.css`). A theme overrides one in its `overrides` section.

| Variable | Default |
|---|---|
| `--ui-control-height-sm` / `-md` / `-lg` | 36px / 44px / 52px |
| `--ui-focus-ring-width` | 2px |
| `--ui-focus-ring-offset` | 2px |
| `--ui-duration-fast` / `-base` / `-slow` | 120ms / 200ms / 320ms; **0ms** under `prefers-reduced-motion: reduce` |
| `--ui-easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` |

### Theme-defined, optional
Emitted when the theme defines them. The Bootstrap mapping uses the radii and the `body` text style, so a theme used with Bootstrap defines them.

| Source | Variables |
|---|---|
| type styles | `--ui-text-<style>-size`, `-line-height`, `-weight`, `-tracking` (e.g. `--ui-text-body-size`) |
| spacing | `--ui-space-<n>` |
| radius | `--ui-radius-sm`, `-md`, `-lg`, `-pill` |
| shadow | `--ui-shadow-<name>` |
| family `arabic` | `--ui-font-arabic`; text in `lang="ar"` uses it |
| accents `accent-<id>` (+ `-soft`) | `--ui-color-accent-<id>`; `data-accent="<id>"` points `accent` and `accent-soft` at them |

### Component tokens
Named `--ui-<component>-<property>` (`--ui-button-radius`, `--ui-input-border`), declared in the component's own styles with a semantic token as default, so that a theme may override them. None exist yet; each atom adds its own (spec 003).

## Theme compiler

`compiler/` turns a theme's `tokens.json` into `src/<name>.generated.css` and `src/<name>.generated.ts`, and validates it: format, aliases, duplicates, required tokens, and WCAG AA contrast for the pairs in the theme's `contrast-pairs.json`.

```bash
npx nx compile-tokens theme-olivier   # regenerate after changing tokens.json
npx nx check-tokens theme-olivier     # what CI runs: fails on invalid input, contrast or stale output
npx nx compile-tokens ui-tokens       # regenerate the defaults after changing contract.json
```

Generated files (`*.generated.*`) are committed and never edited by hand.
