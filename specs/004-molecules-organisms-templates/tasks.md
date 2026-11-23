# 004 — Molecules, organisms and templates: Tasks

> Status: Done, in review (2026-11-23)
> Design: [design.md](./design.md) (approved 2026-11-22)

Each task ends with the checks in CLAUDE.md "Testing rules":
- `nx affected -t lint`;
- `nx affected -t test`;
- the development builds of `expenses-management` and `ui-catalog`.

App tests run from PowerShell. No e2e, no dev server, no browser; `preview.html` was not opened. The whole spec ships in one PR (REQ-9.5).

- [x] **T1** — `ui-tokens` foundations
  - Fulfils: REQ-7.1, REQ-7.3, REQ-7.4, C7
  - Verify: `breakpoints.spec.ts`, `ui-text.spec.ts`, `direction.spec.ts` ✅; atoms tests and both app builds ✅
- [x] **T2** — Stylelint rule update
  - Fulfils: REQ-7.1a
  - Verify: `ui-rules.spec.ts` (+8 tests: `$breakpoints-*` allowed only in its file, other SCSS variables refused, `dvh`/`svh`/`lvh`/`dvw`/`svw`/`lvw` refused in properties) ✅; lint at 0 errors ✅
- [x] **T3** — Icons
  - Fulfils: REQ-7.5, C8
  - Verify: `icon.spec.ts` (+15: each new icon draws; only `chevron-left`, `chevron-right`, `arrow-left` and `repeat` are directional) ✅
- [x] **T4** — `@angular/cdk` and the three library scaffolds
  - Fulfils: REQ-0.1, REQ-7.2
  - Verify: lockfile regenerated in a clean folder, `npm ci --dry-run` clean ✅; a molecule importing an organism is refused by `@nx/enforce-module-boundaries` ✅
- [x] **T5** — Molecules: FormField, Alert, Stat, SectionHeader, EmptyState, Stepper
  - Fulfils: REQ-1.1–1.3, REQ-2.1, REQ-2.2, REQ-2.4, REQ-2.6, REQ-2.8
  - Verify: 6 spec files, 27 tests ✅
- [x] **T6** — Molecules: SegmentedControl, ChipGroup, OptionCards, CodeInput (ControlValueAccessor)
  - Fulfils: REQ-0.6, REQ-1.4–1.7
  - Verify: 4 spec files, 19 tests, all bound to a `FormControl` ✅
- [x] **T7** — Molecules: List and ListItem, MonthSwitcher, SearchField, AvatarGroup
  - Fulfils: REQ-1.8, REQ-2.3, REQ-2.5, REQ-2.9
  - Verify: 4 spec files, 13 tests ✅
- [x] **T8** — Molecules: Menu (CDK)
  - Fulfils: REQ-2.7
  - Verify: `menu.spec.ts` (opens; items, danger and `menuitemradio`; runs and closes; arrows; Escape returns focus to the trigger) ✅
- [x] **T9** — Organisms: Dialog, ConfirmDialog, Toast, `overlays.scss`
  - Fulfils: REQ-3.1–3.5, REQ-7.2a
  - Verify: `dialog.spec.ts` (5), `confirm-dialog.spec.ts` (5), `toast.spec.ts` (6, fake timers) ✅
- [x] **T10** — Organisms: TopBar, SideRail, BottomTabs, FilterBar, GroupedList, Table
  - Fulfils: REQ-4.1–4.4, REQ-5.1–5.4
  - Verify: 6 spec files, 10 tests (GroupedList with a stubbed `IntersectionObserver`) ✅
- [x] **T11** — Templates: AppShell, PageLayout, AuthLayout, FlowLayout
  - Fulfils: REQ-6.1–6.4
  - Verify: 4 spec files, 8 tests ✅
- [x] **T12** — Catalog
  - Fulfils: REQ-8.1, REQ-8.1a, REQ-8.2, REQ-8.3
  - Verify: `app.routes.spec.ts` (8: every route renders, toolbar switches, Arabic samples, molecules form binding, dialog and toast from the organisms page, template routes with a way back) ✅; development build ✅; production build ✅ (initial 489.43 kB, under the 500 kB warning; no component style over 4 kB)
- [x] **T13** — Docs and report
  - Fulfils: REQ-9.4, REQ-9.6
  - Verify: `nx affected -t lint test build check-tokens` vs `main` ✅ (see the verification report)

## Deviations from spec
- **Design (approved with it):** `UI_TEXT.back` "Retour" is added for FlowLayout's back button.
- **C8 / T3 (icons):**
  - 15 icons were added, not 16; the requirements counted one twice.
  - Lucide 1.77 renamed `triangle-alert` to `triangle-exclamation-point`, as it did for `circle-alert` in spec 003. The current names are used.
- **REQ-1.1 (FormField slots):** `[uiPrefix]`, `[uiSuffix]` and `button[uiFieldAction]` are small components, not plain directives, so each carries its own styles. FormField only adjusts the projected input's corners and padding.
- **REQ-1.7 (CodeInput):** the native input has no `maxlength`. With it, a pasted "12 34-56" was cut to six characters, separators included, before the digit filter ran. The component truncates the digits itself.
- **REQ-2.7 (Menu):**
  - a bound `[checked]` selects a second component (`UiMenuItemRadio`, CDK `menuitemradio`);
  - items emit `(triggered)`.
- **REQ-3.4 (Toast):** each toast carries `role="status"`, or `role="alert"` for danger, instead of one `aria-live` attribute on the region. The roles are live regions with the same politeness, and danger toasts become assertive.
- **REQ-4.2, REQ-4.3 (SideRail, BottomTabs):** an optional `ariaLabel` input names the `nav` landmark, because the toolbox has no built-in string for it. Only one of the two is visible at a time (the other is `display: none`).
- **REQ-4.1 (TopBar):** a custom title is projected with `[uiTopBarTitle]`; the host has `role="banner"`.
- **REQ-4.3 (BottomTabs):** the central action is placed in the middle with CSS `order`, so the page can write it before or after the tabs.
- **REQ-5.1 (GroupedList):** the page's `itemTemplate` renders the row's `<li>`; group headers are `h2`.
- **REQ-5.4 (Table):** the cells are native content inside the table host, not direct children, so the Table styles use `:host ::ng-deep` (scoped to the table). ARCHITECTURE §5 lists it as the second allowed form.
- **REQ-6.4 (FlowLayout):** the close output is `(exit)`, not `(close)`. Angular ESLint refuses an output named like a native DOM event (`close`), and also refuses aliasing it.
- **REQ-7.2a (overlays):** `overlays.scss` loads CDK's overlay CSS into the `vendor` layer itself, so an app adds only `overlays.scss`.
- **Tests:** CDK reads `KeyboardEvent.keyCode`, which user-event leaves at 0 in jsdom. The menu, dialog and confirmation keyboard tests dispatch keys with `fireEvent.keyDown(…, { key, keyCode })` (recorded in CLAUDE.md "Known issues").

## Verification report
| REQ | Verified how | Result |
|---|---|---|
| 0.1 | three libraries with their tags; the boundary refusal shown in T4 | ✅ |
| 0.2 | components use signal inputs and outputs, OnPush (lint), no store, HTTP or translation import; the only services are `UiDialog`, `UiConfirm`, `UiToast` | ✅ |
| 0.3 | every style file in `@layer ui`, with tokens named after its file; Stylelint 0 errors | ✅ |
| 0.4 | logical properties only; SegmentedControl RTL arrow test; directional icons; CodeInput and tel/email affixes `dir="ltr"` (tests) | ✅ (visual RTL by owner) |
| 0.5 | `focus-ring` mixin or `:focus-visible` rule in every interactive component | ✅ (review; visual by owner) |
| 0.6 | CVA tests: write, change, disabled | ✅ |
| 1.1–1.3 | `form-field.spec.ts` (8) | ✅ |
| 1.4 | `segmented-control.spec.ts` (5) | ✅ |
| 1.5 | `chip-group.spec.ts` (4) | ✅ |
| 1.6 | `option-cards.spec.ts` (4) | ✅ |
| 1.7 | `code-input.spec.ts` (6) | ✅ |
| 1.8 | `search-field.spec.ts` (4, fake timers) | ✅ |
| 2.1 | `alert.spec.ts` (7) | ✅ |
| 2.2 | `stat.spec.ts` (4) | ✅ |
| 2.3 | `list.spec.ts` (3) | ✅ |
| 2.4 | `section-header.spec.ts` (5) | ✅ |
| 2.5 | `month-switcher.spec.ts` (4) | ✅ |
| 2.6 | `empty-state.spec.ts` (2) | ✅ |
| 2.7 | `menu.spec.ts` (3) | ✅ |
| 2.8 | `stepper.spec.ts` (1) | ✅ |
| 2.9 | `avatar-group.spec.ts` (2) | ✅ |
| 3.1, 3.2 | `dialog.spec.ts` (5) | ✅ |
| 3.3 | `confirm-dialog.spec.ts` (5) | ✅ |
| 3.4, 3.5 | `toast.spec.ts` (6) | ✅ |
| 4.1–4.4 | top-bar, side-rail, bottom-tabs and filter-bar specs | ✅ |
| 5.1–5.3 | `grouped-list.spec.ts` (4) | ✅ |
| 5.4 | `table.spec.ts` (1); secondary columns hidden by a `down(medium)` rule | ✅ (hiding: review) |
| 6.1–6.4 | app-shell, page, auth-layout and flow-layout specs (8) | ✅ (responsive switches: owner in the catalog) |
| 7.1, 7.1a | `breakpoints.spec.ts`; `ui-rules.spec.ts`; Kbd uses `down(medium)` | ✅ |
| 7.2, 7.2a | `@angular/cdk ~22.2.6`; `overlays.scss` in the catalog build (CDK CSS in `vendor`) | ✅ |
| 7.3, 7.4 | `ui-text.spec.ts` | ✅ |
| 7.5 | `icon.spec.ts` | ✅ |
| 8.1, 8.1a, 8.2 | `app.routes.spec.ts` (8) | ✅ |
| 8.3 | catalog development and production builds | ✅ |
| 9.1–9.3 | one spec file per component; overlay, toast and CVA tests as listed | ✅ |
| 9.4 | per-task checks; no e2e, dev server or browser | ✅ |
| 9.5 | one PR | ✅ (on push) |
| 9.6 | ARCHITECTURE §5, §7, §8 updated | ✅ |

**For the owner's manual review in the catalog** (`preview.html` and `npx nx serve ui-catalog`):
- look, focus rings and hover states;
- the responsive switches at 820px (rail vs top bar and tabs, dialog vs sheet, auth brand panel) and at 1100px (page aside);
- RTL mirroring (chevrons, back arrow, segmented arrows, month switcher);
- the sheet handle and stacked footer;
- toast stacking above the bottom tabs on phones.
