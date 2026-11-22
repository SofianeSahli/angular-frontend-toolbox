# 003 — Atoms and catalog: Requirements

> Status: Draft, revision 2 (2026-11-22): answers to open questions 1–8 applied. No open questions.
> Scope:
> - a new library `shared/ui/atoms` (`@shared/ui-atoms`) with the 16 Olivier atoms;
> - the `UI_TEXT` token and two border-width defaults in `@shared/ui-tokens`;
> - Stylelint rules for component tokens and `color-mix()`;
> - the Bootstrap radius mapping fix;
> - a new app `apps/ui-catalog` that shows every atom in every state.
>
> Architecture: [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) §1–§6, §8 step 3.
> Source: the Olivier design system's component READMEs, previews and reference CSS `components/bundle.css` (read 2026-11-22).

## Context

Spec 002 (merged) delivered the token contract, the Olivier theme and an empty app. There are no components yet. The Olivier design system defines 16 atoms with an Angular API and reference CSS. Atoms are the lowest UI level: they read only tokens and import no other UI library (`layer:atom` may depend on `layer:tokens` and `type:util` only).

The reference CSS uses values that are not on the token scale (a 26px switch track, a 1.5px checkbox border, a 22px badge, an 11px font). Per ARCHITECTURE §5, these become **component tokens**: each atom's own stylesheet declares `--ui-<component>-<property>` with a default, and every usage reads the variable. A theme may override them. Values that already match a scale token use it (6px → `--ui-radius-sm`, 0.15s → `--ui-duration-fast`).

## User stories

- **US-1 — Atom library.** As a toolbox developer, I want one atoms library with shared conventions, so that every app builds its screens from the same accessible building blocks.
- **US-2 — Actions.** As a user, I want buttons, filter chips and keyboard hints that look and behave the same everywhere, so that I know what I can press.
- **US-3 — Form controls.** As a user, I want text fields, dropdowns, checkboxes, radios and switches that work with the keyboard, screen readers and Angular forms, so that I can enter data reliably.
- **US-4 — Display.** As a user, I want icons, badges, avatars, amounts, progress bars, spinners and skeletons that make status and money clear without relying on colour alone.
- **US-5 — Built-in text.** As an app developer, I want the few strings that atoms show on their own ("Chargement", "(facultatif)") to come from a token I can translate, so that toolbox UI never uses translation keys.
- **US-6 — Right-to-left.** As an Arabic-reading user, I want every atom to mirror correctly in a right-to-left layout, so that the app reads naturally.
- **US-7 — Catalog.** As the owner, I want an app that shows every atom in every variant and state, in light and dark, with each accent and in both directions, so that I can review the atoms by hand before they are used in screens.
- **US-8 — Token and lint rules.** As a maintainer, I want component tokens to be the only place raw sizes are defined, and `color-mix()` to mix tokens only, so that the contract stays enforced as atoms are added.

## Acceptance criteria (EARS)

### US-1 — Atom library (`@shared/ui-atoms`)
- **REQ-1.1** THE SYSTEM SHALL provide a library `shared/ui/atoms` (`@shared/ui-atoms`), tagged `scope:shared type:ui layer:atom`:
  - one entry point;
  - one folder per atom;
  - a barrel `index.ts`;
  - imports only from `@shared/ui-tokens` and `type:util` libraries.
- **REQ-1.2** THE SYSTEM SHALL use attribute selectors on native elements wherever a native element exists:
  - `button[uiButton]` and `a[uiButton]`, `button[uiChip]`, `kbd[uiKbd]`;
  - `input[uiInput]` and `textarea[uiInput]`, `select[uiSelect]`;
  - `input[type=checkbox][uiCheckbox]`, `input[type=radio][uiRadio]`, `input[type=checkbox][uiSwitch]`, `label[uiLabel]`.

  The others are element components: `ui-icon`, `ui-badge`, `ui-avatar`, `ui-amount`, `ui-progress`, `ui-spinner`, `ui-skeleton`, `ui-field-message`.
- **REQ-1.3** THE SYSTEM SHALL let Angular forms bind to the native controls directly, with no ControlValueAccessor in any atom.
- **REQ-1.4** Every atom SHALL use signal inputs only, `OnPush`, no store, no HTTP, no router and no translation keys.
- **REQ-1.5** Every atom's styles SHALL:
  - live in the `ui` cascade layer;
  - read only `var(--ui-*)` tokens in every rule;
  - declare their component tokens `--ui-<component>-<property>` in the atom's own style file, with a default;
  - reuse an existing scale token wherever one matches the reference value.
- **REQ-1.6** THE SYSTEM SHALL take every transition and animation duration from the motion tokens (`--ui-duration-*`, `--ui-easing-standard`). Motion is never a component token.
- **REQ-1.7** WHEN an interactive atom receives keyboard focus THE SYSTEM SHALL show one focus ring on `:focus-visible` only:
  - `--ui-focus-ring-width` solid `--ui-color-focus-ring`;
  - offset `--ui-focus-ring-offset`.
- **REQ-1.8** WHILE the device asks for reduced motion THE SYSTEM SHALL stop the spinner and skeleton animations and remove transitions (the duration tokens are already `0ms`; infinite animations also stop).
- **REQ-1.9** THE SYSTEM SHALL work in both themes and with every accent, with no change to the atom: the look comes from tokens.

### US-2 — Actions
- **REQ-2.1** THE SYSTEM SHALL provide Button with these inputs:
  - `variant`: `primary | secondary | ghost | danger`, default `secondary`;
  - `size`: `sm | md | lg` (36 / 44 / 52px through `--ui-control-height-*`), default `md`;
  - `iconOnly`: square button;
  - `loading`: shows a spinner and sets `aria-busy`.

  `primary` uses the accent.
- **REQ-2.2** IF `iconOnly` is set and the button has no accessible name THEN THE SYSTEM SHALL report it in development (a console error), so that every icon-only button has an `aria-label`.
- **REQ-2.3** WHILE a button is `loading` THE SYSTEM SHALL ignore activation (click and keyboard) and keep its label visible.
- **REQ-2.4** WHEN Button is disabled THE SYSTEM SHALL keep its label and show the disabled style. On `a[uiButton]` this uses `aria-disabled="true"` and blocks navigation.
- **REQ-2.5** THE SYSTEM SHALL provide Chip:
  - `button[uiChip]` with a `pressed` input reflected as `aria-pressed`, and an optional `count`;
  - 36px high, with a hit area of at least 44px.
- **REQ-2.6** THE SYSTEM SHALL provide Keyboard hint: `kbd[uiKbd]` with an `onAccent` input, hidden below 768px wide.

### US-3 — Form controls
- **REQ-3.1** THE SYSTEM SHALL provide Input on `input` and `textarea`, 44px high (textarea: at least 88px), with text at the `body` size.
- **REQ-3.2** WHEN a control has `aria-invalid="true"` THE SYSTEM SHALL show a danger border at `--ui-border-width-thick` instead of `--ui-border-width-thin`, without shifting the text.
- **REQ-3.3** THE SYSTEM SHALL style the disabled and read-only states of Input and Select distinctly from the default.
- **REQ-3.4** THE SYSTEM SHALL provide Select on the native `select`, same sizes and states as Input, with a drawn chevron on the inline-end side and no browser arrow.
- **REQ-3.5** THE SYSTEM SHALL provide Checkbox with the off, on, indeterminate and disabled states. `indeterminate` is an input, because HTML has no attribute for it.
- **REQ-3.6** THE SYSTEM SHALL provide Radio, and Switch (`role="switch"` on the native checkbox, toggled with Space).
- **REQ-3.7** THE SYSTEM SHALL provide Label: `label[uiLabel]` with two inputs:
  - `optional`: appends the `UI_TEXT` "optional" text;
  - `required`: an asterisk hidden from assistive technology, since the control itself carries `required`.
- **REQ-3.8** THE SYSTEM SHALL provide Field message: `ui-field-message` with `tone: hint | error` and an `id` for `aria-describedby`. An error shows an icon, so colour is not the only signal.
- **REQ-3.9** THE SYSTEM SHALL keep the checkbox, radio and switch rows at least 44px high when wrapped in a label.

### US-4 — Display
- **REQ-4.1** THE SYSTEM SHALL provide Icon:
  - `ui-icon` with `name` (required), `size: 16 | 20 | 24` (default 20), `tile` and `label`;
  - drawn as inline SVG in the current text colour, outline style, 1.8 stroke.
- **REQ-4.2** THE SYSTEM SHALL ship a starter set of Lucide icon shapes copied into the library, limited to the icons the design system's previews use, with Lucide's ISC licence file next to them. Apps add more with `provideIcons({ name: icon })`.
- **REQ-4.3** IF an icon name is not registered THEN THE SYSTEM SHALL render nothing and report it in development.
- **REQ-4.4** WHEN an icon has no `label` THE SYSTEM SHALL hide it from assistive technology (`aria-hidden="true"`). With a `label` it gets `role="img"` and that name.
- **REQ-4.5** WHEN `tile` is set THE SYSTEM SHALL draw a 40px square behind the icon, tinted at 13% of the current colour.
- **REQ-4.6** THE SYSTEM SHALL provide Badge: `ui-badge` with `tone: neutral | accent | success | warning | danger`, default `neutral`.
- **REQ-4.7** THE SYSTEM SHALL provide Avatar:
  - `ui-avatar` with `name`, `src`, `size: sm | md | lg` and `member: 1 | 2 | 3` (brand, accent, warning tints);
  - it shows the photo when `src` loads, else the first letter of `name`;
  - `name` is the accessible label unless `decorative` is set.
- **REQ-4.8** IF the avatar photo fails to load THEN THE SYSTEM SHALL show the initial instead.
- **REQ-4.9** THE SYSTEM SHALL provide Amount: `ui-amount` with `millimes` (integer), `display: full | rounded`, `tone: neutral | income` and `size: md | hero`. Formatting comes from `@shared/util-format`:
  - `full` → `formatMillimes`;
  - `rounded` → `formatMillimesHeadline`;
  - `income` → the explicit `+` sign and the success colour.

  Spending stays in ink, never red. The text uses tabular figures and never wraps.
- **REQ-4.10** IF `millimes` is not an integer THEN Amount SHALL show nothing and report the error in development, rather than throw during rendering.
- **REQ-4.11** THE SYSTEM SHALL provide Progress:
  - `ui-progress` with `value`, `max` (default 100), `tone: accent | warning | danger` and `label`;
  - `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and the label as its name;
  - `danger` is striped, so it reads without colour;
  - the page chooses the tone; the atom does not decide thresholds.
- **REQ-4.12** WHEN `value` exceeds `max` THE SYSTEM SHALL draw a full bar and still report the real value in `aria-valuenow`.
- **REQ-4.13** THE SYSTEM SHALL provide Spinner (`ui-spinner`: `size: 18 | 24`; `label`, default from `UI_TEXT`; `role="status"`) and Skeleton (`ui-skeleton`: `shape: line | block | circle`; hidden from assistive technology).

### US-5 — Built-in text
- **REQ-5.1** THE SYSTEM SHALL provide a `UI_TEXT` injection token in `@shared/ui-tokens` with French defaults for every string an atom shows on its own (at least `loading` = "Chargement" and `optional` = "(facultatif)"). An app overrides any of them with `provideUiText({...})`.
- **REQ-5.2** THE SYSTEM SHALL not use ngx-translate in any atom.

### US-6 — Right-to-left
- **REQ-6.1** Every atom's styles SHALL use logical properties and values only (`padding-inline`, `margin-inline-start`, `inset-inline-start`, `border-start-start-radius`, `text-align: start`, …). Physical `left`/`right` properties and values are not used.
- **REQ-6.2** WHEN the layout direction is right-to-left THE SYSTEM SHALL mirror every horizontal transform and position in the atoms (for example the switch thumb moves to the inline end when on), using logical insets or `:dir(rtl)`.
- **REQ-6.3** THE SYSTEM SHALL flag directional icons (chevrons, arrows, back, list) in the icon set, and WHEN the direction is right-to-left THE SYSTEM SHALL mirror them. Other icons never mirror.
- **REQ-6.4** THE SYSTEM SHALL add the logical-properties rule to ARCHITECTURE §5.

### US-7 — Catalog (`apps/ui-catalog`)
- **REQ-7.1** THE SYSTEM SHALL provide an app `apps/ui-catalog`, tagged `scope:shared type:app`, that renders every atom in every variant, size and state listed above, grouped as Actions, Form controls and Display.
- **REQ-7.2** THE SYSTEM SHALL show switches for:
  - the theme (`light | dark | system`, through `UiThemeService`);
  - the accent (all five Olivier accents, through `data-accent`);
  - the direction (LTR / RTL, through `dir` on `<html>`). WHEN RTL is selected THE SYSTEM SHALL also show a few sample labels in Arabic.
- **REQ-7.3** THE SYSTEM SHALL write the catalog's text as plain French strings (and the Arabic samples), with no translation keys.
- **REQ-7.4** THE SYSTEM SHALL show one reactive Angular form in the catalog bound to Input, Select, Checkbox, Radio and Switch, so that REQ-1.3 is visible.
- **REQ-7.5** THE SYSTEM SHALL build the catalog in development and production with the same budgets as `expenses-management`.

### US-8 — Token and lint rules
- **REQ-8.1** THE SYSTEM SHALL add two brand-free defaults to the contract in `@shared/ui-tokens`: `--ui-border-width-thin: 1px` and `--ui-border-width-thick: 2px`. Atoms use them for every border.
- **REQ-8.2** THE SYSTEM SHALL change Stylelint so that a raw length is allowed only as the value of a `--ui-<component>-*` custom property declared in that component's own style file. A raw length anywhere else is an error, including in a `--ui-<other>-*` property, in a semantic token, and in a non-custom property.
- **REQ-8.3** THE SYSTEM SHALL change Stylelint so that `color-mix()` is allowed only when every colour argument is a `var(--ui-…)` token. Raw colours inside it are an error.
- **REQ-8.4** The ui-tokens compiler, the theme format and `tokens.json` SHALL not change for component tokens.
- **REQ-8.5** THE SYSTEM SHALL map `--bs-border-radius` to `--ui-radius-sm`, as the design system says. Today this only affects Bootstrap's `.rounded` utility classes.

### Tests (all stories)
- **REQ-9.1** THE SYSTEM SHALL add `@testing-library/angular` and `@testing-library/user-event` as dev dependencies.
- **REQ-9.2** Every atom SHALL have one spec file (Vitest + Angular Testing Library, jsdom). It uses role and label queries and covers:
  - variants;
  - the disabled state;
  - the keyboard path, for interactive atoms;
  - the accessible name.
- **REQ-9.3** THE SYSTEM SHALL test:
  - `provideIcons` (a registered name, an unknown name, mirroring of directional icons);
  - `UI_TEXT` overrides;
  - Amount's formatting and its error path;
  - Progress's ARIA values;
  - the two new Stylelint rules (allowed and refused samples).
- **REQ-9.4** THE SYSTEM SHALL verify each task with affected lint, affected unit tests and the development builds of both apps (CLAUDE.md "Testing rules"). No e2e, no dev server, no browser. The owner reviews the catalog by hand, including the RTL switch.

## Unhappy paths checklist
- [x] Loading state: Button `loading` (REQ-2.3); Spinner and Skeleton (REQ-4.13)
- [x] Empty state: Avatar without photo (REQ-4.7); Icon with an unknown name (REQ-4.3)
- [x] HTTP / network errors: Avatar photo fails (REQ-4.8)
- [x] Validation errors: `aria-invalid` style (REQ-3.2); Field message error (REQ-3.8); non-integer millimes (REQ-4.10); icon-only button without a name (REQ-2.2)
- [x] Unauthenticated: n/a
- [x] Date & timezone: n/a (no date atom; date fields are molecules in spec 004)
- [x] i18n / RTL: `UI_TEXT` (REQ-5.1); logical properties and mirroring (US-6)
- [x] Reduced motion: REQ-1.8
- [x] Over the limit: Progress over 100% (REQ-4.12)

## Non-goals
- No molecules (form field, chip group, segmented control, combobox, alert, stat), organisms or templates: spec 004.
- No screens in `expenses-management`, which keeps its placeholder page.
- No visual, screenshot or browser tests.
- No multi-currency Amount: TND only.
- No secondary entry points per atom; revisit only if bundle size shows a problem.
- No dedicated hover or tint colour tokens (`color-mix()` of tokens instead).

## Decisions (open questions 1–8, resolved 2026-11-22)
1. [x] **Off-scale values:** component tokens declared in each atom's own stylesheet with a default; scale tokens wherever a value matches; motion from the duration tokens; two semantic border widths added (REQ-1.5, REQ-1.6, REQ-8.1, REQ-8.2, REQ-8.4).
2. [x] **Library shape:** one library, one entry point, one folder per atom, a barrel `index.ts` (REQ-1.1).
3. [x] **Icons:** Lucide shapes copied in, only those the previews use, with the ISC licence; directional icons flagged and mirrored (REQ-4.2, REQ-6.3).
4. [x] **Catalog:** plain French strings; theme, accent and direction switches, with Arabic samples in RTL (REQ-7.2, REQ-7.3).
5. [x] **Tests:** Angular Testing Library and user-event; one lean spec file per atom; unit tests only (REQ-9.1, REQ-9.2).
6. [x] **`color-mix()`:** allowed only with `var(--ui-…)` colour arguments (REQ-8.3).
7. [x] **RTL:** logical properties only; mirrored transforms; recorded in ARCHITECTURE (US-6).
8. [x] **Bootstrap radius:** `--bs-border-radius` → `--ui-radius-sm` (REQ-8.5).

## Open questions
None.
