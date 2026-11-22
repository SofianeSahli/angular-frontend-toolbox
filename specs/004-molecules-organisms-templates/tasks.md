# 004 — Molecules, organisms and templates: Tasks

> Status: Draft (2026-11-22)
> Design: [design.md](./design.md) (approved 2026-11-22)

Each task ends with the checks in CLAUDE.md "Testing rules":
- `nx affected -t lint`;
- `nx affected -t test`;
- the development builds of `expenses-management` and `ui-catalog`.

App tests run from PowerShell. No e2e, no dev server, no browser; `preview.html` is not opened. The whole spec ships in one PR (REQ-9.5).

Order: tokens and rules → dependencies and scaffolds → molecules → organisms → templates → catalog → docs.

- [ ] **T1** — `ui-tokens` foundations
  - Fulfils: REQ-7.1, REQ-7.3, REQ-7.4, C7
  - Files:
    - `shared/ui/tokens/src/styles/_breakpoints.scss`, and `_focus-ring.scss` moved from atoms;
    - `src/lib/breakpoints.ts`, `src/lib/ui-text.ts` (new keys including `back`, nested `errors`, deep merge, `fillUiText`), `src/lib/direction.ts` (`isRtl`);
    - the atoms' `@use` paths and `vite.config.mts` load paths, the apps' `includePaths`;
    - `kbd.scss` switched to `down(medium)`.
  - Verify: `breakpoints.spec.ts` (TS and SCSS values equal); `ui-text.spec.ts` (defaults, deep merge of `errors`, `fillUiText`); `direction.spec.ts`; atoms tests and both app builds still pass.
- [ ] **T2** — Stylelint rule update
  - Fulfils: REQ-7.1a
  - Files: `shared/ui/tokens/stylelint/ui-rules.mjs` (+ spec)
  - Verify: `ui-rules.spec.ts`:
    - `$breakpoints-medium` allowed in `_breakpoints.scss` and refused elsewhere;
    - `$other-x: 4px` refused;
    - `100dvh` in a property refused.

    `nx run-many -t lint` stays at 0 errors.
- [ ] **T3** — Icons
  - Fulfils: REQ-7.5, C8
  - Files: `shared/ui/atoms/src/lib/icon/icons/lucide-starter.ts` (+16 icons, regenerated from the pinned Lucide package; directional flags on `chevron-left`, `chevron-right` and `arrow-left`)
  - Verify: `icon.spec.ts` (every new name renders; the 3 directional ones are flagged, the others are not)
- [ ] **T4** — `@angular/cdk` and the three library scaffolds
  - Fulfils: REQ-0.1, REQ-7.2
  - Files: `package.json` and `package-lock.json` (regenerated in a clean folder); `shared/ui/{molecules,organisms,templates}/**` (project, configs, barrel); `tsconfig.base.json`
  - Verify: `npm ci --dry-run` in a clean folder; lint of the three libraries; module-boundary lint (a molecule importing an organism is refused)
- [ ] **T5** — Molecules: FormField, Alert, Stat, SectionHeader, EmptyState, Stepper
  - Fulfils: REQ-1.1–1.3, REQ-2.1, REQ-2.2, REQ-2.4, REQ-2.6, REQ-2.8
  - Verify: one spec each:
    - FormField: label linked, generated id, hint vs error, `aria-invalid` and `aria-describedby`, the counter, custom then `UI_TEXT` messages with `fillUiText`, the ltr affix;
    - Alert: tones, roles, dismiss;
    - Stat: name;
    - SectionHeader: heading levels;
    - EmptyState: title, text and action;
    - Stepper: label and decorative bars.
- [ ] **T6** — Molecules: SegmentedControl, ChipGroup, OptionCards, CodeInput (ControlValueAccessor)
  - Fulfils: REQ-0.6, REQ-1.4–1.7
  - Verify: one spec each, bound to a `FormControl` (write, change, disabled):
    - SegmentedControl: arrows, Home/End, RTL swap, disabled skipped;
    - ChipGroup: single, multiple, required single;
    - OptionCards: fieldset and legend, radio keyboard;
    - CodeInput: filtered paste, `completed`, invalid cells, LTR.
- [ ] **T7** — Molecules: List and ListItem, MonthSwitcher, SearchField, AvatarGroup
  - Fulfils: REQ-1.8, REQ-2.3, REQ-2.5, REQ-2.9
  - Verify: one spec each:
    - List: rows as list items, link and button rows;
    - MonthSwitcher: previous and next, min and max, French label, invalid month reported;
    - SearchField: debounce with fake timers, Escape and Clear;
    - AvatarGroup: "+N", accessible name with every name.
- [ ] **T8** — Molecules: Menu (CDK)
  - Fulfils: REQ-2.7
  - Verify: `menu.spec.ts`:
    - opens from the trigger;
    - items, danger and checked (`menuitemradio`);
    - arrow keys and Escape;
    - focus returns to the trigger.
- [ ] **T9** — Organisms: Dialog, ConfirmDialog, Toast, `overlays.scss`
  - Fulfils: REQ-3.1–3.5, REQ-7.2a
  - Verify:
    - `dialog.spec.ts`: dialog vs sheet by breakpoint (stubbed `matchMedia`), labelled by its title, Escape, backdrop and close button, focus return;
    - `confirm-dialog.spec.ts`: `true` and `false` paths, `alertdialog`, initial focus on Cancel for danger;
    - `toast.spec.ts` (fake timers): auto-close, pause on hover and focus, the action runs once, roles per tone, the visible limit.
- [ ] **T10** — Organisms: TopBar, SideRail, BottomTabs, FilterBar, GroupedList, Table
  - Fulfils: REQ-4.1–4.4, REQ-5.1–5.4
  - Verify: one spec each:
    - landmarks and names;
    - `aria-current` styling hook;
    - tabs and central action;
    - FilterBar slots;
    - GroupedList: groups and totals, skeletons while loading, the empty template, `endReached` with a stubbed `IntersectionObserver` (once, not while loading);
    - Table: directive classes.
- [ ] **T11** — Templates: AppShell, PageLayout, AuthLayout, FlowLayout
  - Fulfils: REQ-6.1–6.4
  - Verify: one spec each:
    - slots render; the shell has a `main` landmark and adds the toast region;
    - PageLayout: the aside switches the layout class, and the title is a heading;
    - AuthLayout: slots render;
    - FlowLayout: back and close emit and are named, the stepper shows when there are 2 or more steps, and the footer slot renders.
- [ ] **T12** — Catalog
  - Fulfils: REQ-8.1, REQ-8.1a, REQ-8.2, REQ-8.3
  - Files: `apps/ui-catalog/**` (router, `CatalogToolbar`, atoms page moved, molecules and organisms pages, 4 template routes, styles list)
  - Verify: catalog specs (every route renders; the toolbar switches work on each page; the organisms page opens a dialog and a toast); development and production builds within the budgets.
- [ ] **T13** — Docs and report
  - Fulfils: REQ-9.4, REQ-9.6
  - Files: `docs/ARCHITECTURE.md` (§2 library notes, §5 breakpoints and overlays, §7, §8), `CLAUDE.md`, `README.md`, this file
  - Verify: `nx affected -t lint test build check-tokens` vs `main` passes; verification report filled in.

## Deviations from spec
- **Design (approved with it):** `UI_TEXT.back` "Retour" is added for FlowLayout's back button.

## Verification report
| REQ | Verified how | Result |
|---|---|---|
