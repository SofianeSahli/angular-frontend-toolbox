# 009 — Mobile-first redesign: Tasks

> Status: Implemented, verification left to CI and the owner
> Design: [design.md](./design.md)

Order: toolbox → data → stores → parts → pages → wiring/routes → i18n → docs. Verification of every task: left to CI and the owner.

- [x] **T1** — Toolbox: `ui-amount-keypad` with `pressKeypadKey`, `UiText` keypad strings
  - Fulfils: REQ-14.2, 15.2, 15.4
  - Files: `shared/ui/molecules/src/lib/amount-keypad/*`, `shared/ui/tokens/src/lib/ui-text.ts`
  - Verify: `amount-keypad.spec.ts` (keys, decimals, separator, max digits, physical keys, names). Verification: left to CI and the owner.
- [x] **T2** — Toolbox: `ui-month-strip`
  - Fulfils: REQ-14.3, 15.2
  - Files: `shared/ui/molecules/src/lib/month-strip/*`
  - Verify: `month-strip.spec.ts` (aria-current, status text, arrows mirrored in RTL, Enter selects).
- [x] **T3** — Toolbox: `ui-save-bar` and the app shell dock offset
  - Fulfils: REQ-14.4, 15.3
  - Files: `shared/ui/molecules/src/lib/save-bar/*`, `shared/ui/templates/src/lib/app-shell/app-shell.scss`
  - Verify: `save-bar.spec.ts` (status text, actions, busy, scroll padding set and removed).
- [x] **T4** — Toolbox: `UiDrawer` (CDK dialog, start edge, history, direction) and overlay styles
  - Fulfils: REQ-14.1, 1.9, 15.3
  - Files: `shared/ui/organisms/src/lib/drawer/*`, `shared/ui/organisms/src/styles/overlays.scss`
  - Verify: `drawer.spec.ts` (accessible name, Escape, `closed` after the history pop, popstate closes).
- [x] **T5** — Catalog states for keypad, strip, save bar, drawer and the raised tab action
  - Fulfils: REQ-14.1–14.5
  - Files: `apps/ui-catalog/src/app/pages/{molecules,organisms}/*`
  - Verify: build by CI.
- [x] **T6** — Data: `EntriesApi.collect`, `quietReads`, `QrInvitationsApi`, `qrcode` dependency
  - Fulfils: REQ-3.3, 6.2, 7.2, 11.3, 11.4, 1.3
  - Files: `operations/data/entries-api.ts`, `ledger/quiet-reads.ts`, `households/data/qr-invitations-api.ts`, `package.json`
  - Verify: `entries-api.spec.ts`, `qr-invitations-api.spec.ts`.
- [x] **T7** — Pure support: suggestion and templates, due dates, monthly average, fixed bills, search match, day totals, strip months
  - Fulfils: REQ-3.3, 3.5, 6.2, 7.2, 7.3, 9.1, 9.7, 10.1
  - Files: `operations/support/{suggestion,search}.ts`, `operations/support/day-groups.ts`, `recurring/support/{due-dates,monthly-average}.ts`, `analysis/support/fixed-bills.ts`, `budget/support/strip-months.ts`
  - Verify: one spec per file.
- [x] **T8** — Stores: `DashboardStore` (today list, no charts), `AnalysisStore` + `provideAnalysis`, `OperationsStore.loadAll`, `BudgetStore` plans and rules, `EntryHistory`
  - Fulfils: REQ-2.2, 2.3, 3.6, 6.1–6.3, 7.2, 9.2, 9.7
  - Verify: updated and new store specs.
- [x] **T9** — Shell: top bar, `NavDrawer`, `DrawerHints`, tabs, rail, routes and redirects
  - Fulfils: REQ-1.1–1.9, 15.7
  - Files: `shell/*`, `app.routes.ts`, `app.config.ts`
  - Verify: `signed-in-shell.spec.ts`, `nav-drawer.spec.ts`, `drawer-hints.spec.ts`, `app.routes.spec.ts`.
- [x] **T10** — Accueil and Analyse du mois pages (cards moved, pace without fixed bills)
  - Fulfils: REQ-2.1–2.4, 6.1–6.3
  - Verify: `dashboard-page.spec.ts`, `analysis-page.spec.ts`, `pace-card.spec.ts`.
- [x] **T11** — Add and edit sheet: mode switch, `AmountPad`, suggestion, templates, chips, recurring save, edit meta and delete in body
  - Fulfils: REQ-3.1–3.9, 4.1–4.3, 5.1, 5.2, 15.4
  - Verify: `entry-sheet.spec.ts`, `amount-pad.spec.ts`.
- [x] **T12** — Opérations page: month totals, search, chips, day totals, rows
  - Fulfils: REQ-7.1–7.4
  - Verify: `operations-page.spec.ts`, `entry-row.spec.ts`.
- [x] **T13** — Budget page: strip, summary card, rows and `AmountSheet`, save bar, empty state, known rules
  - Fulfils: REQ-9.1–9.7
  - Verify: `budget-page.spec.ts`, `amount-sheet.spec.ts`, `budget-draft.spec.ts`.
- [x] **T14** — Récurrentes page and edit-only rule sheet
  - Fulfils: REQ-10.1–10.4
  - Verify: `recurring-page.spec.ts`, `rule-sheet.spec.ts`.
- [x] **T15** — Foyer page, invite sheet with QR, join page
  - Fulfils: REQ-11.1–11.4
  - Verify: `household.page.spec.ts`, `invite-sheet.spec.ts`, `join.page.spec.ts`.
- [x] **T16** — Identity: account preferences, shared code step, two-step forgot password, first-run last step
  - Fulfils: REQ-12.1, 13.1–13.5
  - Verify: identity page specs, `book-new.page.spec.ts`.
- [x] **T17** — Translations fr/en/ar for every new key; docs (`specs/README.md`, `docs/ROADMAP.md`)
  - Fulfils: REQ-15.1, 15.2
  - Verify: key parity check by script.

## Deviations from spec
Recorded on 2026-11-25. The owner asked to go from the approved requirements to code without stopping at the design and tasks gates.
- **Budget month statuses** live in a small `BudgetPlans` service (`budget/data/budget-plans.ts`) instead of `BudgetStore.plans`. The rules for « Déjà connu » are read by the budget page. This keeps the spec 008 store and its tests unchanged.
- **One code layout (REQ-13.3):** the e-mail code and two-step pages already use the same layout (title, lead, `ui-code-input`, resend row), so no shared part was extracted.
- **Google link state (REQ-12.1):** the account API returns no Google link field, so the row is left out until it does.
- **`IDENTITY_PREFERENCES`** lives in `@shared/identity-data-access`, not in `feature-auth`. The app imports it statically, and a static import of the lazily loaded `feature-auth` library breaks the Nx boundary rule.
- **Budget overview and totals parts** (`budget-overview`, `budget-totals`) are deleted. `BudgetSummary` and the income and saving rows replace them.
- **Member removal** now sits in an options menu per member (écran 12). Inviting moves into `InviteSheet`.
- **New dependency:** `qrcode` plus `@types/qrcode`. The app's `allowedCommonJsDependencies` lists it.
- **Add action on drawer-only pages:** the raised « + » and the rail button now work on any page with a selected book, not only book-bound ones (REQ-1.6 lists « + » among the tabs).

## Verification report
Tests were written for each task. They were not run here (project rule); CI and the owner run lint, tests and builds.
| REQ | Verified how | Result |
|---|---|---|
| 1.1–1.9 | `signed-in-shell.spec`, `nav-drawer.spec`, `drawer.spec`, `app.routes.spec` | left to CI |
| 2.1–2.4 | `dashboard.store.spec`, `dashboard-page.spec`, `recent-card.spec` | left to CI |
| 3.1–3.9, 4.1–4.3, 5.1–5.2 | `entry-sheet.spec`, `amount-pad.spec`, `suggestion.spec`, `entry-history.spec`, `entry-sheet.service.spec` | left to CI |
| 6.1–6.3 | `analysis.store.spec`, `analysis-page.spec`, `pace-card.spec`, `fixed-bills.spec` | left to CI |
| 7.1–7.4 | `operations-page.spec`, `operations-filters.spec`, `search.spec`, `day-groups.spec`, `operations.store.spec`, `entries-api.spec` | left to CI |
| 8.1 | category picker unchanged (spec 007 tests) | left to CI |
| 9.1–9.7 | `budget-page.spec`, `plan-line-row.spec`, `budget-summary.spec`, `known-rules-card.spec`, `off-plan-list.spec`, `budget-plans.spec`, `strip-months.spec`, `budget-draft.spec`, `schedule.spec` | left to CI |
| 10.1–10.4 | `recurring-page.spec`, `rule-row.spec`, `rule-sheet.spec`, `schedule.spec` | left to CI |
| 11.1–11.4 | `household.page.spec`, `invite-sheet.spec`, `qr-code.spec`, `join.page.spec`, `qr-invitations-api.spec` | left to CI |
| 12.1 | `account.page.spec` | left to CI |
| 13.1–13.5 | `forgot-password.page.spec`, `book-new.page.spec`, existing identity specs | left to CI |
| 14.1–14.5 | `amount-keypad.spec`, `month-strip.spec`, `save-bar.spec`, `drawer.spec`, `bottom-tabs.spec`, catalog | left to CI |
| 15.1–15.7 | fr/en/ar key parity checked by script (0 missing); RTL and reduced-motion styles reviewed; routes in `app.routes.spec` | left to CI and a manual check by the owner |
