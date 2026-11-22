# 004 — Molecules, organisms and templates: Design

> Status: Draft (2026-11-22)
> Requirements: [requirements.md](./requirements.md) (revision 2, approved)
> CSS source: [design-reference/reference.css](./design-reference/reference.css)

## Overview

```
shared/ui/tokens/                 (changed)
  src/styles/_breakpoints.scss    $breakpoints-medium 820px, $breakpoints-wide 1100px, up() / down()   REQ-7.1
  src/lib/breakpoints.ts          BREAKPOINTS = { medium: 820, wide: 1100 } for TS (dialog presentation, toast stack)
  src/lib/ui-text.ts              new keys, nested errors, deep merge, fillUiText()                     REQ-7.3, 7.4
  stylelint/ui-rules.mjs          $<file>-* SCSS variables; dvh/svh/lvh/dvw/svw/lvw units               REQ-7.1a
shared/ui/atoms/                  (changed) icon starter set +16; kbd uses down(medium)                  REQ-7.5, C7
shared/ui/molecules/   @shared/ui-molecules   layer:molecule  15 folders                                 US-1, US-2
shared/ui/organisms/   @shared/ui-organisms   layer:organism  8 folders + table/ + styles/overlays.scss  US-3–US-5
shared/ui/templates/   @shared/ui-templates   layer:template  4 folders                                  US-6
apps/ui-catalog/                  router: atoms, molecules, organisms, 4 full-screen template routes     US-8
package.json                      @angular/cdk ~22.2                                                     REQ-7.2
```

Every component follows the spec 003 conventions:
- signal inputs, `OnPush`, emulated encapsulation;
- `@layer ui`, with `--ui-<file>-*` tokens declared on `:host`;
- logical properties and the shared `_focus-ring.scss` mixin, which moves to `ui-tokens` so every UI library can use it (see below).

## Cross-cutting decisions

### SCSS shared across libraries
- **Load path:** `_breakpoints.scss` and `_focus-ring.scss` (moved from atoms to `shared/ui/tokens/src/styles/`) are reached through a Sass load path, not a relative path into another project.
  - Each app's `stylePreprocessorOptions.includePaths` gets `shared/ui/tokens/src/styles`.
  - Each library's `vite.config.mts` gets `css.preprocessorOptions.scss.loadPaths`.
  - Component styles write `@use 'breakpoints' as bp;` and `@use 'focus-ring';`.
- **One value, two languages:** the TS `BREAKPOINTS` constant and the SCSS constants hold the same numbers. A `ui-tokens` unit test reads `_breakpoints.scss` and compares them, so they cannot drift.
- **Media queries:** `down(medium)` emits `(max-width: 819.98px)`; `up(medium)` emits `(min-width: 820px)`.

### Styling projected atoms
Emulated encapsulation scopes a component's selectors to its own template, so a molecule cannot style an atom the page projects into it. This affects:
- FormField: input corners next to an affix, and padding for the inline action;
- List: dividers between projected rows;
- FilterBar: the search field's flex basis;
- AppShell: none, its wrappers are its own.

**Decision:** a molecule styles projected atoms only through one pattern, `.own-element ::ng-deep > [uiInput]`. The own element keeps the scoping attribute, and only its direct projected children are matched, so nothing leaks. `::ng-deep` is deprecated but still supported in Angular 22. It is used only in that form, and each use is listed in the component's file.
- **Alternative rejected:** atoms exposing "context" inputs (for example `uiInput` reading a FormField token). It needs a token in the atoms library that only molecules provide, and more code per atom.

### Direction-aware keyboard
`isRtl(element)` returns `element.closest('[dir]')?.getAttribute('dir') === 'rtl'`, from a small helper in `@shared/ui-tokens`. It is read at key time, so a live direction switch is honoured. SegmentedControl swaps ArrowLeft and ArrowRight with it; CDK Menu already uses `Directionality`.

### ControlValueAccessor pattern (REQ-0.6)
SegmentedControl, ChipGroup, OptionCards and CodeInput:
- keep `value` and `disabled` in signals, so they redraw under OnPush without `markForCheck`;
- call `onChange` on user changes and `onTouched` on blur;
- implement `setDisabledState`.

They are provided with `NG_VALUE_ACCESSOR` and `forwardRef`.

## `UI_TEXT` (REQ-7.3, REQ-7.4)

```ts
interface UiTextErrors { readonly required: string; readonly email: string; readonly minlength: string; readonly maxlength: string; readonly pattern: string }
interface UiText {
  readonly loading: string; readonly optional: string;
  readonly close: string; readonly cancel: string; readonly undo: string; readonly clear: string;
  readonly previousMonth: string; readonly nextMonth: string;
  readonly showPassword: string; readonly hidePassword: string; readonly moreActions: string;
  readonly step: string;               // 'Étape {{current}} sur {{total}}'
  readonly errors: UiTextErrors & Readonly<Partial<Record<string, string>>>;
}
type UiTextOverrides = Partial<Omit<UiText, 'errors'>> & { readonly errors?: Partial<UiText['errors']> };
function provideUiText(overrides: UiTextOverrides): Provider;          // errors deep-merged
function fillUiText(template: string, values: Readonly<Record<string, string | number>>): string;  // {{ name }} → value; unknown names left as is
```

## Molecules (`@shared/ui-molecules`)

Each row lists the folder and selector, then the inputs, outputs and slots, then the notes.

- **`form-field/`, `ui-form-field`** (+ directives `[uiPrefix]`, `[uiSuffix]`, `[uiFieldAction]`)
  - Inputs: `label`*, `hint`, `optional`, `required`, `maxLength`, `errors`.
  - It finds the control with `contentChild(NgControl)` (optional) and the element with `contentChild` of `UiInput` or `UiSelect` (`read: ElementRef`).
  - An effect sets `id` (when missing), `aria-invalid` and `aria-describedby` through `Renderer2`.
  - State comes from `control.events` (value, status and touched changes) through `toSignal`.
  - The error text is the first error key, looked up in `errors`, then `UI_TEXT.errors`, then `errors.pattern`, filled by `fillUiText` with the error's data.
  - Affixes keep `dir="ltr"` when projected with `type="tel"` or `type="email"` inputs; the directive sets it.
- **`alert/`, `ui-alert`**
  - Inputs: `tone` (`info`), `title`, `dismissible`. Output: `dismissed`. Slot: `[uiAlertActions]`.
  - Tone icons: `info`, `circle-check`, `triangle-alert`, `circle-x`.
  - `role` is `alert` for danger and `status` otherwise.
- **`segmented-control/`, `ui-segmented-control`** (CVA)
  - Inputs: `options`*, `ariaLabel`*.
  - Roving tabindex: the checked item, or the first enabled one, is `tabindex=0`.
  - Arrows (RTL-aware), Home and End skip disabled items, and selecting moves focus.
- **`chip-group/`, `ui-chip-group`** (CVA)
  - Inputs: `options`*, `mode` (`single`), `ariaLabel`*, `scroll`, `required`.
  - Renders `button[uiChip]` inside `role="group"`.
  - `required` + single: pressing the pressed chip is ignored.
- **`stat/`, `ui-stat`**
  - Inputs: `label`*, `size`, `tone`. Slot: `[uiStatMeta]`.
  - `role="group"` + `aria-labelledby` pointing at the label; the value is a `<span>` around the projected content.
- **`list/`, `ui-list`; `list-item/`, `li|a|button[uiListItem]`**
  - Slots: `[uiLeading]`, `[uiTitle]`, `[uiSubtitle]`, `[uiTrailing]`.
  - `ui-list` renders `<ul role="list">` and styles the projected `li` dividers through `::ng-deep`.
  - The list-item minimum height is the `--ui-list-item-min-block-size` token (52px).
- **`section-header/`, `ui-section-header`**
  - Inputs: `title`*, `level` (2).
  - The tag is picked with `@switch` over h2–h6.
- **`month-switcher/`, `ui-month-switcher`**
  - Inputs and outputs: `month` (model)*, `min`, `max`, `caption`, `variant`, `locale` (`fr-TN`).
  - `YYYY-MM` arithmetic is done on numbers (no `Date` in UTC).
  - The label uses `new Date(year, month - 1, 1)` with `Intl.DateTimeFormat`.
- **`search-field/`, `ui-search-field`**
  - Inputs and outputs: `value` (model), `placeholder`, `ariaLabel`*, `debounce` (250).
  - Its own `input[uiInput]` keeps the typed text in a local signal.
  - A `setTimeout` writes the model after `debounce` ms and is reset on each keystroke.
  - Escape or Clear writes `''` at once and refocuses the input.
- **`empty-state/`, `ui-empty-state`**
  - Inputs: `icon`*, `title`*, `text`. Slot: the default action.
  - The icon is a `ui-icon tile`, sized by setting `--ui-icon-tile-size` on that element from this component's styles.
- **`menu/`: `[uiMenuTriggerFor]`, `ui-menu`, `button[uiMenuItem]`, `button[uiMenuItem][checked]`**
  - The trigger uses `hostDirectives: CdkMenuTrigger` (input alias `uiMenuTriggerFor`), positioned below and at the start, with fallbacks above and at the end.
  - `ui-menu` uses `hostDirectives: CdkMenu`.
  - Items: one component uses `CdkMenuItem` (`:not([checked])`), the other `CdkMenuItemRadio` with `checked`.
  - Item inputs: `icon`, `danger`.
- **`option-cards/`, `ui-option-cards`** (CVA)
  - Inputs: `options`*, `legend`*.
  - Renders `<fieldset><legend>` with one `<label class="card">` per option, each holding `input[type=radio][uiRadio]` and a shared generated `name`.
- **`code-input/`, `ui-code-input`** (CVA)
  - Inputs: `length` (6). Output: `completed`.
  - One native input (`maxlength=length`, digits filtered on `input`, `dir="ltr"`); the cells are computed from the value signal.
  - The active cell is at index `value.length` while focused.
  - Invalid styling comes from the bound control (touched and invalid), read through an injected `NgControl` (`inject(NgControl, { self: true, optional: true })` with the CVA registered manually, to avoid a circular provider).
- **`stepper/`, `ui-stepper`**
  - Inputs: `current`*, `total`*.
  - The label is `fillUiText(UI_TEXT.step, …)`; the bars are `aria-hidden`.
- **`avatar-group/`, `ui-avatar-group`**
  - Inputs: `members`*, `max` (3), `size` (`sm`).
  - Shows `ui-avatar decorative` for the first `max` members and a `+N` span with the avatar look.
  - The host has `role="img"` and `aria-label` = all names joined with ", ".

\* required input.

## Organisms (`@shared/ui-organisms`)

| Folder / API | Notes |
|---|---|
| `top-bar/`: `ui-top-bar` (`title`, `align`), slots `[uiTopBarLeading]`, `[uiTopBarTrailing]`, `[uiTopBarTitle]` | `<header>`; a title is an `h1` unless one is projected |
| `side-rail/`: `ui-side-rail`, `a[uiRailItem]`, `ui-rail-section` (`label`) | `<nav>` landmark labelled by the brand; item styles key on `aria-current="page"`, which `routerLinkActive` sets with `ariaCurrentWhenActive="page"` |
| `bottom-tabs/`: `ui-bottom-tabs`, `a[uiTab]`, `button[uiTabAction]` | `<nav>`; the central action is placed with grid order so it sits in the middle of up to 4 tabs |
| `dialog/`: `UiDialog` service, `ui-dialog-header` (`title`), `[uiDialogBody]`, `[uiDialogFooter]` | see below |
| `confirm-dialog/`: `UiConfirm` service + its internal content component | `ask()` opens through `UiDialog` with `role: 'alertdialog'`, `autoFocus` on `#cancel` for danger and on the confirm button otherwise; resolves from `closed` (`true` only from Confirm) |
| `toast/`: `UiToast` service, `ui-toast-region` | see below |
| `filter-bar/`: `ui-filter-bar`, slot `[uiFilterReset]` | flex wrap layout; the search field's basis is set through `::ng-deep > ui-search-field` |
| `grouped-list/`: `ui-grouped-list<T>` (`groups`, `itemTemplate`, `loading`, `empty`), output `endReached` | each group is `<section aria-labelledby>` + header + `ui-list` of `itemTemplate` rows; 3 `ui-skeleton` rows while loading; a sentinel element watched by an `IntersectionObserver` (no observer, as in jsdom without a stub, means no event) emits once per intersection while not loading |
| `table/`: `table[uiTable]`, `tr[uiTableGroup]`, `td[uiNum]` | attribute components with styles; `.ui-table__secondary` hidden `down(medium)` |
| `styles/overlays.scss` | global: `.ui-overlay-backdrop`, `.ui-dialog-pane` (+ `--sm`/`--lg`/`--sheet`) |

**Dialog** (REQ-3.1, REQ-3.2):
- **Opening:** `UiDialog.open(component, { data, size = 'md', presentation = 'auto' })` calls CDK `Dialog.open` with:
  - `panelClass: ['ui-dialog-pane', 'ui-dialog-pane--' + size, sheet ? 'ui-dialog-pane--sheet' : …]`;
  - `backdropClass: 'ui-overlay-backdrop'`;
  - `ariaLabelledBy: titleId` and `restoreFocus: true`.
- **Sheet or dialog:** `auto` resolves with `matchMedia(down(medium))` at open time. A sheet uses a global position strategy at the bottom.
- **Title:** the content gets `UI_DIALOG_CONTEXT = { titleId, close(result?) }`. `ui-dialog-header` renders `<h2 [id]="titleId">` and the close button.
- **What CDK provides:** Escape, the backdrop click and the focus trap.

**Toast** (REQ-3.4, REQ-3.5):
- **The service:** `UiToast` keeps `toasts = signal<UiToastItem[]>`. `show()` adds one with an id and returns a handle with `dismiss()`.
- **The region:**
  - it renders the last `maxVisible()` toasts, 1 below medium and 3 above, through a `matchMedia` signal;
  - each toast has `role="status"`, or `role="alert"` for danger (roles imply polite or assertive live regions);
  - an icon per tone (neutral has none, success `circle-check`, danger `circle-x`) and the action button.
- **Timers:** a per-toast timer runs while it is neither hovered nor focus-within, and pauses and resumes keeping the remaining time.
- **Action:** pressing it runs `action.run()` once and dismisses.
- **On phones:** `--ui-toast-region-offset` adds the bottom-tabs height below medium.

## Templates (`@shared/ui-templates`)

| Folder / API | Notes |
|---|---|
| `app-shell/`: `ui-app-shell`, slots `[uiShellRail]`, `[uiShellTop]`, `[uiShellTabs]`, default | CSS-only switch at `down(medium)` (every slot rendered; hidden ones are `display: none`, so they leave the accessibility tree); adds `<ui-toast-region />`; `<main>` wraps the default slot |
| `page/`: `ui-page` (`title`*, `eyebrow`), slots `[uiPageActions]`, default, `[uiPageAside]` | the aside presence is detected with `contentChild` and switches to two columns; `down(wide)` stacks; `down(medium)` hides the header and uses `--ui-space-4` |
| `auth-layout/`: `ui-auth-layout`, slots `[uiAuthBrand]`, `[uiAuthToolbar]`, default | brand panel hidden `down(medium)` |
| `flow-layout/`: `ui-flow-layout` (`title`*, `lead`, `step`, `steps`), outputs `back`, `close`, slot `[uiFlowFooter]` | back (`arrow-left`, directional, named "Retour" from a new `UI_TEXT.back`, see deviation note below) and close (`x`, `UI_TEXT.close`); `ui-stepper` when `steps > 1`; `h1` title |

Note: FlowLayout's back button needs an accessible name and the reference lists no `UI_TEXT` key for it, so `back` "Retour" is added to `UI_TEXT` (recorded as a deviation for approval with this design).

## Porting rules for `reference.css`
- Root class → `:host`; `--modifier` → `:host(.…--modifier)`; `__part` → a class in the template.
- Token renames (C2):
  - `--ui-segmented-*` → `--ui-segmented-control-*`;
  - `--ui-empty-*` → `--ui-empty-state-*`;
  - `--ui-flow-*` → `--ui-flow-layout-*`;
  - `--ui-auth-*` → `--ui-auth-layout-*`;
  - `--ui-toast-*` on the region → `--ui-toast-region-*`;
  - dialog tokens → `overlays.scss` (`--ui-overlays-*`, since that file is named `overlays`).
- Shadows and backdrop (C1): `color-mix(in srgb, var(--ui-color-ink) var(--ui-<file>-shadow-mix), transparent)`.
- Raw values left in properties become tokens (C4): `gap: 2px` (bottom tabs), the 16px and 18px font sizes (option card, rail brand), the 4px dialog handle, `100vw`, `100dvh` and `92dvh`.
- Media queries → `@include bp.down(medium)` / `bp.down(wide)`.

## Catalog (US-8)
- **Routes:**
  - `''` → atoms (today's page, moved);
  - `molecules` and `organisms`;
  - `templates/app-shell`, `templates/page`, `templates/auth` and `templates/flow`.
- **Toolbar:** a `CatalogToolbar` component holds the theme, accent and direction switches, and appears in every level page and as a small overlay bar on template routes, with a "Retour au catalogue" link.
- **Styles:** `ui.scss`, the theme, `@angular/cdk/overlay-prebuilt.css`, then `overlays.scss`. The `includePaths` entry for the shared SCSS is added.
- **Content:**
  - the molecules page puts the form molecules in a reactive form, with live JSON as in spec 003;
  - the organisms page has buttons that open a dialog, a sheet, a danger and a primary confirmation, a menu, and three toast tones.

## Dependencies
`@angular/cdk ~22.2.x`. The lockfile is regenerated in a clean folder, as in specs 002 and 003.

## Requirement coverage
| REQ | Where |
|---|---|
| 0.1–0.6 | libraries, conventions, CVA pattern above |
| 7.1, 7.1a | `_breakpoints.scss`, `breakpoints.ts` + drift test, Stylelint rule update |
| 7.2, 7.2a | `@angular/cdk`, `overlays.scss` |
| 7.3, 7.4 | `ui-text.ts`, `fillUiText` |
| 7.5 | icon starter set (+16, C8) |
| 1.1–1.8 | form-field, segmented-control, chip-group, option-cards, code-input, search-field |
| 2.1–2.9 | alert, stat, list, section-header, month-switcher, empty-state, menu, stepper, avatar-group |
| 3.1–3.5 | dialog, confirm-dialog, toast |
| 4.1–4.4 | top-bar, side-rail, bottom-tabs, filter-bar |
| 5.1–5.4 | grouped-list, table |
| 6.1–6.4 | app-shell, page, auth-layout, flow-layout |
| 8.1–8.3 | catalog routes and pages |
| 9.1–9.6 | one spec per component; overlay, toast and CVA tests; ARCHITECTURE §7 and §8; one PR |

## Risks / alternatives considered
- **`::ng-deep` for projected atoms:** it is deprecated but supported, and is used only as `.own-element ::ng-deep > [atom]`. If Angular ever removes it, these styles move to host-context inputs on the atoms.
- **CDK in jsdom:** CDK dialog and menu need `matchMedia` and focus APIs. Tests stub `matchMedia` as in spec 002, and use `TestBed` with the CDK providers. The overlay container is in `document.body`, so tests query through `screen`.
- **`control.events`** (Angular 18+) gives value, status and touched changes in one stream; this avoids polling in FormField.
- **Rejected: a custom overlay** instead of CDK. The requirements name CDK, and it already provides the focus trap, keyboard handling and positioning.
