# 003 — Atoms and catalog: Requirements

> Status: Draft, revision 1 (2026-11-22). Open questions 1–8 below.
> Scope: a new library `shared/ui/atoms` (`@shared/ui-atoms`) with the 16 Olivier atoms, the `UI_TEXT` token, and a new app `apps/ui-catalog` that shows every atom in every state.
> Architecture: [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) §1–§6, §8 step 3.
> Source: the Olivier design system's component READMEs and its reference CSS `components/bundle.css` (read 2026-11-22).

## Context

Spec 002 delivered the token contract, the Olivier theme and an empty app. There are no components yet. The Olivier design system defines 16 atoms with an Angular API and reference CSS. Atoms are the lowest UI level: they read only tokens and import no other UI library (`layer:atom` may depend on `layer:tokens` and `type:util` only).

The reference CSS uses many raw values that are not on the token scale: 6px gaps, 10px and 14px padding, a 1.5px border, 22px and 26px heights, an 11px font, 0.15s transitions, 0.45 opacity. Stylelint (spec 002) refuses raw lengths outside generated CSS. How these values become tokens is open question 1.

## User stories

- **US-1 — Atom library.** As a toolbox developer, I want one atoms library with shared conventions, so that every app builds its screens from the same accessible building blocks.
- **US-2 — Actions.** As a user, I want buttons, filter chips and keyboard hints that look and behave the same everywhere, so that I know what I can press.
- **US-3 — Form controls.** As a user, I want text fields, dropdowns, checkboxes, radios and switches that work with the keyboard, screen readers and Angular forms, so that I can enter data reliably.
- **US-4 — Display.** As a user, I want icons, badges, avatars, amounts, progress bars, spinners and skeletons that make status and money clear without relying on colour alone.
- **US-5 — Built-in text.** As an app developer, I want the few strings that atoms show on their own ("Chargement", "(facultatif)") to come from a token I can translate, so that toolbox UI never uses translation keys.
- **US-6 — Catalog.** As the owner, I want an app that shows every atom in every variant and state, in light and dark and with each accent, so that I can review the atoms by hand before they are used in screens.

## Acceptance criteria (EARS)

### US-1 — Atom library (`@shared/ui-atoms`)
- **REQ-1.1** THE SYSTEM SHALL provide a library `shared/ui/atoms` (`@shared/ui-atoms`), tagged `scope:shared type:ui layer:atom`, that imports only `@shared/ui-tokens` and `type:util` libraries.
- **REQ-1.2** THE SYSTEM SHALL use attribute selectors on native elements wherever a native element exists:
  - `button[uiButton]` and `a[uiButton]`, `button[uiChip]`, `kbd[uiKbd]`;
  - `input[uiInput]` and `textarea[uiInput]`, `select[uiSelect]`;
  - `input[type=checkbox][uiCheckbox]`, `input[type=radio][uiRadio]`, `input[type=checkbox][uiSwitch]`, `label[uiLabel]`.

  The others are element components: `ui-icon`, `ui-badge`, `ui-avatar`, `ui-amount`, `ui-progress`, `ui-spinner`, `ui-skeleton`, `ui-field-message`.
- **REQ-1.3** THE SYSTEM SHALL let Angular forms bind to the native controls directly, with no ControlValueAccessor in any atom.
- **REQ-1.4** Every atom SHALL use signal inputs only, `OnPush`, no store, no HTTP, no router and no translation keys.
- **REQ-1.5** Every atom's styles SHALL read only `var(--ui-*)` tokens and pass Stylelint with zero errors, in the `ui` cascade layer.
- **REQ-1.6** WHEN an interactive atom receives keyboard focus THE SYSTEM SHALL show one focus ring: `--ui-focus-ring-width` solid `--ui-color-focus-ring`, offset `--ui-focus-ring-offset`, on `:focus-visible` only.
- **REQ-1.7** WHILE the device asks for reduced motion THE SYSTEM SHALL stop the spinner and skeleton animations and remove transitions.
- **REQ-1.8** THE SYSTEM SHALL work in both themes and with every accent, with no change to the atom: the look comes from tokens.

### US-2 — Actions
- **REQ-2.1** THE SYSTEM SHALL provide Button with these inputs:
  - `variant`: `primary | secondary | ghost | danger`, default `secondary`;
  - `size`: `sm | md | lg` (36 / 44 / 52px through `--ui-control-height-*`), default `md`;
  - `iconOnly`: square button;
  - `loading`: shows a spinner and sets `aria-busy`.

  `primary` uses the accent.
- **REQ-2.2** IF `iconOnly` is set and the button has no accessible name THEN THE SYSTEM SHALL report it in development (a console error naming the button), so that every icon-only button has an `aria-label`.
- **REQ-2.3** WHILE a button is `loading` THE SYSTEM SHALL ignore activation (click and keyboard) and keep its label visible.
- **REQ-2.4** WHEN Button is disabled THE SYSTEM SHALL keep its label and show the disabled style. On `a[uiButton]` this uses `aria-disabled="true"` and blocks navigation.
- **REQ-2.5** THE SYSTEM SHALL provide Chip:
  - `button[uiChip]` with a `pressed` input reflected as `aria-pressed`, and an optional `count`;
  - 36px high, with a hit area of at least 44px.
- **REQ-2.6** THE SYSTEM SHALL provide Keyboard hint: `kbd[uiKbd]` with an `onAccent` input, hidden below 768px wide.

### US-3 — Form controls
- **REQ-3.1** THE SYSTEM SHALL provide Input on `input` and `textarea`, 44px high (textarea: at least 88px), with text at the `body` size.
- **REQ-3.2** WHEN a control has `aria-invalid="true"` THE SYSTEM SHALL show the invalid style: a danger border, thicker than the default.
- **REQ-3.3** THE SYSTEM SHALL style the disabled and read-only states of Input and Select distinctly from the default.
- **REQ-3.4** THE SYSTEM SHALL provide Select on the native `select`, same sizes and states as Input, with a drawn chevron and no browser arrow.
- **REQ-3.5** THE SYSTEM SHALL provide Checkbox with the off, on, indeterminate and disabled states. `indeterminate` is an input, because HTML has no attribute for it.
- **REQ-3.6** THE SYSTEM SHALL provide Radio, and Switch (`role="switch"` on the native checkbox, toggled with Space).
- **REQ-3.7** THE SYSTEM SHALL provide Label: `label[uiLabel]` with `optional` (appends the `UI_TEXT` "optional" text) and `required` (an asterisk hidden from assistive technology, since the control carries `required`) inputs.
- **REQ-3.8** THE SYSTEM SHALL provide Field message: `ui-field-message` with `tone: hint | error` and an `id` for `aria-describedby`. An error shows an icon, so colour is not the only signal.
- **REQ-3.9** THE SYSTEM SHALL keep the checkbox, radio and switch rows at least 44px high when wrapped in a label (a `.ui-check-row` style, or an equivalent the design picks).

### US-4 — Display
- **REQ-4.1** THE SYSTEM SHALL provide Icon:
  - `ui-icon` with `name` (required), `size: 16 | 20 | 24` (default 20), `tile` and `label`;
  - drawn as inline SVG in the current text colour, outline style, 1.8 stroke.
- **REQ-4.2** THE SYSTEM SHALL let apps register icons with `provideIcons({ name: svg })`. IF a name is not registered THEN THE SYSTEM SHALL render nothing and report it in development.
- **REQ-4.3** WHEN an icon has no `label` THE SYSTEM SHALL hide it from assistive technology (`aria-hidden="true"`). With a `label` it gets `role="img"` and that name.
- **REQ-4.4** WHEN `tile` is set THE SYSTEM SHALL draw a 40px square behind the icon, tinted at 13% of the current colour.
- **REQ-4.5** THE SYSTEM SHALL provide Badge: `ui-badge` with `tone: neutral | accent | success | warning | danger`, default `neutral`.
- **REQ-4.6** THE SYSTEM SHALL provide Avatar:
  - `ui-avatar` with `name`, `src`, `size: sm | md | lg` and `member: 1 | 2 | 3` (brand, accent, warning tints);
  - it shows the photo when `src` loads, else the first letter of `name`;
  - `name` is the accessible label unless `decorative` is set.
- **REQ-4.7** IF the avatar photo fails to load THEN THE SYSTEM SHALL show the initial instead.
- **REQ-4.8** THE SYSTEM SHALL provide Amount: `ui-amount` with `millimes` (integer), `display: full | rounded`, `tone: neutral | income` and `size: md | hero`. Formatting comes from `@shared/util-format`:
  - `full` → `formatMillimes`;
  - `rounded` → `formatMillimesHeadline`;
  - `income` → the explicit `+` sign and the success colour.

  Spending stays in ink, never red. The text uses tabular figures and never wraps.
- **REQ-4.9** IF `millimes` is not an integer THEN Amount SHALL show nothing and report the error in development, rather than throw during rendering.
- **REQ-4.10** THE SYSTEM SHALL provide Progress:
  - `ui-progress` with `value`, `max` (default 100), `tone: accent | warning | danger` and `label`;
  - `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and the label as its name;
  - `danger` is striped, so it reads without colour;
  - the page chooses the tone; the atom does not decide thresholds.
- **REQ-4.11** WHEN `value` exceeds `max` THE SYSTEM SHALL draw a full bar and still report the real value in `aria-valuenow`.
- **REQ-4.12** THE SYSTEM SHALL provide Spinner (`ui-spinner`: `size: 18 | 24`; `label`, default from `UI_TEXT`; `role="status"`) and Skeleton (`ui-skeleton`: `shape: line | block | circle`; hidden from assistive technology).

### US-5 — Built-in text
- **REQ-5.1** THE SYSTEM SHALL provide a `UI_TEXT` injection token in `@shared/ui-tokens` with French defaults for every string an atom shows on its own (at least `loading` = "Chargement" and `optional` = "(facultatif)"). An app overrides any of them with `provideUiText({...})`.
- **REQ-5.2** THE SYSTEM SHALL not use ngx-translate in any atom.

### US-6 — Catalog (`apps/ui-catalog`)
- **REQ-6.1** THE SYSTEM SHALL provide an app `apps/ui-catalog`, tagged `scope:shared type:app`, that renders every atom in every variant, size and state listed above, grouped as Actions, Form controls and Display.
- **REQ-6.2** THE SYSTEM SHALL let the viewer switch the theme (`light | dark | system`) and the accent (all five Olivier accents) in the catalog, using `UiThemeService` and `data-accent`.
- **REQ-6.3** THE SYSTEM SHALL build the catalog in development and production with the same budgets as `expenses-management`.
- **REQ-6.4** THE SYSTEM SHALL show at least one Angular form (reactive) in the catalog bound to Input, Select, Checkbox, Radio and Switch, so that REQ-1.3 is visible.

### Tests (all stories)
- **REQ-7.1** Every atom SHALL have Vitest + Angular Testing Library tests (jsdom) for its variants (classes or attributes), its disabled state, its keyboard path where interactive, and its accessible name or role.
- **REQ-7.2** THE SYSTEM SHALL test `provideIcons` (registered, unknown name), `UI_TEXT` overrides, Amount's formatting and error path, and Progress's ARIA values.
- **REQ-7.3** THE SYSTEM SHALL verify each task with affected lint, affected unit tests and the development builds of both apps (CLAUDE.md "Testing rules"). No e2e, no dev server, no browser. The owner reviews the catalog by hand.

## Unhappy paths checklist
- [x] Loading state: Button `loading` (REQ-2.3); Spinner and Skeleton (REQ-4.12)
- [x] Empty state: Avatar without photo (REQ-4.6); Icon with an unknown name (REQ-4.2)
- [x] HTTP / network errors: Avatar photo fails (REQ-4.7)
- [x] Validation errors: `aria-invalid` style (REQ-3.2); Field message error (REQ-3.8); non-integer millimes (REQ-4.9); icon-only button without a name (REQ-2.2)
- [x] Unauthenticated: n/a
- [x] Date & timezone: n/a (no date atom; date fields are molecules in spec 004)
- [x] i18n / RTL: `UI_TEXT` (REQ-5.1); layout uses logical properties so RTL works (see open question 7)
- [x] Reduced motion: REQ-1.7
- [x] Over the limit: Progress over 100% (REQ-4.11)

## Non-goals
- No molecules (form field, chip group, segmented control, combobox, alert, stat), organisms or templates: spec 004.
- No screens in `expenses-management`, which keeps its placeholder page.
- No visual, screenshot or browser tests.
- No multi-currency Amount: TND only.

## Open questions
1. [ ] **Off-scale values in the reference CSS.** Many are not on the token scale: 6px, 10px and 14px gaps and padding, a 1.5px checkbox border, the 2px invalid border, heights of 22px (badge), 26px (switch), 40px (tile) and 88px (textarea), an 11px font, 0.15s transitions, 0.45 opacity, 18px icons in buttons. Stylelint refuses raw lengths outside generated CSS. Options:
   - **(a)** Add a `component` section to the theme's `tokens.json`. The compiler emits these values as component tokens (`--ui-button-padding-x`, `--ui-switch-height`, …) in the generated CSS, the contract lists them with brand-free defaults, and the atom styles read only tokens. *(Recommended: raw values stay data, and a theme can restyle an atom.)*
   - **(b)** Round each value to the nearest existing token (6px → `space-2` 8px, 14px → `space-4` 16px, 1.5px → hairline). This is simpler but changes the look slightly from the design.
   - **(c)** Allow raw lengths inside `shared/ui/atoms` only. This breaks your "no exceptions" Stylelint rule.
2. [ ] **One library or one per atom?** ARCHITECTURE §2 lists a single `ui/atoms` (`@shared/ui-atoms`). Keep one library (simplest; tree-shaking drops unused atoms), or use one secondary entry point per atom (`@shared/ui-atoms/button`)?
3. [ ] **Icon source.** Lucide (ISC). Options:
   - **(a)** copy the SVG paths of a small starter set into the library (cart, home, search, plus, trash, check, alert, chevron, x, swap, arrow-up, arrow-down, user, settings), with apps adding theirs through `provideIcons`;
   - **(b)** depend on the `lucide-static` package and import what is needed.

   I recommend (a): no dependency and full control.
4. [ ] **Catalog text.** The catalog is a review tool, not a product screen. Write its labels as plain French strings in the templates (no ngx-translate), or put them through ngx-translate like an app? I recommend plain strings.
5. [ ] **Angular Testing Library.** ARCHITECTURE §6 names it. Add `@testing-library/angular` 19.6 (supports Angular ≥ 21) and `@testing-library/dom` as dev dependencies?
6. [ ] **`color-mix()`.** The reference CSS uses it for the primary hover, the icon-tile tint, the danger stripes and the kbd on accent. It is not a raw colour (it mixes tokens). Allow it in Stylelint, or add `-hover` and `-tint` colour tokens to the theme instead?
7. [ ] **Right-to-left.** Use logical properties (`padding-inline`, `margin-inline-start`) in every atom so that Arabic layouts mirror correctly, even though the reference CSS uses `left`/`right`?
8. [ ] **Bootstrap radius.** The design system maps `--bs-border-radius` to `radius-sm`; spec 002 mapped it to `radius-md`. Which one?
