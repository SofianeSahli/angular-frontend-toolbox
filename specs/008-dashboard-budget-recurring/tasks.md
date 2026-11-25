# 008 — Dashboard, budget and recurring operations: Tasks

> Status: Implemented — in review
> Design: [design.md](./design.md)

Order: toolbox → data access → stores → pages → shell and navigation → docs. Each task is about 100 lines of diff (i18n JSON and catalog states aside), tests written first. Verification of every task: left to CI and the owner (no tests, lint, build, serve or browser run by Claude). One commit per task at most; push once at the end. Task 0 is a gate: do not start while the backend 008 contract is still a draft that may change.

- [x] **T0** — Gate: confirm the backend `008-budget/contract.md` is approved and unchanged since this spec; otherwise update the spec first
  - Fulfils: Scope note
  - Verification: left to CI and the owner

### Toolbox
- [x] **T1** — `parseMajor` option `allowZero`
  - Fulfils: REQ-7.3
  - Files: `shared/util/format/src/lib/money.ts` + spec (`"0"` with and without the option, `"0,000"`, other reasons unchanged)
  - Verification: left to CI and the owner
- [x] **T2** — `ui-meter`
  - Fulfils: REQ-7.1
  - Files: `shared/ui/molecules/src/lib/meter/{meter.ts,meter.scss,meter.spec.ts}`, index export, icons `triangle-alert`/`circle-alert` in the registry if missing
  - Verify: `role=meter` and ARIA values, fill capped at 100 %, `max = 0`, `over` icon and stripes class, RTL start edge (class check)
  - Verification: left to CI and the owner
- [x] **T3** — `ui-bar-list`
  - Fulfils: REQ-7.2
  - Files: `shared/ui/molecules/src/lib/bar-list/{bar-list.ts,bar-list.scss,bar-list.spec.ts}`, index export
  - Verify: order kept, widths scaled to the largest, clickable rows are buttons and emit `itemSelect`, empty text
  - Verification: left to CI and the owner
- [x] **T4** — Catalog states for both molecules
  - Fulfils: REQ-7.4
  - Files: `apps/ui-catalog/src/app/…` (molecules route)
  - Verification: left to CI and the owner

### Data access
- [x] **T5** — Budget models, mappers, `BudgetApi` (`get`, `save`, `copy`)
  - Fulfils: REQ-5.6, 5.7, 5.9 (contract part), REQ-8.10
  - Files: `app/budget/data/{models,mappers,budget-api}.ts` + specs
  - Verify: `HttpTestingController` (paths, snake_case body, `has_plan: false` nulls, `handling` codes incl. both `409`s)
  - Verification: left to CI and the owner
- [x] **T6** — Summary models, mappers, `SummaryApi` (month and range)
  - Fulfils: REQ-3.3, 3.4, 4.2 (calls)
  - Files: `app/dashboard/data/{models,mappers,summary-api}.ts` + specs
  - Verification: left to CI and the owner
- [x] **T7** — Recurring models, mappers, `RecurringApi` (paginated list, create, update, remove), `rule-draft` (request and PATCH diff)
  - Fulfils: REQ-6.1, 6.3, 6.5
  - Files: `app/recurring/data/{models,mappers,recurring-api,rule-draft}.ts` + specs
  - Verify: paths, `ends_on: null`, diff cases, handled codes
  - Verification: left to CI and the owner
- [x] **T8** — Dashboard support functions
  - Fulfils: REQ-1.1, 2.1, 2.2, 3.2, 3.3, 3.5, 4.2, 8.6
  - Files: `app/dashboard/support/{month-context,watch-list,top-categories,same-day,whole-units}.ts` + specs (31 March, 29 February, `null` percent order, remainder row, floor to `0`, `mois` clamp, exponent 0/2/3)
  - Verification: left to CI and the owner

### Stores
- [x] **T9** — `LedgerChanges`; `OperationsStore` calls it after create, update (both months), remove
  - Fulfils: REQ-8.3
  - Files: `app/ledger/ledger-changes.ts`, `app/operations/data/operations.store.ts` + specs
  - Verification: left to CI and the owner
- [x] **T10** — `BudgetStore`, `BudgetDraft`, `provideBudget`
  - Fulfils: REQ-5.2–5.6, 5.9, 5.10, 8.2, 8.4
  - Verify: stale generation dropped, save keeps the draft on error, copy `409` results, overlap checks, local totals, reset on account change, `budgetChanged`
  - Verification: left to CI and the owner
- [x] **T11** — `RecurringStore`, `provideRecurring`
  - Fulfils: REQ-6.1, 6.5, 6.6, 6.9, 8.2, 8.4
  - Verify: create reloads and signals `LedgerChanges`, `recurring_rule.not_found` drops the row, limit code, reset
  - Verification: left to CI and the owner
- [x] **T12** — `DashboardStore`, `provideDashboard`
  - Fulfils: REQ-3.7, 3.8, 4.1, 4.3, 4.4, 8.2–8.5
  - Verify: one card failing leaves the others, comparison only without plan, previous-month failure silent, `firstUse`, refetch on `LedgerChanges` for the shown month only, stale dropped, book switch
  - Verification: left to CI and the owner

### Pages
- [x] **T13** — Category picker `plan` mode
  - Fulfils: REQ-5.3
  - Files: `app/categories/parts/category-picker.{ts,html}` + spec (expense tops and groups only, retired and overlapping hidden, leaves never)
  - Verification: left to CI and the owner
- [x] **T14** — Dashboard hero, no-plan and first-use cards
  - Fulfils: REQ-2.1–2.5, 4.1–4.4, 3.1
  - Files: `app/dashboard/parts/{hero-card,no-plan-card,first-use-card}.ts` + specs
  - Verification: left to CI and the owner
- [x] **T15** — Dashboard watch list, categories, members, upcoming and recent cards
  - Fulfils: REQ-3.2–3.7
  - Files: `app/dashboard/parts/{watch-list-card,categories-card,members-card,upcoming-card,recent-card}.ts` + specs (loading, error with retry, empty per card)
  - Verification: left to CI and the owner
- [x] **T16** — `DashboardPage` and `?mois` handling; delete `BookHome`
  - Fulfils: REQ-1.1–1.4, 3.8, 8.9
  - Files: `app/dashboard/pages/dashboard-page.*`, remove `app/home/`
  - Verification: left to CI and the owner
- [x] **T17** — Budget parts (`PlanLineRow`, totals, off-plan row) and `budget-errors`
  - Fulfils: REQ-5.2, 5.4, 5.5, 5.7
  - Files: `app/budget/parts/*`, `app/budget/support/budget-errors.ts` + specs
  - Verification: left to CI and the owner
- [x] **T18** — `BudgetPage`: month, income, saving, lines, save, copy with confirmations, unsaved guard
  - Fulfils: REQ-5.1, 5.6–5.9, 5.11, 8.5
  - Files: `app/budget/pages/budget-page.*` + spec
  - Verification: left to CI and the owner
- [x] **T19** — Recurring `RuleSheet`, `rule-errors`, `frequency-text`
  - Fulfils: REQ-6.3–6.5, 6.8
  - Files: `app/recurring/parts/rule-sheet.*`, `app/recurring/support/*` + specs (past-start warning, every field code, "Other" name, big amount)
  - Verification: left to CI and the owner
- [x] **T20** — `RecurringPage` (list, add, edit, delete with `UiConfirm`)
  - Fulfils: REQ-6.1, 6.2, 6.6, 8.5
  - Files: `app/recurring/pages/recurring-page.*`, `app/recurring/parts/rule-row.ts` + specs
  - Verification: left to CI and the owner
- [x] **T21** — "Récurrent" badge in `EntryRow`, entry sheet header; operations page reads `?mois`/`?categorie` and gets the "Récurrentes" link
  - Fulfils: REQ-6.7, 6.9, 1.3
  - Files: `app/operations/parts/{entry-row,entry-sheet}.*`, `app/operations/pages/operations-page.*` + specs
  - Verification: left to CI and the owner

### Shell and navigation
- [x] **T22** — Routes, `PATHS`, "Budget" rail destination (icon `wallet`), title keys, `provide*` in `app.config.ts`
  - Fulfils: REQ-8.1, 8.4
  - Files: `app/app.routes.ts`, `app/app.config.ts`, `app/shell/*`, `app/app.routes.spec.ts` (order: `/operations/recurrentes` before `/operations`)
  - Verification: left to CI and the owner
- [x] **T23** — i18n: `dashboard.*`, `budget.*`, `recurring.*`, picker and shell keys in `public/i18n/{fr,en,ar}.json` (Arabic draft, `meta.reviewStatus`)
  - Fulfils: REQ-8.8
  - Verify: `translation-files.spec.ts` (same keys in the three files)
  - Verification: left to CI and the owner

### Docs
- [x] **T24** — `specs/README.md` 008 entry, `docs/ROADMAP.md` item 8 done, status of the three spec files
  - Fulfils: workflow
  - Verification: left to CI and the owner

### Charts (amendment)
Each task is under about 200 lines of diff, tests first. Verification of every task: left to CI and the owner.

- [x] **T25** — Pace geometry (pure functions)
  - Fulfils: REQ-9.1, 9.2
  - Files: `shared/ui/molecules/src/lib/pace-chart/pace-geometry.ts` + spec (scale, cut at `today`, flat all-zero month, `paceState` thresholds, over segment)
- [x] **T26** — `ui-pace-chart`
  - Fulfils: REQ-9.1, 9.2, 9.4
  - Files: `shared/ui/molecules/src/lib/pace-chart/{pace-chart.ts,pace-chart.scss,pace-chart.spec.ts}`
  - Verify: `role=img` and `aria-label`, hidden table rows, marker only with `today`, target and reference paths only when given, state class, dashed over segment
- [x] **T27** — `ui-trend-bars`
  - Fulfils: REQ-9.3, 9.4
  - Files: `shared/ui/molecules/src/lib/trend-bars/{trend-bars.ts,trend-bars.scss,trend-bars.spec.ts}`
  - Verify: one button per item, current highlighted, `itemSelect` on click, Enter and Space, value text on bars, average text, hidden table
- [x] **T28** — Exports and catalog states (empty, normal, over target, RTL)
  - Fulfils: REQ-9.5
  - Files: `shared/ui/molecules/src/index.ts`, `apps/ui-catalog/src/app/pages/molecules/molecules.page.{ts,html}`
- [x] **T29** — `Summary` keeps `days` and `months`
  - Fulfils: REQ-9.6
  - Files: `app/dashboard/data/{models,mappers}.ts`, `app/dashboard/testing.ts`, `summary-api.spec.ts` (the `not.toHaveProperty('days')` check becomes a mapping check)
- [x] **T30** — Dashboard series support
  - Fulfils: REQ-9.7, 9.8
  - Files: `app/dashboard/support/{pace-series,trend-series}.ts` + specs (cumulative with gaps, current/past/future month, previous month shorter or longer, six months with zeros, average without empty months, year boundary)
- [x] **T31** — `DashboardStore`: `previous` and `trend` cards
  - Fulfils: REQ-9.11
  - Files: `app/dashboard/data/dashboard.store.ts` + spec (parallel start, each failure leaves budget, summary and the other card ready, stale dropped, `reload`, refresh on `LedgerChanges`, book switch)
- [x] **T32** — `PaceCard`
  - Fulfils: REQ-9.7
  - Files: `app/dashboard/parts/pace-card.ts` + spec (target with plan, reference without plan, no reference when previous failed, `today` only current month, future and empty month, fixed-bills note)
- [x] **T33** — `TrendCard`
  - Fulfils: REQ-9.8
  - Files: `app/dashboard/parts/trend-card.ts` + spec (six bars, zero months, average, selecting a bar navigates to `/?mois=…`)
- [x] **T34** — Categories card and recent card polish
  - Fulfils: REQ-9.9, 9.10 (heading)
  - Files: `app/dashboard/parts/{categories-card,recent-card}.ts`, `dashboard-card.scss` + specs (click navigates with `mois` and `categorie`, one category without bar, day heading class)
- [x] **T35** — `DashboardPage`: new cards in order, skeleton cards without a book
  - Fulfils: REQ-9.7, 9.8, 9.10
  - Files: `app/dashboard/pages/dashboard-page.{ts,html}` + spec
- [x] **T36** — Budget support functions
  - Fulfils: REQ-9.12, 9.13, 9.14
  - Files: `app/budget/support/{off-plan,last-month,overview}.ts` + specs (rows add up to `off_plan`, planned group under a top, retired and zero rows, absent category is `0`, `null` previous, `null` percent order, 85 % and 100 % limits)
- [x] **T37** — `BudgetStore`: `summary` and `previous`
  - Fulfils: REQ-9.13, 9.14
  - Files: `app/budget/data/budget.store.ts` + spec (parallel with the budget, failure gives `null` and keeps the budget ready, stale dropped, quiet reload refreshes, save does not, book switch clears)
- [x] **T38** — `BudgetDraft.addLine(code, minor?)`
  - Fulfils: REQ-9.13
  - Files: `app/budget/data/budget-draft.ts` + spec (prefilled text for exponents 3, 2 and 0, dirty, overlap still refused)
- [x] **T39** — `BudgetOverview`
  - Fulfils: REQ-9.12
  - Files: `app/budget/parts/budget-overview.ts` + spec (hidden without lines, order, states, `X / Y`, percent)
- [x] **T40** — `OffPlanList` (replaces `OffPlanRow`)
  - Fulfils: REQ-9.13
  - Files: `app/budget/parts/{off-plan-list.ts,off-plan-row.ts}` (row removed), `budget-parts.scss`, `budget-parts.spec.ts`
  - Verify: expander, largest first, single total fallback, add action emits, action hidden when `canAdd` is false
- [x] **T41** — `PlanLineRow` last month, `BudgetTotals` meters
  - Fulfils: REQ-9.14, 9.15
  - Files: `app/budget/parts/{plan-line-row,budget-totals}.ts`, `budget-parts.spec.ts`
- [x] **T42** — `BudgetPage` wiring
  - Fulfils: REQ-9.12–9.15
  - Files: `app/budget/pages/budget-page.{ts,html}` + spec (overview first, add from off-plan makes the draft dirty and the unsaved guard ask, last month passed to rows)
- [x] **T43** — i18n keys
  - Fulfils: REQ-9.16
  - Files: `public/i18n/{fr,en,ar}.json` (`dashboard.pace.*`, `dashboard.trend.*`, `budget.overview.*`, `budget.offPlan.*`, `budget.lastMonth`; Arabic draft); `translation-files.spec.ts` already compares the three files
- [x] **T44** — Docs
  - Fulfils: workflow
  - Files: `specs/README.md` 008 entry

## Deviations from spec
- Charts added after implementation at the owner's request (2026-11-25).
- T30 / T37 / T40: `trendRange` clamps `from` to `2000-01-01` (the API refuses earlier days); `OffPlanRow` is replaced by `OffPlanList` and its file removed; `percentRank` moved from `dashboard/support/watch-list.ts` to `budget/support/overview.ts` so both use one ordering; the `budget.offPlan` i18n key became an object (`budget.offPlan.title` is the old text); `Summary` DTO fields `days`/`months` are optional in the type so older fixtures still compile (the mapper defaults them to `[]`).
- T27 / REQ-9.4: `ui-trend-bars` uses `role="group"` instead of `role="img"` on its SVG, because `img` makes the focusable bars inside it unreachable for assistive technology; the hidden table and the per-bar labels carry the values.
- T0: the backend `008-budget/contract.md` is now "Approved (2026-11-25) — implemented"; its shapes and codes match this spec, so nothing changed.
- T2: the icons `triangle-alert` / `circle-alert` already exist in the Lucide starter set as `triangle-exclamation-point` / `circle-exclamation-point`; `ui-meter` uses those, nothing added to the registry.
- T8: `month-context.ts` lives in `app/ledger/` (not `dashboard/support/`) because the budget and operations pages use it too and nothing may import `dashboard/`. The overlap rule lives in `categories/data/overlap.ts` for the same reason (picker and `BudgetDraft`).
- T8 / REQ-3.3: "at most 6 rows" is read as 5 categories plus the "Autres catégories" row when there are more than 6.
- T14–T15: a shared `CardFrame` part gives every card its heading, loading skeleton and error-with-retry.
- T18: the leave guard is in `budget/pages/budget-leave.guard.ts` so the routes file does not load `BudgetPage` eagerly.
- Test helpers shared by several features are in `app/testing/render-part.ts`.

## Verification report
| REQ | Verified how | Result |
|---|---|---|
| all | left to CI and the owner | — |
