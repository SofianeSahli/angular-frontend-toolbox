# 003 — Atoms and catalog: Tasks

> Status: Done, in review (2026-11-22)
> Design: [design.md](./design.md) (approved 2026-11-22)

Each task ends with the checks in CLAUDE.md "Testing rules":
- `nx affected -t lint`;
- `nx affected -t test`;
- the development build of each affected app (`expenses-management`, and `ui-catalog` once it exists).

No e2e, no dev server, no browser. App tests run from PowerShell (see CLAUDE.md "Windows").

Order: tokens and rules → dependencies and scaffold → atoms (lowest first) → catalog → docs.

- [x] **T1** — `ui-tokens` additions
  - Fulfils: REQ-5.1, REQ-8.1, REQ-8.4, REQ-8.5, REQ-7.2 (service part)
  - Verify: `compile.spec.ts` (contract defaults include both border widths), `ui-text.spec.ts` (2), `provide-ui.spec.ts` (runtime accent, unknown accent refused); `check-tokens` ✅; `expenses-management` development build ✅. The compiler and the theme format are unchanged.
- [x] **T2** — Stylelint plugin rules
  - Fulfils: REQ-8.2, REQ-8.3, REQ-9.3 (rules)
  - Verify: `ui-rules.spec.ts` (7 tests: allowed and refused samples for both rules) ✅; `nx run-many -t lint` 0 errors ✅
- [x] **T3** — Dependencies and the `ui-atoms` scaffold
  - Fulfils: REQ-1.1, REQ-9.1
  - Verify: lockfile regenerated in a clean folder, `npm ci --dry-run` clean, then `npm ci` ✅; `nx lint ui-atoms` ✅. The smoke spec is the T4 icon spec.
- [x] **T4** — Icon (registry, Lucide starter set, licence), Spinner and Skeleton
  - Fulfils: REQ-4.1–4.5, REQ-4.13, REQ-6.3, REQ-1.8
  - Verify: `icon.spec.ts` (8), `spinner.spec.ts` (5) ✅. Angular's style scoping keeps `@layer ui` (checked with `encapsulateStyle`, and 18 `@layer ui` blocks in the catalog's production bundle), so design risk 2 is cleared.
- [x] **T5** — Button, Chip, Keyboard hint
  - Fulfils: REQ-2.1–2.6, REQ-1.7
  - Verify: `button.spec.ts` (11), `chip.spec.ts` (3), `kbd.spec.ts` (1) ✅
- [x] **T6** — Input, Select, Label, Field message
  - Fulfils: REQ-3.1–3.4, REQ-3.7, REQ-3.8, REQ-1.3
  - Verify: a component on `input` renders and binds to forms, so design risk 1 is cleared; `input.spec.ts` (4), `select.spec.ts` (2), `label.spec.ts` (3), `field-message.spec.ts` (2) ✅
- [x] **T7** — Checkbox, Radio, Switch, Check row
  - Fulfils: REQ-3.5, REQ-3.6, REQ-3.9, REQ-6.2
  - Verify: `checkbox.spec.ts` (3), `radio.spec.ts` (2, including arrow keys), `switch.spec.ts` (2), `check-row.spec.ts` (1) ✅
- [x] **T8** — Badge, Avatar, Amount, Progress
  - Fulfils: REQ-4.6–4.12
  - Verify: `badge.spec.ts` (5), `avatar.spec.ts` (6), `amount.spec.ts` (8), `progress.spec.ts` (3), `money.spec.ts` (+4 for `formatSignedMillimesHeadline`) ✅
- [x] **T9** — `apps/ui-catalog`
  - Fulfils: REQ-7.1–7.5, REQ-1.9
  - Verify: `catalog.page.spec.ts` (4) ✅; lint ✅; development build ✅; production build ✅ (initial 422.18 kB, within 500 kB / 1 MB)
- [x] **T10** — Docs and report
  - Fulfils: REQ-6.4, REQ-9.4
  - Verify: `npm run ci` ✅ (see below)

## Deviations from spec
- **T2 (REQ-8.3):** a `color-mix()` argument may also use a `var(--ui-*)` token as its percentage (`currentColor var(--ui-icon-tile-tint)`), so the tint is itself a component token.
- **T2 (REQ-8.2):** the new length rule replaces spec 002's unit allow-lists and its "1px hairline" exception. Borders use `--ui-border-width-thin/thick` instead.
- **T4 (REQ-4.2):**
  - Lucide 1.77 renamed `trash-2` to `trash` and `circle-alert` to `circle-exclamation-point`. The starter set uses Lucide's current names.
  - Icons read an inherited `--ui-icon-size` (falling back to `--ui-icon-default-size`), so a button sizes the icons placed inside it.
- **T5, T6 (accessible names):** Chip and Label put a preserved space (`&ngsp;`) before the count or the optional text, so the accessible name reads "Dépenses 24" and "Note (facultatif)".
- **T5 (REQ-2.4):** a disabled `a[uiButton]` also gets `tabindex="-1"`, so it leaves the tab order.
- **T3:** `shared/ui/atoms` sets `server: { watch: null }` in `vite.config.mts`, like `ui-tokens` and `util-format` (CLAUDE.md "Known issues").
- **T9:** the catalog has no router: it is one page, so the design's `provideRouter([])` is not needed. The toolbar handlers read the `<select>` value from the change event, because a template reference on `select[uiSelect]` points to the component, not the element.

## Verification report
| REQ | Verified how | Result |
|---|---|---|
| 1.1 | `shared/ui/atoms`, tags `scope:shared type:ui layer:atom`; module-boundary lint passes | ✅ |
| 1.2 | selectors in each atom; specs query the native roles (button, link, textbox, combobox, checkbox, radio, switch) | ✅ |
| 1.3 | input, select, checkbox, radio and switch specs bind `FormControl`s directly; catalog form spec | ✅ |
| 1.4 | atoms use `input()` only, OnPush (lint), no store, HTTP, router or translation import | ✅ |
| 1.5 | every atom style is in `@layer ui`, declares its `--ui-<atom>-*` tokens, and passes Stylelint with 0 errors | ✅ |
| 1.6 | transitions use `--ui-duration-*` (Stylelint refuses raw lengths, and durations are not lengths, so checked by review) | ✅ (review) |
| 1.7 | `_focus-ring.scss` included by every interactive atom | ✅ (review; visual by owner) |
| 1.8 | spinner and skeleton `@media (prefers-reduced-motion)` blocks; duration tokens are `0ms` there (spec 002) | ✅ (review; visual by owner) |
| 1.9 | catalog switches theme and accent with no atom change (catalog spec) | ✅ |
| 2.1–2.5 | `button.spec.ts`, `chip.spec.ts` | ✅ |
| 2.6 | `kbd.spec.ts` (on-accent); hidden below 768px by a CSS media query | ✅ (hiding: review) |
| 3.1–3.9 | input, select, label, field-message, checkbox, radio, switch and check-row specs | ✅ (styles: visual by owner) |
| 4.1–4.5 | `icon.spec.ts` | ✅ |
| 4.6 | `badge.spec.ts` | ✅ |
| 4.7, 4.8 | `avatar.spec.ts` | ✅ |
| 4.9, 4.10 | `amount.spec.ts`; `money.spec.ts` | ✅ |
| 4.11, 4.12 | `progress.spec.ts` | ✅ |
| 4.13 | `spinner.spec.ts` | ✅ |
| 5.1 | `ui-text.spec.ts`; spinner and label specs with `provideUiText` | ✅ |
| 5.2 | no `@ngx-translate` import in `shared/ui/atoms` | ✅ |
| 6.1 | atom styles use logical properties only (review; no `left`/`right` in `shared/ui/atoms`) | ✅ (review) |
| 6.2 | switch thumb moves with `inset-inline-start`; select chevron swapped under `:dir(rtl)` | ✅ (review; RTL check by owner in the catalog) |
| 6.3 | `icon.spec.ts` (directional class on `repeat` only); `:dir(rtl)` mirroring rule | ✅ (mirroring: owner, jsdom has no `:dir`) |
| 6.4 | ARCHITECTURE §5 RTL bullet | ✅ |
| 7.1–7.4 | `catalog.page.spec.ts`; catalog template | ✅ |
| 7.5 | `ui-catalog` development and production builds | ✅ |
| 8.1 | `contract.json`, `defaults.generated.css`, `compile.spec.ts` | ✅ |
| 8.2, 8.3 | `ui-rules.spec.ts`; Stylelint on every project | ✅ |
| 8.4 | compiler and `tokens.json` unchanged (`check-tokens` passes on the unchanged theme) | ✅ |
| 8.5 | `_bootstrap-map.scss` | ✅ |
| 9.1–9.3 | dependencies; one spec per atom (17 folders); icon, `UI_TEXT`, amount, progress and Stylelint rule tests | ✅ |
| 9.4 | per-task checks above; no e2e, dev server or browser used | ✅ |

**For the owner's manual review in the catalog:** look, focus ring, hover states, reduced motion, the keyboard hint hiding below 768px, and RTL mirroring (switch thumb, select chevron, `repeat` icon).
