# 003 — Atoms and catalog: Design

> Status: Draft (2026-11-22)
> Requirements: [requirements.md](./requirements.md) (revision 2, approved)

## Overview

```
shared/ui/tokens/            @shared/ui-tokens   (changed)
  contract.json              + border-width-thin 1px, border-width-thick 2px                REQ-8.1
  src/lib/ui-text.ts         UI_TEXT, provideUiText                                          REQ-5.1
  src/lib/ui-theme.service   + accent signal, setAccent()                                    REQ-7.2
  src/styles/_bootstrap-map  --bs-border-radius → --ui-radius-sm                             REQ-8.5
  stylelint/ui-rules.mjs     two Stylelint plugin rules, with tests                          REQ-8.2, 8.3
shared/util/format/          + formatSignedMillimesHeadline                                  REQ-4.9
shared/ui/atoms/             @shared/ui-atoms    scope:shared type:ui layer:atom (new)
  src/index.ts               barrel
  src/lib/styles/_focus-ring.scss   one focus-ring mixin used by every interactive atom
  src/lib/<atom>/<atom>.ts|.scss|.spec.ts   one folder per atom (17 folders, list below)
  src/lib/icon/icons/        Lucide starter set + LICENSE (ISC)
apps/ui-catalog/             scope:shared type:app (new)
stylelint.config.mjs         uses the two plugin rules; length rules replaced
```

## Placement and reuse

- `UI_TEXT` lives in `ui-tokens`, because atoms (`layer:atom`) may import `layer:tokens` but not `type:feature` or apps (ARCHITECTURE §3).
- The Stylelint rules live in `ui-tokens/stylelint/`, next to the contract they enforce, and are tested by `ui-tokens`' Vitest run. The library map does not change.
- Reused:
  - `UiThemeService`, `provideUi` and `olivierTheme` (spec 002);
  - `formatMillimes`, `formatMillimesHeadline` and `formatSignedMillimes` (`util-format`);
  - the `ui` cascade layer and all scale tokens.
- New: only what the requirements name.

## Conventions shared by every atom (REQ-1.x, US-6)

- **Component shape:**
  - an attribute-selector component on the native element (`button[uiButton]`) or an element component (`ui-icon`);
  - `ChangeDetectionStrategy.OnPush`, signal `input()`s, emulated encapsulation;
  - state is reflected as host classes (`ui-button--primary`) and ARIA attributes through `host: {}` bindings.
- **Void elements:** atoms on `input`, `select` and `kbd` have an empty template (`input` and `select` get only native content). If Angular refuses a component on a void element, the fallback is a directive plus a component-less style entry. The first atom task checks this before any other form atom is built.
- **Styles:** each `<atom>.scss` file:
  - wraps everything in `@layer ui { … }`;
  - declares its component tokens on `:host` first, then reads only `var(--ui-*)`.

  ```scss
  @layer ui {
    :host {
      --ui-switch-track-inline-size: 44px;
      --ui-switch-track-block-size: 26px;
      --ui-switch-thumb-size: 20px;
      --ui-switch-thumb-inset: 3px;
      inline-size: var(--ui-switch-track-inline-size);
      transition: background-color var(--ui-duration-fast) var(--ui-easing-standard);
    }
  }
  ```

  Values that match a scale token use it: 6px radius → `--ui-radius-sm`, 12px padding → `--ui-space-3`, 13px text → `--ui-text-small-*`, 0.15s → `--ui-duration-fast`, 1px and 2px borders → `--ui-border-width-thin/thick`.
- **Focus (REQ-1.7):** `@include focus-ring.visible;` emits the `:host(:focus-visible)` outline from the focus tokens.
- **Motion (REQ-1.6, REQ-1.8):** transitions use the duration tokens, which are already `0ms` under reduced motion. Infinite animations (spinner, skeleton) also get `@media (prefers-reduced-motion: reduce) { animation: none; }`.
- **RTL (REQ-6.1, REQ-6.2):**
  - only logical properties (`padding-inline`, `inset-inline-start`, `margin-inline-start`, `text-align: start`);
  - the switch thumb moves with `inset-inline-start`, so there is no transform to mirror;
  - the Select chevron is two background gradients. `select` cannot hold a pseudo-element, and `background-position` has no logical form, so `:host(:dir(rtl))` swaps its horizontal position to the inline-start side of the padding.
- **Development reports (REQ-2.2, REQ-4.3, REQ-4.10):** `isDevMode()` + `console.error` with the atom and the problem; nothing in production.

## Atoms (inputs, host bindings, component tokens)

| Folder / selector | Inputs | Host bindings | Component tokens (declared defaults) |
|---|---|---|---|
| `button/` `button[uiButton], a[uiButton]` | `variant` (`secondary`), `size` (`md`), `iconOnly`, `loading`, `disabled` | classes per variant/size; `aria-busy`; `disabled` attr on `button`, `aria-disabled` + `tabindex=-1` on `a` | `--ui-button-padding-inline-sm/md/lg` 12/16/24px (sm, md as `--ui-space-3/4`, lg `--ui-space-6`), `--ui-button-font-size-lg` 16px, `--ui-button-icon-size` 18px, `--ui-button-disabled-opacity` 0.45 |
| `chip/` `button[uiChip]` | `pressed`, `count` | `aria-pressed` | `--ui-chip-block-size` 36px, `--ui-chip-padding-inline` 14px, `--ui-chip-hit-outset` 4px |
| `kbd/` `kbd[uiKbd]` | `onAccent` | class | `--ui-kbd-font-size` 11px, `--ui-kbd-padding-inline` 6px |
| `input/` `input[uiInput], textarea[uiInput]` | none | none (states from native attributes) | `--ui-input-textarea-min-block-size` 88px, `--ui-input-textarea-padding-block` 10px |
| `select/` `select[uiSelect]` | none | none | `--ui-select-chevron-size` 5px, `--ui-select-padding-inline-end` 40px |
| `label/` `label[uiLabel]` | `optional`, `required` | none | `--ui-label-gap` 6px |
| `field-message/` `ui-field-message` | `tone` (`hint`) | class | `--ui-field-message-gap` 6px |
| `checkbox/` `input[type=checkbox][uiCheckbox]` | `indeterminate` | `[indeterminate]` property | `--ui-checkbox-size` 20px, `--ui-checkbox-border-width` 1.5px |
| `radio/` `input[type=radio][uiRadio]` | none | none | `--ui-radio-size` 20px, `--ui-radio-border-width` 1.5px, `--ui-radio-dot-ring` 6px |
| `switch/` `input[type=checkbox][uiSwitch]` | none | `role="switch"` | track 44×26px, thumb 20px, inset 3px |
| `check-row/` `label[uiCheckRow]` | none | none | `--ui-check-row-gap` 10px (min height `--ui-control-height-md`) |
| `icon/` `ui-icon` | `name`*, `size` (20), `tile`, `label` | `aria-hidden` / `role=img` + `aria-label`; class `ui-icon--directional` | `--ui-icon-stroke-width` 1.8, `--ui-icon-tile-size` 40px, `--ui-icon-tile-tint` 13% |
| `badge/` `ui-badge` | `tone` (`neutral`) | class | `--ui-badge-block-size` 22px |
| `avatar/` `ui-avatar` | `name`*, `src`, `size` (`md`), `member` (1), `decorative` | `role=img` + `aria-label`, or `aria-hidden` | sizes 24/32/40px, font 11/13/15px |
| `amount/` `ui-amount` | `millimes`*, `display` (`full`), `tone` (`neutral`), `size` (`md`) | class | `--ui-amount-unit-font-size` 20px (hero unit) |
| `progress/` `ui-progress` | `value`*, `max` (100), `tone` (`accent`), `label`* | `role=progressbar`, `aria-valuenow/min/max`, `aria-label` | `--ui-progress-block-size` 8px, `--ui-progress-stripe` 6px |
| `spinner/` `ui-spinner`, `ui-skeleton` | spinner: `size` (18), `label`; skeleton: `shape` (`line`) | spinner `role=status` + `aria-label`; skeleton `aria-hidden` | `--ui-spinner-border-width` 2px → `--ui-border-width-thick`; `--ui-skeleton-line-block-size` 14px |

\* required input. Final token names may be refined during implementation, but only within `--ui-<atom>-*`.

Behaviour notes:
- **Button `loading` and disabled anchors (REQ-2.3, REQ-2.4):** a capture-phase `click` listener on the host calls `preventDefault()` and `stopImmediatePropagation()` while `loading` is set (or `disabled` on an anchor). The label stays; a `ui-spinner` (size 18, decorative) appears before it.
- **Button `iconOnly` without a name (REQ-2.2):** checked after the first render (`afterNextRender`). A name means `aria-label`, `aria-labelledby` or `title`.
- **Chip hit area (REQ-2.5):** `:host::after` with `inset-block: calc(-1 * var(--ui-chip-hit-outset))` brings the target to 44px.
- **Label (REQ-3.7):** `optional` appends `<span>` with `UI_TEXT.optional`; `required` appends `<span aria-hidden="true">*</span>`.
- **Field message (REQ-3.8):** an error renders `<ui-icon name="circle-alert" size="16">` before the content. The page sets `id` on the element and `aria-describedby` on the control.
- **Avatar (REQ-4.7, REQ-4.8):** the initial is `Array.from(name.trim())[0]?.toLocaleUpperCase('fr')`, so a surrogate pair or an Arabic letter is not cut. An `(error)` on the `img` sets a `photoFailed` signal, and the initial shows instead.
- **Amount (REQ-4.9, REQ-4.10):** one `computed()` picks the formatter from `display` × `tone`:
  - `full`: `formatMillimes`, or `formatSignedMillimes` for income;
  - `rounded`: `formatMillimesHeadline`, or the new `formatSignedMillimesHeadline` for income.

  A `RangeError` is caught: the text becomes `''` and the error is reported in development. For `hero`, the unit after the last no-break space is wrapped in a smaller `<span>`.
- **Progress (REQ-4.11, REQ-4.12):** the bar width is `min(value / max, 1) × 100%`, bound as an inline style. `aria-valuenow` is the raw value.

## Icons (REQ-4.1 – REQ-4.5, REQ-6.3)

- **Data, not HTML.** An icon is Lucide's node list (`[tag, attributes][]`, for example `['path', { d: '…' }]`). `ui-icon` renders it with `@for` and `@switch` over `svg:path`, `svg:circle`, `svg:rect`, `svg:line`, `svg:polyline`, `svg:polygon` and `svg:ellipse`. There is no `innerHTML` and no sanitizer bypass.

  ```ts
  type UiIconNode = readonly [tag: 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'polygon' | 'ellipse', attributes: Readonly<Record<string, string>>];
  interface UiIconDefinition { readonly nodes: readonly UiIconNode[]; readonly directional?: boolean }
  function provideIcons(icons: Record<string, UiIconDefinition>): Provider;   // multi provider
  ```

- **Registry:** `UiIconRegistry` (root) merges the starter set with every `provideIcons` record, and a later record wins. An unknown name renders nothing and reports in development.
- **Starter set:** the icons used by the design system's previews, copied from `lucide-static` (pinned version recorded in the file header and the licence file):

  | Name | Used by | Directional |
  |---|---|---|
  | `shopping-cart`, `house`, `search`, `car`, `coffee`, `zap`, `pill` | Icon preview (sizes and category tiles) | no |
  | `repeat` | Icon preview | **yes** (horizontal arrows) |
  | `arrow-up` | Icon preview (income tile) | no (vertical) |
  | `plus`, `trash-2` | Button preview | no |
  | `circle-alert` | Field message error | no |

  No chevron, back or list icon is used by the previews, so none is added. When one is added later, it is marked `directional: true`.
- **Mirroring:** `:host(.ui-icon--directional:dir(rtl)) svg { transform: scaleX(-1); }`.
- **Licence:** `src/lib/icon/icons/LICENSE` holds Lucide's ISC licence text.

## `UI_TEXT` (REQ-5.1, REQ-5.2)

```ts
interface UiText { readonly loading: string; readonly optional: string }
const DEFAULT_UI_TEXT: UiText = { loading: 'Chargement', optional: '(facultatif)' };
const UI_TEXT = new InjectionToken<UiText>('UI_TEXT', { providedIn: 'root', factory: () => DEFAULT_UI_TEXT });
function provideUiText(overrides: Partial<UiText>): Provider;   // { ...DEFAULT_UI_TEXT, ...overrides }
```

## Theme service addition (REQ-7.2)

`UiThemeService` gains `accent: Signal<string | null>` (from `provideUi`, else the theme's default) and `setAccent(accent)`, which applies `data-accent` and refuses an accent the theme does not have. The catalog uses it. Nothing is persisted: in a product app the accent is fixed by `provideUi`.

## Stylelint rules (REQ-8.2, REQ-8.3)

`shared/ui/tokens/stylelint/ui-rules.mjs` exports two plugin rules. `stylelint.config.mjs` loads them and drops the length rules they replace (the unit allow-lists, the hairline rule, and the `--*` raw-length rule). The colour rules stay.

- **`ui/lengths-only-in-component-tokens`:** a declaration whose value contains a raw length (number + `px|rem|em|pt|vh|vw|vmin|vmax|ch|ex`; `0` and `%` excepted) is allowed only when:
  - the property is `--ui-<component>-…`, where `<component>` is the style file's base name (`switch.scss` → `--ui-switch-…`);
  - the declaration is in that file.

  Everything else is reported, naming the property and the file. At-rule parameters (`@media (max-width: 767.98px)`) are not declarations and are not checked, because `var()` cannot be used there.
- **`ui/color-mix-tokens-only`:** in every `color-mix()`, after the colour-space argument, each colour argument must be `var(--ui-…)`, `currentColor` or `transparent`, optionally followed by a percentage. `currentColor` and `transparent` carry no colour value of their own (the tile tint is `color-mix(in srgb, currentColor 13%, transparent)`).
- **Tests:** `ui-rules.spec.ts` runs `stylelint.lint()` on allowed and refused samples for both rules (REQ-9.3).

## Catalog (`apps/ui-catalog`, US-7)

- **Project:** same setup as `expenses-management` (application builder, zone.js, Vitest unit-test target, Stylelint target, same budgets), with styles `ui.scss` and `olivier.generated.css`, and an `index.html` with the Google Fonts link and the theme script.
- **Config:**
  - `provideUi({ theme: olivierTheme })`;
  - `provideRouter([])` (one page, no routes);
  - no ngx-translate (REQ-7.3).
- **Page:** `CatalogPage` has a sticky toolbar with three `select[uiSelect]` controls:
  - **theme** → `UiThemeService.setChoice`;
  - **accent** → `setAccent`;
  - **direction** → `document.documentElement.dir` through `DOCUMENT`.

  Below the toolbar are three sections (Actions, Form controls, Display), each listing every variant, size and state from the requirements, with the design system's French sample texts.
- **RTL samples:** in RTL, a sample row shows Arabic labels ("إضافة مصروف", "بحث", "الميزانية").
- **Form (REQ-7.4):** one reactive form (`FormGroup` with description, category, recurring, type, reminder) bound to Input, Select, Checkbox, Radio and Switch, showing its JSON value live.
- **Tests:** `catalog.page.spec.ts` checks that every section renders and that the three switches call the service or set `dir`.

## Dependencies
- `@angular/forms` (~22.2.6) comes back for the catalog form; it was removed in spec 002 when nothing used it.
- Dev dependencies: `@testing-library/angular` (19.6), `@testing-library/user-event` and their peer `@testing-library/dom`.
- The lockfile is regenerated in a clean folder from `package.json`, as in spec 002, so `npm ci` works on Linux.

## Docs
- **ARCHITECTURE §5:**
  - the RTL rule: logical properties only; directional icons mirror;
  - component tokens are declared in the component's own stylesheet with a default, and are the only place a raw length may appear;
  - `color-mix()` takes tokens only.
- **CLAUDE.md "Style":** replace "only the 1px hairline is allowed" with the component-token rule and the RTL rule.
- **README:** list `ui-atoms` and `ui-catalog`.

## Requirement coverage
| REQ | Where |
|---|---|
| 1.1–1.5, 1.9 | `shared/ui/atoms` scaffold, conventions above |
| 1.6, 1.8 | duration tokens; spinner/skeleton reduced-motion block |
| 1.7 | `_focus-ring.scss` |
| 2.1–2.6 | `button/`, `chip/`, `kbd/` |
| 3.1–3.9 | `input/`, `select/`, `checkbox/`, `radio/`, `switch/`, `label/`, `field-message/`, `check-row/` |
| 4.1–4.5 | `icon/` + registry + starter set |
| 4.6–4.13 | `badge/`, `avatar/`, `amount/` (+ `formatSignedMillimesHeadline`), `progress/`, `spinner/` |
| 5.1, 5.2 | `ui-text.ts` |
| 6.1–6.3 | conventions (logical properties, switch inset, chevron, icon mirroring) |
| 6.4 | ARCHITECTURE §5 |
| 7.1–7.5 | `apps/ui-catalog`; `UiThemeService.setAccent` |
| 8.1, 8.4, 8.5 | `contract.json`, `_bootstrap-map.scss` |
| 8.2, 8.3 | `stylelint/ui-rules.mjs`, `stylelint.config.mjs` |
| 9.1–9.4 | dependencies; one spec per atom; rule tests; per-task checks |

## Risks / alternatives considered
- **A component on a void element** (`input[uiInput]`) is the main technical risk; it is checked in the first form-atom task. The fallback (directive + global style entry) keeps the same selectors and API.
- **`@layer` inside emulated component styles:** Angular's style scoping must keep the `@layer ui` block. This is checked with the first atom's build output; the fallback is `ViewEncapsulation.None` with the same `.ui-*` classes the reference CSS uses.
- **Rendering icons from `innerHTML`** with a sanitizer bypass was rejected in favour of Lucide's node data.
- **A Stylelint ignore list for atoms** was rejected (spec 002 rule); component tokens are the only home for raw lengths.
