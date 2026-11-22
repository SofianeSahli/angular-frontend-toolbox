# Spec 004 — design reference: molecules, organisms, templates

Written on Sofiane's request by the design session (claude.ai), 2026-11-22. It is the visual and API source for spec 004: write `requirements.md` from it, and port the CSS when implementing. The same components are drawn in the Olivier design system (Molecules, Organisms and Templates groups): https://claude.ai/artifact/5zWMu9cFRGm9LBrTjZFkoQ. That link is for humans; everything you need is in this folder.

## Files

| File | What it is |
|---|---|
| `README.md` | this file: inventory, global rules, then one section per component (purpose, Angular API, behaviour, accessibility) |
| `reference.css` | the CSS of every component, written with the repo token names (`--ui-*`) and logical properties, inside `@layer ui`. Each `.ui-<name>` block becomes that component's `:host` styles |
| `preview.html` | every component in its states. Open it directly in a browser (it links the repo's generated token and theme CSS). Buttons switch light/dark and LTR/RTL |
| `atoms-shim.css` | preview-only copy of the atom classes so `preview.html` renders. Not for production: the real atoms are the spec 003 components |

## Inventory (27 components)

| Level | Component | Purpose |
|---|---|---|
| Molecule | [FormField](#formfield) | Wraps one form control with its label, hint, error, character counter and optional prefix, suffix or inline action (show password). |
| Molecule | [Alert](#alert) | An inline message inside a page or form: information, success, warning or error. Not for transient feedback (use Toast). |
| Molecule | [SegmentedControl](#segmentedcontrol) | Picks one of 2 to 4 short options shown side by side (Dépense / Revenu, Foyer / Moi seulement). |
| Molecule | [ChipGroup](#chipgroup) | A row of `uiChip` filters with single or multiple selection. |
| Molecule | [Stat](#stat) | A labelled number: label, value (usually a `ui-amount`), optional meta line and badge. |
| Molecule | [ListItem](#listitem) | One row: leading visual (icon tile or avatar), title, subtitle, trailing content (amount, badge, chevron). |
| Molecule | [SectionHeader](#sectionheader) | The title row of a card or section, with an optional link, action or note at the end. |
| Molecule | [MonthSwitcher](#monthswitcher) | Moves between months: previous, the month name, next. |
| Molecule | [SearchField](#searchfield) | A search input with a leading icon and a clear button. |
| Molecule | [EmptyState](#emptystate) | What a list or page shows when there is nothing yet, with the action that fills it. |
| Molecule | [Menu](#menu) | A small list of actions opened from a button (row actions, book switcher, profile menu). |
| Molecule | [OptionCard](#optioncard) | A large radio choice with a title, an icon and a description (first-run choice, plan choice). |
| Molecule | [CodeInput](#codeinput) | A one-time code entry (6 digits by default) for email confirmation, password reset and two-factor. |
| Molecule | [Stepper](#stepper) | Shows progress in a short multi-step flow (create household, then its book). |
| Molecule | [AvatarGroup](#avatargroup) | The members of a book or household, overlapping. |
| Organism | [TopBar](#topbar) | The phone header: a leading action (back, menu, book switcher), a title, trailing actions. |
| Organism | [SideRail](#siderail) | The desktop navigation column: brand, the primary action, destinations, optional sections (books), and the account at the bottom. |
| Organism | [BottomTabs](#bottomtabs) | The phone navigation: up to 4 destinations and one central action. |
| Organism | [Dialog](#dialog) | A modal task: centred dialog from the medium breakpoint, bottom sheet below it (same component). |
| Organism | [ConfirmDialog](#confirmdialog) | Asks for confirmation before a destructive or important action. |
| Organism | [Toast](#toast) | Short feedback after an action, optionally with one action (Annuler). Disappears on its own. |
| Organism | [FilterBar](#filterbar) | The filters above a list: search, then any mix of chip groups, selects and segmented controls. Wraps on narrow screens. |
| Organism | [GroupedList](#groupedlist) | A list split into groups with a header and a total (operations by day). On desktop the same data can use the `uiTable` directive with group rows. |
| Template | [AppShell](#appshell) | The frame of every signed-in screen: side rail on desktop, top bar and bottom tabs on phones, the routed page in the middle, the toast region once. |
| Template | [PageLayout](#pagelayout) | A page inside the shell: header (eyebrow, title, actions), then content, with an optional aside column. |
| Template | [AuthLayout](#authlayout) | Sign-in, sign-up, code and password screens: a brand panel and a centred form column. |
| Template | [FlowLayout](#flowlayout) | A focused step-by-step screen: back and close, a stepper, a title and lead, the form, and a footer action that stays reachable. |

Library placement: molecules in `@shared/ui-molecules`, organisms in `@shared/ui-organisms`, templates in `@shared/ui-templates`, as ARCHITECTURE §2 says.

## Global rules for this spec

- **Ported, not copied.** In the components, the root class becomes `:host`, modifiers become host classes driven by inputs, and every raw value left in `reference.css` (a few opacities, font sizes, `z-index`, the 4 px handle) becomes a `--ui-<component>-*` token declared in the component's own styles, as the spec 003 Stylelint rule requires. Reuse existing tokens wherever a value matches.
- **Breakpoints** are SCSS constants in `ui-tokens` (they cannot be CSS variables in media queries): `medium: 820px` (rail vs top bar + bottom tabs; dialog vs sheet; auth panel) and `wide: 1100px` (page aside column). Add `_breakpoints.scss` with `up()` / `down()` mixins.
- **RTL:** logical properties only. Directional icons (chevrons, back, arrows) use the registry's mirror flag. Keyboard arrows in SegmentedControl and Menu follow the reading direction. CodeInput and phone/email affixes stay LTR.
- **Overlays:** add `@angular/cdk` (pinned to the Angular major). Menu uses `@angular/cdk/menu`; Dialog, ConfirmDialog and the sheet use `@angular/cdk/dialog`; focus trapping and live announcements use `@angular/cdk/a11y`. No other UI dependency.
- **Presentational:** no store, HTTP, router logic or translation keys inside these libraries. Services allowed here are UI services only (`UiDialog`, `UiConfirm`, `UiToast`). `routerLinkActive` is set by the app on rail and tab items.
- **New `UI_TEXT` keys** (French defaults): `close` "Fermer", `cancel` "Annuler", `undo` "Annuler", `clear` "Effacer", `previousMonth` "Mois précédent", `nextMonth` "Mois suivant", `showPassword` "Afficher le mot de passe", `hidePassword` "Masquer le mot de passe", `moreActions` "Plus d'actions", `step` "Étape {{current}} sur {{total}}", and `errors`: `required` "Ce champ est obligatoire.", `email` "Saisissez une adresse e-mail valide.", `minlength` "{{requiredLength}} caractères minimum.", `maxlength` "{{requiredLength}} caractères maximum.", `pattern` "Le format n'est pas valide.".
- **Catalog:** add a page per level to `apps/ui-catalog`, same switches as spec 003 (theme, accent, light/dark, LTR/RTL).
- **Tests:** unit tests only (CLAUDE.md): one spec per component; for interactive ones, keyboard path and accessible name; for CDK overlays, open/close and focus return.

## Not in this spec (deferred)

- DateField and FilePicker (today's `DateInput`, `FilesInput`): native `input[type=date]` inside `ui-form-field` covers the expense date for now; a picker comes when an app needs it.
- Combobox (searchable select), AmountKeypad (quick add, expenses spec 006), charts (expenses summary, spec 007).
- Table sorting and column resizing.

---

# FormField

Wraps one form control with its label, hint, error, character counter and optional prefix, suffix or inline action (show password).

**Angular:** `<ui-form-field>` (molecule). The control is projected; the field reads its `NgControl` to show errors.

```html
<ui-form-field label="Nom du foyer" hint="Visible par les membres." [maxLength]="60">
  <input uiInput formControlName="name" />
</ui-form-field>

<ui-form-field label="Téléphone" optional>
  <span uiPrefix>+216</span>
  <input uiInput type="tel" formControlName="phone" />
</ui-form-field>

<ui-form-field label="Mot de passe">
  <input uiInput [type]="show() ? 'text' : 'password'" formControlName="password" />
  <button uiFieldAction type="button" [attr.aria-label]="…" (click)="show.set(!show())">…</button>
</ui-form-field>
```

| Input | Type | Notes |
|---|---|---|
| `label` | string | required; rendered as `<label for>` linked to the control's id (generated if missing) |
| `hint` | string | shown when there is no error |
| `optional` | boolean | appends `UI_TEXT.optional` ("(facultatif)") |
| `required` | boolean | shows the required mark; prefer `optional` |
| `maxLength` | number | shows the `n/max` counter, reading the control value |
| `errors` | `Record<string,string>` | message per validator key; falls back to `UI_TEXT.errors` |

- Error shows once the control is touched and invalid; sets `aria-invalid` and `aria-describedby` (hint or error id).
- Slots: `[uiPrefix]`, `[uiSuffix]`, `[uiFieldAction]`, default = the control.
- Phone and email prefixes keep `dir="ltr"`.
- Replaces today's `TextInput` and `SelectComponent` (already deleted in spec 002).

---

# Alert

An inline message inside a page or form: information, success, warning or error. Not for transient feedback (use Toast).

**Angular:** `<ui-alert tone="info | success | warning | danger" [title]="…">` with the message as content and optional `[uiAlertActions]` slot.

- Each tone has its own icon (info, check, triangle, cross) so colour is never the only signal.
- `danger` renders `role="alert"`; the others `role="status"`.
- Optional `dismissible` adds a close button (icon-only, `aria-label` from `UI_TEXT.close`) and emits `dismissed`.
- Replaces today's `ErrorAlert`.

---

# SegmentedControl

Picks one of 2 to 4 short options shown side by side (Dépense / Revenu, Foyer / Moi seulement).

**Angular:** `<ui-segmented-control [options]="…" formControlName="type" ariaLabel="Type" />`. ControlValueAccessor. `options: { value: T; label: string; disabled?: boolean }[]`.

- `role="radiogroup"` with `role="radio"` items, roving tabindex: arrow keys move and select (mirrored in RTL), Home/End jump.
- Replaces today's `SwitchButtons`.

---

# ChipGroup

A row of `uiChip` filters with single or multiple selection.

**Angular:** `<ui-chip-group [options]="…" mode="single | multiple" formControlName="types" ariaLabel="…" [scroll]="true" />`. ControlValueAccessor: a value in `single` mode, an array in `multiple` mode.

- `single` mode never leaves zero selected when `required` (the "Tout" pattern).
- `scroll` keeps one line and scrolls horizontally on phones.

---

# Stat

A labelled number: label, value (usually a `ui-amount`), optional meta line and badge.

**Angular:** `<ui-stat label="Reste à dépenser" size="md | hero" tone="neutral | accent | income">` with the value projected (`<ui-amount …>`) and an optional `[uiStatMeta]` slot.

- The value never wraps; tabular figures.
- Rendered as `<dl>`-like semantics: the label is the accessible name of the value group.

---

# ListItem (and List)

One row: leading visual (icon tile or avatar), title, subtitle, trailing content (amount, badge, chevron).

**Angular:** `<ui-list>` renders the `<ul>` card; `li[uiListItem]`, `a[uiListItem]`, `button[uiListItem]` render a row. Slots: `[uiLeading]`, `[uiTitle]`, `[uiSubtitle]`, `[uiTrailing]`.

- A link or button row is the whole touch target (min 52 px); never nest another button inside it.
- Title truncates with an ellipsis; the trailing amount never wraps.

---

# SectionHeader

The title row of a card or section, with an optional link, action or note at the end.

**Angular:** `<ui-section-header title="À surveiller" [level]="2">` with an optional projected link/button. `level` sets the heading tag (h2 by default) without changing the look.

---

# MonthSwitcher

Moves between months: previous, the month name, next.

**Angular:** `<ui-month-switcher [(month)]="month" [min]="…" [max]="…" [caption]="bookName" variant="boxed | plain" />`. `month` is a `YYYY-MM` string; the label is formatted with `Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })`.

- Chevron icons are directional: they mirror in RTL. Previous is always at the inline start.
- The label is `aria-live="polite"`; buttons use `UI_TEXT.previousMonth` / `nextMonth`. Next is disabled after `max`.

---

# SearchField

A search input with a leading icon and a clear button.

**Angular:** `<ui-search-field [(value)]="query" placeholder="…" ariaLabel="Rechercher" [debounce]="250" />`, emits `valueChange` after the debounce. Escape clears.

---

# EmptyState

What a list or page shows when there is nothing yet, with the action that fills it.

**Angular:** `<ui-empty-state icon="inbox" title="…" text="…">` with an optional projected action. One primary action at most; the text says what will appear, never blames the user.

---

# Menu

A small list of actions opened from a button (row actions, book switcher, profile menu).

**Angular:** built on `@angular/cdk/menu`. `<button uiButton [uiMenuTriggerFor]="menu">` + `<ng-template #menu><ui-menu><button uiMenuItem icon="pencil">Modifier</button>…</ui-menu></ng-template>`. Item variants: default, `danger`, `checked` (for a switcher: `menuitemradio`).

- Keyboard and focus handling come from CDK (arrows, Escape, typeahead). Opens below the trigger, flips when there is no room, aligned to the inline start.
- Replaces today's `ContextMenu`.

---

# OptionCard

A large radio choice with a title, an icon and a description (first-run choice, plan choice).

**Angular:** `<ui-option-cards [options]="…" formControlName="start" legend="…" />` renders a `fieldset` of `label.ui-option-card` each holding an `input[uiRadio]`. ControlValueAccessor. `options: { value; title; description; icon? }[]`.

---

# CodeInput

A one-time code entry (6 digits by default) for email confirmation, password reset and two-factor.

**Angular:** `<ui-code-input [length]="6" formControlName="code" (completed)="submit($event)" />`. ControlValueAccessor.

- One real `<input inputmode="numeric" autocomplete="one-time-code">` sits over the cells, so paste, SMS/email autofill and screen readers work; the cells are `aria-hidden` and only mirror the value.
- Digits only, always left to right (also in Arabic). Emits `completed` when full. `invalid` styles every cell in danger.

---

# Stepper

Shows progress in a short multi-step flow (create household, then its book).

**Angular:** `<ui-stepper [current]="1" [total]="2" />`. The text label ("Étape 1 sur 2", from `UI_TEXT.step`) carries the meaning; the bars are decorative. Bars fill from the inline start (right in RTL).

---

# AvatarGroup

The members of a book or household, overlapping.

**Angular:** `<ui-avatar-group [members]="…" [max]="3" size="sm | md" />`; `members: { name; src?; colour }[]`. Beyond `max`, a "+N" avatar. The group's accessible name lists the names.

---

# TopBar

The phone header: a leading action (back, menu, book switcher), a title, trailing actions.

**Angular:** `<ui-top-bar [title]="…" align="center | start">` with slots `[uiTopBarLeading]`, `[uiTopBarTrailing]`, or project a custom title. Respects `env(safe-area-inset-top)` for Capacitor.

- Shown by `ui-app-shell` below the medium breakpoint only. The back icon is directional (mirrors in RTL).

---

# SideRail

The desktop navigation column: brand, the primary action, destinations, optional sections (books), and the account at the bottom.

**Angular:** `<ui-side-rail>` with slots `[uiRailBrand]`, `[uiRailAction]`, `[uiRailFooter]`, and nav content built from `a[uiRailItem]` (with `routerLink`, `routerLinkActive` sets `aria-current="page"`) and `<ui-rail-section label="Carnets">`.

- Sticky, full height, scrolls on its own. Shown by `ui-app-shell` from the medium breakpoint.
- Replaces today's `NavBar` and `DrawerHeader`.

---

# BottomTabs

The phone navigation: up to 4 destinations and one central action.

**Angular:** `<ui-bottom-tabs>` with `a[uiTab]` items (icon + label) and an optional `button[uiTabAction]` placed in the middle. Respects `env(safe-area-inset-bottom)`.

- Labels are always visible (no icon-only tabs). The order mirrors in RTL automatically.
- Replaces today's `AppNavbar`.

---

# Dialog (and bottom sheet)

A modal task: centred dialog from the medium breakpoint, bottom sheet below it (same component).

**Angular:** `UiDialog` service on `@angular/cdk/dialog`: `dialog.open(Component, { data, size: 'sm' | 'md' | 'lg', presentation: 'auto' | 'dialog' | 'sheet' })` returns a ref with `closed`. Template parts: `<ui-dialog-header title="…" />`, `[uiDialogBody]`, `[uiDialogFooter]`.

- `auto` (default) = sheet under 820 px, dialog above. Sheets show a handle; footer buttons stack full width, primary on top.
- Focus trap, Escape and backdrop close, `aria-labelledby` the title, focus returns to the trigger: all from CDK.
- Close button label from `UI_TEXT.close`. Replaces today's `ModalWrapper` (ng-bootstrap already removed).

---

# ConfirmDialog

Asks for confirmation before a destructive or important action.

**Angular:** `confirm.ask({ title, message, confirmLabel, cancelLabel?, tone: 'primary' | 'danger' }): Promise<boolean>`, built on `UiDialog` with `role="alertdialog"`.

- Focus starts on Cancel for `danger`. The confirm label repeats the verb ("Supprimer"), never "OK".
- Prefer undo (Toast with "Annuler") over confirmation for reversible actions like deleting one expense.
- Replaces today's `Confirmations`.

---

# Toast (and ToastRegion)

Short feedback after an action, optionally with one action (Annuler). Disappears on its own.

**Angular:** `UiToast` service: `toast.show({ message, tone: 'neutral' | 'success' | 'danger', action?: { label, run }, duration?: 5000 })`. `<ui-toast-region />` is placed once in the app shell.

- Inverted colours (ink background) so it reads on any page, in both themes.
- `aria-live="polite"` (danger: `assertive`); pauses while hovered or focused; one at a time on phones, stacked (max 3) on desktop.
- On phones it sits above the bottom tabs. The HTTP error presenter (spec 005) uses it.

---

# FilterBar

The filters above a list: search, then any mix of chip groups, selects and segmented controls. Wraps on narrow screens.

**Angular:** `<ui-filter-bar>` is a layout organism: it projects `ui-search-field` first and the filter controls after it, and emits nothing itself (filters bind to the page's form). An optional `[uiFilterReset]` slot shows "Réinitialiser" when filters differ from defaults.

---

# GroupedList (and Table)

A list split into groups with a header and a total (operations by day). On desktop the same data can use the `uiTable` directive with group rows.

**Angular:** `<ui-grouped-list [groups]="…" [itemTemplate]="row" [loading]="…" [empty]="emptyTpl" (endReached)="loadMore()">`; `groups: { key; label; total?: string; items: T[] }[]`. Shows skeleton rows while loading and the projected empty state when there are no groups. `endReached` fires near the bottom (cursor pagination).

`table[uiTable]` styles a native table: `tr[uiTableGroup]` for group rows, `td[uiNum]` for numbers (end-aligned, tabular), `.ui-table__secondary` columns hidden under 820 px.

---

# AppShell (template)

The frame of every signed-in screen: side rail on desktop, top bar and bottom tabs on phones, the routed page in the middle, the toast region once.

**Angular:** `<ui-app-shell>` with slots `[uiShellRail]` (a `ui-side-rail`), `[uiShellTop]` (a `ui-top-bar`), `[uiShellTabs]` (a `ui-bottom-tabs`) and the default slot (`<router-outlet />`). It adds `<ui-toast-region />` itself.

- Breakpoint: medium = 820 px (SCSS constant in ui-tokens, `@include bp.down(medium)`), the same as the mockups.
- Uses `100dvh` and safe-area insets so it works in Capacitor.
- Replaces today's app shell markup.

---

# PageLayout (template)

A page inside the shell: header (eyebrow, title, actions), then content, with an optional aside column.

**Angular:** `<ui-page title="…" eyebrow="…">` with slots `[uiPageActions]`, default content, `[uiPageAside]` (switches to 2fr/1fr columns). Max width 1240 px.

- Under 1100 px the aside stacks under the content. Under 820 px the header is hidden (the top bar shows the title) and padding drops to 16 px.

---

# AuthLayout (template)

Sign-in, sign-up, code and password screens: a brand panel and a centred form column.

**Angular:** `<ui-auth-layout>` with slots `[uiAuthBrand]` (filled by the app: logo, tagline, benefits, so the toolbox stays brand-free), `[uiAuthToolbar]` (language switch) and the default slot (the form, max 400 px).

- The brand panel hides under 820 px. Used by `identity/feature-auth` in spec 005.

---

# FlowLayout (template)

A focused step-by-step screen: back and close, a stepper, a title and lead, the form, and a footer action that stays reachable.

**Angular:** `<ui-flow-layout title="…" lead="…" [step]="1" [steps]="2" (back)="…" (close)="…">` with the default slot (content) and `[uiFlowFooter]` (actions). Max width 480 px, centred on desktop.

- Footer is sticky at the bottom (above the keyboard on phones). Back icon mirrors in RTL.
- Used for create household → create book, and later quick add.
