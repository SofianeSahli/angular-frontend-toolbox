# 003 — Atoms and catalog: Tasks

> Status: Draft (2026-11-22)
> Design: [design.md](./design.md) (approved 2026-11-22)

Each task ends with the checks in CLAUDE.md "Testing rules":
- `nx affected -t lint`;
- `nx affected -t test`;
- the development build of each affected app (`expenses-management`, and `ui-catalog` once it exists).

No e2e, no dev server, no browser. App tests run from PowerShell (see CLAUDE.md "Windows").

Order: tokens and rules → dependencies and scaffold → atoms (lowest first) → catalog → docs.

- [ ] **T1** — `ui-tokens` additions
  - Fulfils: REQ-5.1, REQ-8.1, REQ-8.4, REQ-8.5, REQ-7.2 (service part)
  - Files:
    - `shared/ui/tokens/contract.json` and the regenerated `defaults.generated.css`: border widths;
    - `src/lib/ui-text.ts`: `UI_TEXT`, `provideUiText`;
    - `src/lib/ui-theme.service.ts`: `accent`, `setAccent`;
    - `src/styles/_bootstrap-map.scss`: radius;
    - specs.
  - Verify: `compile.spec.ts` (contract defaults list), `ui-text.spec.ts`, `ui-theme.service.spec.ts` (accent set, unknown accent refused); `check-tokens` passes; the compiler and the theme format are unchanged (REQ-8.4).
- [ ] **T2** — Stylelint plugin rules
  - Fulfils: REQ-8.2, REQ-8.3, REQ-9.3 (rules)
  - Files: `shared/ui/tokens/stylelint/ui-rules.mjs`, `ui-rules.spec.ts`, `shared/ui/tokens/vite.config.mts` (include), `stylelint.config.mjs` (load the rules, drop the replaced length rules)
  - Verify: `ui-rules.spec.ts`:
    - allowed: a `--ui-switch-*` raw length in `switch.scss`; `0`; `%`; a `@media` width;
    - refused: a raw length in a non-custom property, in `--ui-button-*` inside `switch.scss`, and in a semantic token;
    - `color-mix()`: tokens, `currentColor` and `transparent` allowed; a hex or named colour refused.

    `nx run-many -t lint` stays at 0 errors.
- [ ] **T3** — Dependencies and the `ui-atoms` scaffold
  - Fulfils: REQ-1.1, REQ-9.1
  - Files:
    - `package.json` and `package-lock.json` (regenerated in a clean folder): `@angular/forms`, `@testing-library/angular`, `@testing-library/user-event`, `@testing-library/dom`;
    - `shared/ui/atoms/**` (project, configs, barrel, `styles/_focus-ring.scss`);
    - `tsconfig.base.json`.
  - Verify: `npm ci --dry-run` in a clean folder; `nx lint ui-atoms`; `nx test ui-atoms` with one smoke spec.
- [ ] **T4** — Icon (registry, Lucide starter set, licence), Spinner and Skeleton
  - Fulfils: REQ-4.1–4.5, REQ-4.13, REQ-6.3, REQ-1.8
  - Files: `shared/ui/atoms/src/lib/icon/**`, `src/lib/spinner/**`
  - Verify: `icon.spec.ts` (render, sizes, `aria-hidden` vs `label`, tile, unknown name reported, `provideIcons` override, directional class); `spinner.spec.ts` (role status, default label from `UI_TEXT`, override; skeleton hidden). A built CSS check confirms `@layer ui` survives encapsulation (design risk 2).
- [ ] **T5** — Button, Chip, Keyboard hint
  - Fulfils: REQ-2.1–2.6, REQ-1.7
  - Files: `src/lib/button/**`, `src/lib/chip/**`, `src/lib/kbd/**`
  - Verify: `button.spec.ts`:
    - variants and sizes;
    - disabled button and anchor;
    - `loading` blocks click and Enter/Space, sets `aria-busy` and keeps the label;
    - icon-only without a name reported.

    `chip.spec.ts`: `aria-pressed` toggles; count shows; disabled. `kbd.spec.ts`: on-accent class.
- [ ] **T6** — Input, Select, Label, Field message
  - Fulfils: REQ-3.1–3.4, REQ-3.7, REQ-3.8, REQ-1.3
  - Files: `src/lib/input/**`, `src/lib/select/**`, `src/lib/label/**`, `src/lib/field-message/**`
  - Verify:
    - first, a component on `input` builds and renders (design risk 1);
    - `input.spec.ts`: reactive-form binding, disabled, `aria-invalid`;
    - `select.spec.ts`: form binding, disabled;
    - `label.spec.ts`: optional text from `UI_TEXT`, required asterisk hidden;
    - `field-message.spec.ts`: error icon, tone.
- [ ] **T7** — Checkbox, Radio, Switch, Check row
  - Fulfils: REQ-3.5, REQ-3.6, REQ-3.9, REQ-6.2
  - Files: `src/lib/checkbox/**`, `src/lib/radio/**`, `src/lib/switch/**`, `src/lib/check-row/**`
  - Verify:
    - `checkbox.spec.ts`: on, off, indeterminate, disabled, Space toggles, form binding;
    - `radio.spec.ts`: one checked in a group, arrow keys move;
    - `switch.spec.ts`: `role=switch`, Space toggles;
    - `check-row.spec.ts`: the label names the control.
- [ ] **T8** — Badge, Avatar, Amount, Progress
  - Fulfils: REQ-4.6–4.12
  - Files: `src/lib/badge/**`, `src/lib/avatar/**`, `src/lib/amount/**`, `src/lib/progress/**`, `shared/util/format/src/lib/money.ts` (+ spec): `formatSignedMillimesHeadline`
  - Verify:
    - `badge.spec.ts`: tones;
    - `avatar.spec.ts`: initial, photo, photo error → initial, decorative, member colour;
    - `amount.spec.ts`: full/rounded × neutral/income, hero unit, non-integer → empty and reported;
    - `progress.spec.ts`: ARIA values, over 100% → full bar with the real value, tones;
    - `money.spec.ts`: the new function.
- [ ] **T9** — `apps/ui-catalog`
  - Fulfils: REQ-7.1–7.5, REQ-1.9
  - Files: `apps/ui-catalog/**`
  - Verify: `catalog.page.spec.ts` (sections render; theme, accent and direction switches); lint; development and production builds within the budgets.
- [ ] **T10** — Docs and report
  - Fulfils: REQ-6.4, REQ-9.4
  - Files: `docs/ARCHITECTURE.md` §5, `CLAUDE.md`, `README.md`, this file
  - Verify: `npm run ci` passes; verification report filled in.

## Deviations from spec
(Recorded during implementation.)

## Verification report
| REQ | Verified how | Result |
|---|---|---|
