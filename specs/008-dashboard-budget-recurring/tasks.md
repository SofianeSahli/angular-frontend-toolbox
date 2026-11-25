# 008 — Dashboard, budget and recurring operations: Tasks

> Status: Draft — awaiting approval
> Design: [design.md](./design.md)

Order: toolbox → data access → stores → pages → shell and navigation → docs. Each task is about 100 lines of diff (i18n JSON and catalog states aside), tests written first. Verification of every task: left to CI and the owner (no tests, lint, build, serve or browser run by Claude). One commit per task at most; push once at the end. Task 0 is a gate: do not start while the backend 008 contract is still a draft that may change.

- [ ] **T0** — Gate: confirm the backend `008-budget/contract.md` is approved and unchanged since this spec; otherwise update the spec first
  - Fulfils: Scope note
  - Verification: left to CI and the owner

### Toolbox
- [ ] **T1** — `parseMajor` option `allowZero`
  - Fulfils: REQ-7.3
  - Files: `shared/util/format/src/lib/money.ts` + spec (`"0"` with and without the option, `"0,000"`, other reasons unchanged)
  - Verification: left to CI and the owner
- [ ] **T2** — `ui-meter`
  - Fulfils: REQ-7.1
  - Files: `shared/ui/molecules/src/lib/meter/{meter.ts,meter.scss,meter.spec.ts}`, index export, icons `triangle-alert`/`circle-alert` in the registry if missing
  - Verify: `role=meter` and ARIA values, fill capped at 100 %, `max = 0`, `over` icon and stripes class, RTL start edge (class check)
  - Verification: left to CI and the owner
- [ ] **T3** — `ui-bar-list`
  - Fulfils: REQ-7.2
  - Files: `shared/ui/molecules/src/lib/bar-list/{bar-list.ts,bar-list.scss,bar-list.spec.ts}`, index export
  - Verify: order kept, widths scaled to the largest, clickable rows are buttons and emit `itemSelect`, empty text
  - Verification: left to CI and the owner
- [ ] **T4** — Catalog states for both molecules
  - Fulfils: REQ-7.4
  - Files: `apps/ui-catalog/src/app/…` (molecules route)
  - Verification: left to CI and the owner

### Data access
- [ ] **T5** — Budget models, mappers, `BudgetApi` (`get`, `save`, `copy`)
  - Fulfils: REQ-5.6, 5.7, 5.9 (contract part), REQ-8.10
  - Files: `app/budget/data/{models,mappers,budget-api}.ts` + specs
  - Verify: `HttpTestingController` (paths, snake_case body, `has_plan: false` nulls, `handling` codes incl. both `409`s)
  - Verification: left to CI and the owner
- [ ] **T6** — Summary models, mappers, `SummaryApi` (month and range)
  - Fulfils: REQ-3.3, 3.4, 4.2 (calls)
  - Files: `app/dashboard/data/{models,mappers,summary-api}.ts` + specs
  - Verification: left to CI and the owner
- [ ] **T7** — Recurring models, mappers, `RecurringApi` (paginated list, create, update, remove), `rule-draft` (request and PATCH diff)
  - Fulfils: REQ-6.1, 6.3, 6.5
  - Files: `app/recurring/data/{models,mappers,recurring-api,rule-draft}.ts` + specs
  - Verify: paths, `ends_on: null`, diff cases, handled codes
  - Verification: left to CI and the owner
- [ ] **T8** — Dashboard support functions
  - Fulfils: REQ-1.1, 2.1, 2.2, 3.2, 3.3, 3.5, 4.2, 8.6
  - Files: `app/dashboard/support/{month-context,watch-list,top-categories,same-day,whole-units}.ts` + specs (31 March, 29 February, `null` percent order, remainder row, floor to `0`, `mois` clamp, exponent 0/2/3)
  - Verification: left to CI and the owner

### Stores
- [ ] **T9** — `LedgerChanges`; `OperationsStore` calls it after create, update (both months), remove
  - Fulfils: REQ-8.3
  - Files: `app/ledger/ledger-changes.ts`, `app/operations/data/operations.store.ts` + specs
  - Verification: left to CI and the owner
- [ ] **T10** — `BudgetStore`, `BudgetDraft`, `provideBudget`
  - Fulfils: REQ-5.2–5.6, 5.9, 5.10, 8.2, 8.4
  - Verify: stale generation dropped, save keeps the draft on error, copy `409` results, overlap checks, local totals, reset on account change, `budgetChanged`
  - Verification: left to CI and the owner
- [ ] **T11** — `RecurringStore`, `provideRecurring`
  - Fulfils: REQ-6.1, 6.5, 6.6, 6.9, 8.2, 8.4
  - Verify: create reloads and signals `LedgerChanges`, `recurring_rule.not_found` drops the row, limit code, reset
  - Verification: left to CI and the owner
- [ ] **T12** — `DashboardStore`, `provideDashboard`
  - Fulfils: REQ-3.7, 3.8, 4.1, 4.3, 4.4, 8.2–8.5
  - Verify: one card failing leaves the others, comparison only without plan, previous-month failure silent, `firstUse`, refetch on `LedgerChanges` for the shown month only, stale dropped, book switch
  - Verification: left to CI and the owner

### Pages
- [ ] **T13** — Category picker `plan` mode
  - Fulfils: REQ-5.3
  - Files: `app/categories/parts/category-picker.{ts,html}` + spec (expense tops and groups only, retired and overlapping hidden, leaves never)
  - Verification: left to CI and the owner
- [ ] **T14** — Dashboard hero, no-plan and first-use cards
  - Fulfils: REQ-2.1–2.5, 4.1–4.4, 3.1
  - Files: `app/dashboard/parts/{hero-card,no-plan-card,first-use-card}.ts` + specs
  - Verification: left to CI and the owner
- [ ] **T15** — Dashboard watch list, categories, members, upcoming and recent cards
  - Fulfils: REQ-3.2–3.7
  - Files: `app/dashboard/parts/{watch-list-card,categories-card,members-card,upcoming-card,recent-card}.ts` + specs (loading, error with retry, empty per card)
  - Verification: left to CI and the owner
- [ ] **T16** — `DashboardPage` and `?mois` handling; delete `BookHome`
  - Fulfils: REQ-1.1–1.4, 3.8, 8.9
  - Files: `app/dashboard/pages/dashboard-page.*`, remove `app/home/`
  - Verification: left to CI and the owner
- [ ] **T17** — Budget parts (`PlanLineRow`, totals, off-plan row) and `budget-errors`
  - Fulfils: REQ-5.2, 5.4, 5.5, 5.7
  - Files: `app/budget/parts/*`, `app/budget/support/budget-errors.ts` + specs
  - Verification: left to CI and the owner
- [ ] **T18** — `BudgetPage`: month, income, saving, lines, save, copy with confirmations, unsaved guard
  - Fulfils: REQ-5.1, 5.6–5.9, 5.11, 8.5
  - Files: `app/budget/pages/budget-page.*` + spec
  - Verification: left to CI and the owner
- [ ] **T19** — Recurring `RuleSheet`, `rule-errors`, `frequency-text`
  - Fulfils: REQ-6.3–6.5, 6.8
  - Files: `app/recurring/parts/rule-sheet.*`, `app/recurring/support/*` + specs (past-start warning, every field code, "Other" name, big amount)
  - Verification: left to CI and the owner
- [ ] **T20** — `RecurringPage` (list, add, edit, delete with `UiConfirm`)
  - Fulfils: REQ-6.1, 6.2, 6.6, 8.5
  - Files: `app/recurring/pages/recurring-page.*`, `app/recurring/parts/rule-row.ts` + specs
  - Verification: left to CI and the owner
- [ ] **T21** — "Récurrent" badge in `EntryRow`, entry sheet header; operations page reads `?mois`/`?categorie` and gets the "Récurrentes" link
  - Fulfils: REQ-6.7, 6.9, 1.3
  - Files: `app/operations/parts/{entry-row,entry-sheet}.*`, `app/operations/pages/operations-page.*` + specs
  - Verification: left to CI and the owner

### Shell and navigation
- [ ] **T22** — Routes, `PATHS`, "Budget" rail destination (icon `wallet`), title keys, `provide*` in `app.config.ts`
  - Fulfils: REQ-8.1, 8.4
  - Files: `app/app.routes.ts`, `app/app.config.ts`, `app/shell/*`, `app/app.routes.spec.ts` (order: `/operations/recurrentes` before `/operations`)
  - Verification: left to CI and the owner
- [ ] **T23** — i18n: `dashboard.*`, `budget.*`, `recurring.*`, picker and shell keys in `public/i18n/{fr,en,ar}.json` (Arabic draft, `meta.reviewStatus`)
  - Fulfils: REQ-8.8
  - Verify: `translation-files.spec.ts` (same keys in the three files)
  - Verification: left to CI and the owner

### Docs
- [ ] **T24** — `specs/README.md` 008 entry, `docs/ROADMAP.md` item 8 done, status of the three spec files
  - Fulfils: workflow
  - Verification: left to CI and the owner

## Deviations from spec
(none yet)

## Verification report
| REQ | Verified how | Result |
|---|---|---|
| all | left to CI and the owner | — |
