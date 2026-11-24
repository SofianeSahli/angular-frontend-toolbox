# 004 — Molecules, organisms and templates: Requirements

> Status: Approved, revision 2 (2026-11-22): the proposals for conflicts C1–C9 are accepted, and questions 1–7 are resolved with the recommended options (one PR for the whole spec). No open questions.
> Source: [design-reference/README.md](./design-reference/README.md) (the 27 components, their Angular APIs, the global rules, the deferred list) and [design-reference/reference.css](./design-reference/reference.css) (the CSS to port). `preview.html` is the owner's visual check; it is not opened or tested here.
> Scope: three new libraries, `@shared/ui-molecules` (15 molecules), `@shared/ui-organisms` (8 organisms) and `@shared/ui-templates` (4 templates), plus additions to `@shared/ui-tokens`, the icon set and `apps/ui-catalog`.
> Architecture: [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) §2–§6, §8 step 4.

## Context

Specs 002 and 003 delivered the tokens, the Olivier theme, the 16 atoms and the catalog. The design session has now drawn the next three levels in the Olivier design system and written their reference into `design-reference/`. This spec builds them as toolbox libraries, with the same rules as the atoms:
- presentational;
- tokens only;
- logical properties;
- one spec file per component;
- unit tests only.

## User stories

- **US-1 — Form molecules.** As a user, I want form fields that show their label, hint, error, counter and affixes consistently, and compact choice controls (segmented control, chip group, option cards, one-time code), so that forms are quick and clear.
- **US-2 — Content molecules.** As a user, I want alerts, stats, list rows, section headers, a month switcher, a search field, empty states, steppers and avatar groups that look and behave the same in every app.
- **US-3 — Menus and overlays.** As a user, I want menus, dialogs (bottom sheets on phones), confirmations and toasts that are fully keyboard- and screen-reader-accessible and return focus where I was.
- **US-4 — Navigation.** As a user, I want a side rail on desktop and a top bar with bottom tabs on phones, so that I can reach every screen with one hand on a phone.
- **US-5 — Lists.** As a user, I want long lists grouped (by day) with totals, loading skeletons, an empty state and endless loading, plus a plain table on desktop.
- **US-6 — Page templates.** As an app developer, I want an app shell, a page layout, an auth layout and a flow layout, so that every screen has the same frame and I only write the content.
- **US-7 — Shared foundations.** As a toolbox developer, I want breakpoints, the CDK overlay layer, the new `UI_TEXT` strings and the icons these components need, defined once.
- **US-8 — Catalog.** As the owner, I want every new component in the catalog, one page per level, with the theme, accent and direction switches, so that I can review them by hand.

## Acceptance criteria (EARS)

### Shared rules (all components)
- **REQ-0.1** THE SYSTEM SHALL provide three libraries:
  - `shared/ui/molecules` (`@shared/ui-molecules`, `scope:shared type:ui layer:molecule`);
  - `shared/ui/organisms` (`@shared/ui-organisms`, `layer:organism`);
  - `shared/ui/templates` (`@shared/ui-templates`, `layer:template`).

  Each has one entry point, one folder per component and a barrel, and follows the ARCHITECTURE §3 layer constraints.
- **REQ-0.2** Every component SHALL:
  - be standalone and `OnPush`, with signal `input()` / `model()` / `output()`;
  - use no store, HTTP, router logic or translation keys (`routerLink` and `routerLinkActive` are set by the app on rail and tab items);
  - offer services only where the reference names them: `UiDialog`, `UiConfirm`, `UiToast`.
- **REQ-0.3** Every component's styles SHALL port `reference.css`:
  - the root class becomes `:host` and modifiers become host classes driven by inputs;
  - every rule reads `var(--ui-*)` tokens;
  - each raw value becomes a `--ui-<component>-*` token declared in that component's own style file, reusing a scale token wherever one matches;
  - everything sits in `@layer ui`, with zero Stylelint errors.
- **REQ-0.4** Every component SHALL use logical properties only. Keyboard arrow handling SHALL follow the reading direction (SegmentedControl, Menu). Directional icons SHALL mirror in RTL. CodeInput and phone or email affixes SHALL stay left-to-right.
- **REQ-0.5** WHEN an interactive component receives keyboard focus THE SYSTEM SHALL show the toolbox focus ring (spec 003 REQ-1.7).
- **REQ-0.6** Custom controls with no native element (SegmentedControl, ChipGroup, OptionCards, CodeInput) SHALL implement ControlValueAccessor, including `setDisabledState`. They SHALL redraw when the bound control's state changes (CLAUDE.md OnPush rule).

### US-7 — Shared foundations
- **REQ-7.1** THE SYSTEM SHALL add the breakpoints `medium: 820px` and `wide: 1100px` as SCSS constants in `@shared/ui-tokens` (`_breakpoints.scss`: `$breakpoints-medium`, `$breakpoints-wide`) with `up()` and `down()` mixins. Every component SHALL use them instead of writing a width in a media query, and `kbd[uiKbd]` SHALL hide with `down(medium)` (C7).
- **REQ-7.1a** THE SYSTEM SHALL extend the Stylelint length rule (C3, C4):
  - a raw length is allowed in a SCSS variable named `$<file name>-*` declared in that file, as for component tokens;
  - the units `dvh`, `svh`, `lvh`, `dvw`, `svw` and `lvw` count as raw lengths;
  - the rule's tests cover both changes.
- **REQ-7.2** THE SYSTEM SHALL add `@angular/cdk`, pinned to the Angular major (22), as the only new UI dependency:
  - `@angular/cdk/menu` for Menu;
  - `@angular/cdk/dialog` for Dialog, ConfirmDialog and the sheet;
  - `@angular/cdk/a11y` for focus trapping and live announcements.
- **REQ-7.2a** THE SYSTEM SHALL ship one global stylesheet, `overlays.scss` in `@shared/ui-organisms` (in `@layer ui`), for the elements CDK renders outside component hosts (backdrop, dialog and sheet panes) (C5). Apps add it, and CDK's overlay CSS, to `styles` after `ui.scss`.
- **REQ-7.3** THE SYSTEM SHALL add these `UI_TEXT` keys with French defaults, overridable with `provideUiText`:
  - `close` "Fermer", `cancel` "Annuler", `undo` "Annuler", `clear` "Effacer";
  - `previousMonth` "Mois précédent", `nextMonth` "Mois suivant";
  - `showPassword` "Afficher le mot de passe", `hidePassword` "Masquer le mot de passe";
  - `moreActions` "Plus d'actions";
  - `step` "Étape {{current}} sur {{total}}";
  - `errors.required` "Ce champ est obligatoire.";
  - `errors.email` "Saisissez une adresse e-mail valide.";
  - `errors.minlength` "{{requiredLength}} caractères minimum.";
  - `errors.maxlength` "{{requiredLength}} caractères maximum.";
  - `errors.pattern` "Le format n'est pas valide.".

  A `{{name}}` placeholder SHALL be filled from the matching value (step numbers, validator error data) by one toolbox helper, `fillUiText(template, values)` in `@shared/ui-tokens`, so the strings stay plain text that an app can also feed from translation files.
- **REQ-7.4** WHEN an app overrides some of the `errors` strings THE SYSTEM SHALL keep the defaults for the others (a deep merge of `errors`).
- **REQ-7.5** THE SYSTEM SHALL add to the icon starter set every Lucide icon these components use (list in conflict C8), with the directional ones flagged so they mirror in RTL.

### US-1 — Form molecules
- **REQ-1.1 FormField:** `<ui-form-field>` with these inputs:
  - `label` (required, rendered as a `<label for>` linked to the projected control's `id`, which is generated if missing);
  - `hint`;
  - `optional`, which appends `UI_TEXT.optional`;
  - `required`, which shows the required mark;
  - `maxLength`, which shows an `n/max` counter read from the control value;
  - `errors: Record<string, string>`.

  Slots: `[uiPrefix]`, `[uiSuffix]`, `[uiFieldAction]` and the default control.
- **REQ-1.2** WHEN the projected control is touched and invalid THE SYSTEM SHALL:
  - show the error message for its first error key, from `errors`, else from `UI_TEXT.errors`, else `errors.pattern`;
  - set `aria-invalid="true"` on the control;
  - point the control's `aria-describedby` at the error.

  Otherwise it points at the hint, if any. The hint is hidden while an error shows.
- **REQ-1.3** WHEN a phone or email prefix is projected THE SYSTEM SHALL keep it `dir="ltr"`.
- **REQ-1.4 SegmentedControl:** `<ui-segmented-control [options] ariaLabel>`, with `options: { value; label; disabled? }[]` and two to four items:
  - `role="radiogroup"` with `role="radio"` items and a roving tabindex;
  - arrow keys move and select (mirrored in RTL), Home and End jump, and disabled items are skipped.
- **REQ-1.5 ChipGroup:** `<ui-chip-group [options] mode="single | multiple" ariaLabel [scroll]>` built from `button[uiChip]`:
  - the value is a single value in `single` mode and an array in `multiple` mode;
  - IF the control is required and in `single` mode THEN pressing the pressed chip SHALL NOT clear the selection;
  - `scroll` keeps one line that scrolls horizontally.
- **REQ-1.6 OptionCards:** `<ui-option-cards [options] legend>` with `options: { value; title; description; icon? }[]`:
  - renders a `fieldset` with its `legend` and one label card per option;
  - each card holds an `input[uiRadio]`, so the native radio keyboard works.
- **REQ-1.7 CodeInput:** `<ui-code-input [length]="6" (completed)>`:
  - one real `<input inputmode="numeric" autocomplete="one-time-code">` lies over `aria-hidden` cells that mirror its value;
  - it accepts digits only, so pasting "12 34-56" gives "123456";
  - it is always left-to-right;
  - WHEN all `length` digits are entered THE SYSTEM SHALL emit `completed` with the code;
  - WHEN the bound control is invalid and touched THE SYSTEM SHALL style every cell as invalid.
- **REQ-1.8 SearchField:** `<ui-search-field [(value)] placeholder ariaLabel [debounce]="250">` with a leading search icon and a clear button (`UI_TEXT.clear`), shown only when there is text:
  - WHEN the user types THE SYSTEM SHALL update `value` once the debounce delay has passed since the last keystroke;
  - WHEN the user presses Escape or the clear button THE SYSTEM SHALL clear the value at once and keep focus in the field.

### US-2 — Content molecules
- **REQ-2.1 Alert:** `<ui-alert tone="info | success | warning | danger" [title]>`, with the message as content and a `[uiAlertActions]` slot:
  - each tone has its own icon;
  - `danger` gets `role="alert"`, the others `role="status"`;
  - WHEN `dismissible` is set THE SYSTEM SHALL show an icon-only close button named by `UI_TEXT.close` that emits `dismissed`.
- **REQ-2.2 Stat:** `<ui-stat label size="md | hero" tone="neutral | accent | income">`, with the value projected and a `[uiStatMeta]` slot:
  - the label is the accessible name of the value group;
  - the value never wraps and uses tabular figures.
- **REQ-2.3 List and ListItem:**
  - `<ui-list>` renders the list card (`<ul>`);
  - `li[uiListItem]`, `a[uiListItem]` and `button[uiListItem]` render a row with the slots `[uiLeading]`, `[uiTitle]`, `[uiSubtitle]` and `[uiTrailing]`;
  - a link or button row is the whole touch target, at least 52px high;
  - the title truncates with an ellipsis and the trailing content never wraps.
- **REQ-2.4 SectionHeader:** `<ui-section-header title [level]="2">` with projected end content. `level` (2–6) sets the heading tag without changing the look.
- **REQ-2.5 MonthSwitcher:** `<ui-month-switcher [(month)] [min] [max] [caption] variant="boxed | plain">`:
  - `month` is a `YYYY-MM` string;
  - the label is `Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })`, where `locale` is an input that defaults to `fr-TN` (like `util-format`), with `aria-live="polite"`;
  - previous is at the inline start and next at the inline end, with directional chevrons named by `UI_TEXT.previousMonth` and `UI_TEXT.nextMonth`;
  - WHEN `month` equals `max` (or `min`) THE SYSTEM SHALL disable next (or previous);
  - IF `month` is not a valid `YYYY-MM` THEN THE SYSTEM SHALL report it in development and show no label.
- **REQ-2.6 EmptyState:** `<ui-empty-state icon title text>` with one optional projected action.
- **REQ-2.7 Menu:** `button[uiButton][uiMenuTriggerFor]` plus `<ng-template><ui-menu>` with `button[uiMenuItem]` items, built on `@angular/cdk/menu`:
  - items take `icon` and the variants default, `danger` and `checked` (`menuitemradio`, for a switcher);
  - keyboard behaviour (arrows, Escape, typeahead) and focus return come from CDK;
  - it opens below the trigger, aligned to the inline start, and flips when there is no room.
- **REQ-2.8 Stepper:** `<ui-stepper [current] [total]>`. The text `UI_TEXT.step` carries the meaning; the bars are decorative (`aria-hidden`) and fill from the inline start.
- **REQ-2.9 AvatarGroup:** `<ui-avatar-group [members] [max]="3" size="sm | md">`, with `members: { name; src?; member? }[]` matching the Avatar atom (C6):
  - beyond `max`, a "+N" bubble, drawn by the group with the avatar look, shows instead of the remaining avatars;
  - the group's accessible name lists every member's name (including the hidden ones).

### US-3 — Overlays and feedback (organisms)
- **REQ-3.1 Dialog:** a `UiDialog` service on `@angular/cdk/dialog`, `open(Component, { data, size: 'sm' | 'md' | 'lg', presentation: 'auto' | 'dialog' | 'sheet' })`, returns a ref with `closed`:
  - template parts: `<ui-dialog-header title>`, `[uiDialogBody]` and `[uiDialogFooter]`;
  - `auto` is a sheet below the medium breakpoint and a dialog above it;
  - a sheet shows a handle, and its footer buttons stack full width with the primary on top.
- **REQ-3.2** WHEN a dialog opens THE SYSTEM SHALL:
  - trap focus inside it;
  - label it by its title (`aria-labelledby`);
  - close it on Escape, on a backdrop click and with the header's close button (named `UI_TEXT.close`).

  WHEN it closes THE SYSTEM SHALL return focus to the element that opened it.
- **REQ-3.3 ConfirmDialog:** `UiConfirm.ask({ title, message, confirmLabel, cancelLabel?, tone: 'primary' | 'danger' }): Promise<boolean>`, built on `UiDialog` with `role="alertdialog"`:
  - the cancel label defaults to `UI_TEXT.cancel`;
  - the promise resolves `true` only for the confirm button, and `false` for cancel, Escape and the backdrop;
  - WHEN `tone` is `danger` THE SYSTEM SHALL put the initial focus on Cancel.
- **REQ-3.4 Toast:** a `UiToast` service, `show({ message, tone: 'neutral' | 'success' | 'danger', action?: { label, run }, duration?: 5000 })`, and `<ui-toast-region>` placed once:
  - toasts use inverted colours;
  - the region is `aria-live="polite"` (`assertive` for danger);
  - the timer pauses while a toast is hovered or focused;
  - one toast at a time below the medium breakpoint, up to 3 stacked above it;
  - on phones it sits above the bottom tabs.
- **REQ-3.5** WHEN a toast's action is pressed THE SYSTEM SHALL run it once and close the toast. WHEN its duration ends THE SYSTEM SHALL close it.

### US-4 — Navigation (organisms)
- **REQ-4.1 TopBar:** `<ui-top-bar [title] align="center | start">` with the slots `[uiTopBarLeading]` and `[uiTopBarTrailing]` (or a projected title). It respects `env(safe-area-inset-top)`, and the back icon is directional.
- **REQ-4.2 SideRail:** `<ui-side-rail>`:
  - slots `[uiRailBrand]`, `[uiRailAction]` and `[uiRailFooter]`;
  - nav items `a[uiRailItem]` and sections `<ui-rail-section label>`;
  - the active item carries `aria-current="page"`, set through the app's `routerLinkActive`;
  - sticky and full height, scrolling on its own.
- **REQ-4.3 BottomTabs:** `<ui-bottom-tabs>` with up to 4 `a[uiTab]` items (icon and an always-visible label) and an optional central `button[uiTabAction]`. It respects `env(safe-area-inset-bottom)`.
- **REQ-4.4 FilterBar:** `<ui-filter-bar>` lays out the projected `ui-search-field` first, then the filter controls, wrapping on narrow screens, with an optional `[uiFilterReset]` slot. It emits nothing.

### US-5 — Lists (organisms)
- **REQ-5.1 GroupedList:** `<ui-grouped-list [groups] [itemTemplate] [loading] [empty] (endReached)>`, with `groups: { key; label; total?; items: T[] }[]`. Each group is a section with a header (label and total) and its rows from `itemTemplate`.
- **REQ-5.2** WHILE `loading` is true THE SYSTEM SHALL show skeleton rows after the current groups. IF there are no groups and it is not loading THEN THE SYSTEM SHALL show the `empty` template.
- **REQ-5.3** WHEN the end of the list comes into view THE SYSTEM SHALL emit `endReached` once per arrival, and not while `loading`.
- **REQ-5.4 Table:** `table[uiTable]`, in `@shared/ui-organisms` next to GroupedList, styles a native table:
  - `tr[uiTableGroup]` for group rows;
  - `td[uiNum]` for numbers, end-aligned with tabular figures;
  - `.ui-table__secondary` columns hidden below the medium breakpoint.

### US-6 — Templates
- **REQ-6.1 AppShell:** `<ui-app-shell>` with the slots `[uiShellRail]`, `[uiShellTop]`, `[uiShellTabs]` and the default routed content:
  - it adds `<ui-toast-region>` itself;
  - above the medium breakpoint it shows the rail; below it, the top bar and the bottom tabs;
  - it uses `100dvh` and the safe-area insets.
- **REQ-6.2 PageLayout:** `<ui-page title eyebrow>` with the slots `[uiPageActions]`, the default content and `[uiPageAside]`:
  - the aside makes 2fr/1fr columns, with a maximum width of 1240px;
  - below the wide breakpoint the aside stacks under the content;
  - below the medium breakpoint the header is hidden and the padding drops to `--ui-space-4`.
- **REQ-6.3 AuthLayout:** `<ui-auth-layout>` with the slots `[uiAuthBrand]` (filled by the app), `[uiAuthToolbar]` and the default form column (at most 400px). The brand panel hides below the medium breakpoint.
- **REQ-6.4 FlowLayout:** `<ui-flow-layout title lead [step] [steps] (back) (close)>` with the default content and `[uiFlowFooter]`:
  - it shows a `ui-stepper`, a back button with a directional icon and a close button (`UI_TEXT.close`);
  - the content is at most 480px wide and centred;
  - the footer is sticky at the bottom.

### US-8 — Catalog
- **REQ-8.1** THE SYSTEM SHALL give `apps/ui-catalog` one page per level (atoms, molecules, organisms, templates), with the theme, accent and direction switches available on every page.
- **REQ-8.1a** THE SYSTEM SHALL show AppShell, PageLayout, AuthLayout and FlowLayout each on its own full-screen catalog route, with a link back to the catalog.
- **REQ-8.2** THE SYSTEM SHALL show every component of this spec in its states, with French sample text, and open the dialog, sheet, confirmation, menu and toasts from buttons.
- **REQ-8.3** THE SYSTEM SHALL build the catalog in development and production within the existing budgets.

### Tests
- **REQ-9.1** Every component SHALL have one spec file (Vitest + Angular Testing Library, jsdom), using role and label queries. It covers:
  - the variants;
  - the disabled state where it applies;
  - the keyboard path for interactive components;
  - the accessible name.
- **REQ-9.2** CDK overlays (Menu, Dialog, ConfirmDialog) SHALL be tested for open, close (Escape, backdrop, button) and focus return. Toast SHALL be tested for auto-close, pause and action, with fake timers.
- **REQ-9.3** ControlValueAccessor components SHALL be tested bound to a reactive `FormControl` (write, change, disabled).
- **REQ-9.4** THE SYSTEM SHALL verify each task with affected lint, affected unit tests and the development builds of both apps (CLAUDE.md "Testing rules"). No e2e, no dev server, no browser; `preview.html` is not opened.
- **REQ-9.5** THE SYSTEM SHALL deliver the whole spec in one pull request.
- **REQ-9.6** THE SYSTEM SHALL update ARCHITECTURE §7 (date field and file picker deferred) and §8 step 4 (the dependency removals were done in spec 002) (C9).

## Unhappy paths checklist
- [x] Loading state: GroupedList skeletons (REQ-5.2); Button `loading` inside dialogs and forms (spec 003)
- [x] Empty state: EmptyState (REQ-2.6); GroupedList `empty` (REQ-5.2)
- [x] HTTP / network errors: n/a here (spec 005 presents errors through `UiToast` and `ui-alert`)
- [x] Validation errors: FormField (REQ-1.2); CodeInput invalid (REQ-1.7); MonthSwitcher invalid month (REQ-2.5)
- [x] Unauthenticated: n/a (AuthLayout is only a frame; flows come in spec 005)
- [x] Date & timezone: MonthSwitcher works on `YYYY-MM` strings, never on `Date` in UTC (REQ-2.5)
- [x] i18n / RTL: `UI_TEXT` (REQ-7.3, REQ-7.4); RTL rules (REQ-0.4)
- [x] Overflow: AvatarGroup "+N" (REQ-2.9); long titles truncate (REQ-2.3); Toast stacking limit (REQ-3.4)
- [x] Paste and autofill: CodeInput (REQ-1.7)

## Non-goals (deferred by the reference)
- DateField and FilePicker: a native `input[type=date]` inside `ui-form-field` covers the expense date for now.
- Combobox (searchable select), AmountKeypad (quick add, expenses work) and charts (expenses summary).
- Table sorting and column resizing.
- No screens in `expenses-management`: it keeps its placeholder until the expenses work.
- No visual, screenshot or browser tests.

## Conflicts with the code from specs 002–003
- **C1 — `rgb()` shadows and backdrop.**
  - Where: `reference.css` uses `rgb(var(--ui-color-ink-rgb) / 0.12)` (segmented selection, bottom-tab action, overlay backdrop).
  - The problems:
    - Stylelint (spec 002) refuses `rgb()`;
    - `--ui-color-*-rgb` is a comma-separated triplet (`28, 26, 23`), so the space-and-slash syntax is invalid CSS.
  - **Proposal:** `color-mix(in srgb, var(--ui-color-ink) 12%, transparent)`, which the spec 003 rule allows, with the percentage as a component token.
- **C2 — Token prefixes vs file names.**
  - The rule: the spec 003 Stylelint rule allows a raw value only in `--ui-<file name>-*`.
  - Where: the reference uses shorter prefixes: `--ui-segmented-*` (file `segmented-control.scss`), `--ui-empty-*` (`empty-state.scss`), `--ui-flow-*` (`flow-layout.scss`), `--ui-auth-*` (`auth-layout.scss`).
  - **Proposal:** rename these tokens to the file name (`--ui-segmented-control-*`, …). `--ui-page-*` works if the PageLayout file is `page.scss`, matching `ui-page`.
- **C3 — Breakpoint constants vs the Stylelint length rule.**
  - The problem: postcss-scss reads `$medium: 820px` as a declaration, so the spec 003 rule would refuse it.
  - **Proposal:** extend the rule the same way as component tokens. A raw length is allowed in a SCSS variable named `$<file name>-*` declared in that file (`_breakpoints.scss` → `$breakpoints-medium`, `$breakpoints-wide`). See question 1.
- **C4 — Raw lengths outside tokens.**
  - Where: `gap: 2px`, `100dvh`, `92dvh` and `calc(100vw - …)` appear directly in properties.
  - The problem: the Stylelint unit list also misses `dvh`, `svh`, `lvh`, `dvw`, `svw` and `lvw`.
  - **Proposal:** turn these values into component tokens, and add the six units to the rule so they are caught from now on.
- **C5 — Styles outside component hosts.**
  - The problem: `.ui-overlay-backdrop` and the dialog or sheet panel classes are rendered by CDK in the overlay container, outside any component host, so emulated component styles cannot reach them.
  - **Proposal:** `@shared/ui-organisms` ships one global stylesheet (`overlays.scss`, in `@layer ui`). Apps add it to `styles` after `ui.scss`, together with CDK's own overlay CSS. See question 2.
- **C6 — Avatar API.**
  - The mismatch: the reference's AvatarGroup takes `members: { name; src?; colour }`, but the spec 003 Avatar atom calls the same input `member: 1 | 2 | 3`.
  - The "+N" problem: an avatar's initial is the first letter of `name`, so a `ui-avatar` would show "+" only.
  - **Proposal:** AvatarGroup uses `{ name; src?; member? }`, matching the atom, and draws the "+N" bubble itself with the avatar's look.
- **C7 — Keyboard hint breakpoint.** Spec 003 hides `kbd[uiKbd]` below 768px (the design system's atom note), while the new medium breakpoint is 820px. **Proposal:** switch `uiKbd` to `down(medium)`, so there is one phone/desktop boundary.
- **C8 — Icons missing from the starter set.** The reference needs icons spec 003 did not ship. Lucide 1.77 names, with **directional** ones in bold:
  - `info`, `circle-check`, `triangle-alert`, `circle-x` (alert tones);
  - `x` (close);
  - **`chevron-left`**, **`chevron-right`** (month switcher);
  - **`arrow-left`** (back);
  - `eye`, `eye-off` (show password);
  - `ellipsis` (more actions);
  - `inbox` (empty state);
  - `pencil` (menu sample);
  - `check` (checked menu item);
  - `menu` (top bar).

  Each name will be checked against the package when it is copied.
- **C9 — ARCHITECTURE out of date.**
  - §7 lists `ui-date-field` and `ui-file-picker` as molecules, but the reference defers them.
  - §8 step 4 still says "remove ng-bootstrap, `moment` and bootstrap-icons", which was done in spec 002.
  - **Proposal:** update both in this spec.

## Decisions (2026-11-22)
- **Conflicts C1–C9:** the proposals are accepted (`color-mix()` shadows; tokens renamed to file names; `$<file name>-*` SCSS variables; viewport units in the rule; `overlays.scss`; Avatar `member` naming and a drawn "+N"; Kbd at `down(medium)`; the icon list; ARCHITECTURE updates).
1. [x] **Breakpoint constants:** `$<file name>-*` SCSS variables (REQ-7.1, REQ-7.1a).
2. [x] **Overlay styles:** `overlays.scss` in `@shared/ui-organisms` (REQ-7.2a).
3. [x] **MonthSwitcher locale:** no recommendation was given, so a `locale` input that defaults to `fr-TN` was chosen, consistent with `util-format` (REQ-2.5). The owner can still change this.
4. [x] **Table directive:** in `@shared/ui-organisms` (REQ-5.4).
5. [x] **Catalog templates:** full-screen routes (REQ-8.1a).
6. [x] **Delivery:** one PR for the whole spec (REQ-9.5).
7. [x] **`UI_TEXT` placeholders:** `{{name}}` strings filled by `fillUiText` (REQ-7.3).

## Open questions
None.
