# 008 — Dashboard, budget and recurring operations: Design

> Status: Draft — awaiting approval
> Requirements: [requirements.md](./requirements.md)

## Overview

Three new app feature folders (`dashboard/`, `budget/`, `recurring/`) follow the `data/ pages/ parts/ support/` layout of [spec 007](../007-categories-operations/design.md#placement). Stores follow the 006/007 pattern: `signalStore({ providedIn: 'root' })`, `async` methods with `try/catch` returning `StoreResult`, no `rxMethod`, a `generation` counter that drops stale answers, a `provide*` environment initialiser that resets on account change. The toolbox gets two molecules (`ui-meter`, `ui-bar-list`) and one option on `parseMajor`.

Cross-feature freshness uses one small root service, `LedgerChanges` (`app/ledger/ledger-changes.ts`): a signal holding `{ version, months }`. `OperationsStore` (entries) and `RecurringStore` (rules) call `ledger.changed(bookId, months)` after a successful write. `DashboardStore` and `BudgetStore` read it in an `effect` in their `provide*` and refetch only when the month matches the one they show (REQ-8.3). This keeps `operations/` free of imports from `dashboard/` and `budget/`.

## Placement

```
shared/ui/molecules/src/lib/meter/       meter.ts, meter.scss, meter.spec.ts          (REQ-7.1)
shared/ui/molecules/src/lib/bar-list/    bar-list.ts, bar-list.scss, bar-list.spec.ts (REQ-7.2)
shared/util/format/src/lib/money.ts      parseMajor options { allowZero }             (REQ-7.3)
apps/ui-catalog/                         meter and bar-list states                    (REQ-7.4)
apps/expenses-management/src/app/
  ledger/        ledger-changes.ts (+ spec)
  categories/parts/   category-picker: mode 'plan'
  dashboard/
    data/      models.ts, mappers.ts, summary-api.ts, budget-api.ts (shared with budget/, see below),
               dashboard.store.ts, provide-dashboard.ts
    pages/     dashboard-page.ts|html|scss
    parts/     hero-card, watch-list-card, categories-card, members-card, upcoming-card, recent-card,
               no-plan-card, first-use-card
    support/   month-context.ts, watch-list.ts, top-categories.ts, same-day.ts, whole-units.ts
  budget/
    data/      models.ts, mappers.ts, budget-api.ts, budget-draft.ts, budget.store.ts, provide-budget.ts
    pages/     budget-page.ts|html|scss
    parts/     plan-line-row, budget-totals, off-plan-row
    support/   budget-errors.ts (code → field and message)
  recurring/
    data/      models.ts, mappers.ts, recurring-api.ts, rule-draft.ts, recurring.store.ts, provide-recurring.ts
    pages/     recurring-page.ts|html|scss
    parts/     rule-row, rule-sheet
    support/   rule-errors.ts, frequency-text.ts
  operations/  filters from ?mois/?categorie, header link, "récurrent" badge, LedgerChanges calls
  shell/       "Budget" rail destination, routes, title keys
```

`budget-api.ts` lives in `budget/data/` only; `dashboard/` imports it (feature-to-feature import of a `data/` file is allowed, as `operations/` imports `categories/data`). `dashboard/` imports `operations/data` (`EntriesApi`) and `recurring/data` (`RecurringApi`). `budget/` and `recurring/` import `categories/data` and `households/data`. Nothing imports `dashboard/` except routes.

| Piece | Where | Reason |
|---|---|---|
| `ui-meter`, `ui-bar-list` | `@shared/ui-molecules` | Every app with budgets or rankings draws them the same way; presentational, no keys, no currency. |
| `allowZero` | `@shared/util-format` | Money parsing is toolbox. |
| Month context, cards, stores, APIs | the app | Expenses domain. |
| Plan mode of the picker | app `categories/parts` | Reads the category store. |

## Reuse

- Molecules: `ui-month-switcher`, `ui-stat`, `ui-section-header`, `ui-empty-state`, `ui-alert`, `ui-chip-group`, `ui-segmented-control`, `ui-form-field`, `ui-list`. Organisms: `UiDialog`, `UiConfirm`, `UiToast`, `ui-grouped-list`. Atoms: `ui-amount`, `uiInput`, `uiButton`, `ui-badge`, `ui-skeleton`, `ui-icon`. Template: `UiPage`.
- Spec 007: `CategoryPicker`, `CategoryChip`, `CategoryLabels`, recents, `OtherNamesApi`, `EntriesApi`, `entry-draft` (diff), `entry-errors` pattern, big-amount confirmation, `day-groups`, `monthRange`/`monthOf`, `defaultFilters`.
- Spec 006: `StoreResult`, `toResult`, `retryText`, `applyFieldErrors`, `paginate`, `BooksStore.selectedBook` (`currency`, `timezone`), `workspaceGuard`.
- HTTP: `handling(...codes)`, `ApiError` (`fields`, `retryAfterSeconds`).
- Util-format: `formatMinor`, `parseMajor`, `todayIn`, `addDays`.
- **New toolbox components: `ui-meter`, `ui-bar-list`** (REQ-7.1, 7.2). Justified: two screens in this spec and every future app need them; nothing in 003/004 does it.

## Toolbox API

```ts
// @shared/ui-molecules
type UiMeterState = 'ok' | 'warning' | 'over';
// <ui-meter [value]="540000" [max]="600000" state="warning" label="Alimentation" valueText="90 %" />
class UiMeter { value = input.required<number>(); max = input.required<number>(); state = input<UiMeterState>('ok'); label = input.required<string>(); valueText = input<string>(); }

interface UiBarItem { id: string; label: string; value: number; valueText: string; shareText?: string; clickable?: boolean }
// <ui-bar-list [items]="rows()" emptyText="…" (itemSelect)="open($event)" />
class UiBarList { items = input.required<readonly UiBarItem[]>(); emptyText = input<string>(); itemSelect = output<string>(); }

// @shared/util-format
parseMajor(text: string, exponent: number, options?: { allowZero?: boolean }): ParseResult
```

`ui-meter`: a `div[role=meter]`, fill width `min(value/max, 1)` as a CSS variable, `inset-inline-start: 0` so RTL mirrors by itself; `over` fill uses `repeating-linear-gradient` built with `color-mix()` of `--ui-*` colours; icons `check`-less for `ok`, `triangle-alert` for `warning`, `circle-alert` for `over` (registered in the icon registry if missing). Component tokens `--ui-meter-height` etc. in its stylesheet (spec 003 rule). `max = 0` renders an empty track. `ui-bar-list`: `ul` of rows; clickable rows are `button`s; bar width `value / max(values)`.

## Models & API

```ts
// budget/data/models.ts (mapped from snake_case)
type LineStatus = 'ok' | 'warning' | 'over';
interface BudgetLine { category: string; planned: number; actual: number; percent: number | null; status: LineStatus; retired: boolean }
interface Budget {
  month: string; from: string; to: string; currency: string; hasPlan: boolean; daysLeft: number | null;
  income: { expected: number | null; actual: number }; saving: { planned: number | null; actual: number };
  expenses: { planned: number | null; actual: number; offPlan: number | null; remaining: number | null };
  lines: readonly BudgetLine[];
}
interface BudgetInput { expectedIncome: number | null; plannedSaving: number | null; lines: readonly { category: string; planned: number }[] }

// dashboard/data/models.ts
interface SummaryNode { category: string; type: CategoryType; total: number; entries: number; children: readonly SummaryNode[] }
interface MemberTotals { account: Person; income: number; expense: number; saving: number; balance: number; entries: number }
interface Summary { from: string; to: string; currency: string; totals: { income; expense; saving; balance; entries }; categories: readonly SummaryNode[]; members: readonly MemberTotals[] }
// (days, months and other_names are not mapped: no card uses them)

// recurring/data/models.ts
type Frequency = 'weekly' | 'monthly' | 'yearly';
interface RecurringRule { id; amount; currency; type; category; otherName: string | null; comment: string | null; frequency: Frequency; interval: number;
  startsOn: string; endsOn: string | null; nextDate: string | null; createdBy: Person; updatedBy: Person }
interface RuleInput { amount; category; otherName?: string | null; comment?: string | null; frequency; interval; startsOn; endsOn: string | null }
type RulePatch = Partial<RuleInput>;
```

| Method | Endpoint | Request | Response | Handled codes |
|---|---|---|---|---|
| `SummaryApi.get(bookId, period)` | `GET books/{b}/summary` | `month=` or `from=&to=` | `Summary` | `validation.failed`, `book.not_found`, `http.offline` |
| `BudgetApi.get(bookId, month)` | `GET books/{b}/budgets/{m}` | — | `Budget` | `validation.failed`, `book.not_found`, `http.offline` |
| `BudgetApi.save(bookId, month, input)` | `PUT …/budgets/{m}` | `expected_income`, `planned_saving`, `lines` | `Budget` | + `request.throttled` |
| `BudgetApi.copy(bookId, month, replace)` | `POST …/budgets/{m}/copy` | `{ replace }` | `Budget` | + `budget.nothing_to_copy`, `budget.not_empty` |
| `RecurringApi.list(bookId)` | `GET books/{b}/recurring-rules` | pages (`paginate`) | `RecurringRule[]` | `book.not_found`, `http.offline` |
| `RecurringApi.create/update/remove` | `POST/PATCH/DELETE …/recurring-rules[/{id}]` | `RuleInput` / `RulePatch` | `RecurringRule` / `204` | `validation.failed`, `recurring_rule.limit_reached`, `recurring_rule.not_found`, `book.not_found`, `request.throttled`, `http.offline` |
| `EntriesApi.page` (existing) | `GET …/transactions` | month filter | first page | existing |

Backend sections: summary contract "Query", "Response" (REQ-2–4); budget contract "Budget shape", `GET`, `PUT`, `copy`, "Field codes" (REQ-2, 3.2, 5); 006 contract "Recurring rule", `recurring-rules` routes, "Field codes" (REQ-3.5, 6). Whole-month budget `month` is `YYYY-MM`; summary uses `month=` for a month and `from/to` for the comparison (REQ-4.2).

## State (stores)

**`DashboardStore`** (`dashboard/data/dashboard.store.ts`) — state: `bookId`, `month`, and per card `{ status: 'idle'|'loading'|'ready'|'error', data, error }` for `budget`, `summary`, `comparison` (`{ current, previous } | null`), `upcoming`, `recent`, plus `firstUse: 'unknown'|'yes'|'no'`. Methods: `open(bookId, month)` (sets context, starts every card), `setMonth(month)`, and `reload(card)` for the per-card "Réessayer". Each card has its own `generation`; each loader is `try/catch` and writes only its card (REQ-3.7). `comparison` is loaded only when the budget answers `has_plan: false`; its previous-month failure sets `comparison.previous = null` (REQ-4.3). `firstUse` is one book-wide `EntriesApi.page` with the widest filter (`2000-01-01` … today + 1 year) and a limit of one item read. Book switch: `open` with the new id bumps all generations; a `404 book.not_found` calls `BooksStore.load({ force: true })` and ignores the answer (REQ-8.2). `provideDashboard` resets on account change and refetches on `LedgerChanges` for the shown month.

**`BudgetStore`** — state: `bookId`, `month`, `status`, `budget` (last answer), `saving`, `error`. Methods: `open(bookId, month)`, `save(input)` → `BudgetWriteResult` (`done` with the new budget or `error`), `copy(replace)` → result (`done | error`, with `budget.not_empty` and `budget.nothing_to_copy` surfaced as codes). The draft is **not** in the store: `BudgetDraft` (`budget/data/budget-draft.ts`) is a plain class with signals created by the page (lines, income, saving, `dirty`, overlap checks for REQ-5.3, local totals for REQ-5.5, `toInput()` using `parseMajor` with `allowZero`). After `save`/`copy` `done`, the store calls `ledger.budgetChanged(bookId, month)`: a budget write changes no entry, so only budget readers (the dashboard's hero and watch list) refetch.

**`RecurringStore`** — state: `bookId`, `rules`, `status`, `error`. Methods: `open(bookId)`, `create(input)`, `update(id, patch)`, `remove(id)` → `RuleWriteResult`; after each success it calls `ledger.changed(bookId, 'all')` (REQ-6.9, creating can record past entries) and reloads the list. `recurring_rule.not_found` on update/remove removes the row locally. `provideRecurring` resets on account change and book switch.

**`OperationsStore` changes** — after successful `create`, `update`, `remove` it calls `ledger.changed(bookId, months)` with the entry's month (and the previous month when an update changes the date's month). It also reads the optional route-supplied filters through the existing `setFilters`.

**`LedgerChanges`** — `changed(bookId, months | 'all')` (entries and rules: summary, budget, recent, upcoming) and `budgetChanged(bookId, month)` (budget only) set `{ kind, bookId, months, version }`; consumers compare `version` and ignore other books and months.

Error handling: stores never throw; the page maps `ApiError` through `budget-errors` / `rule-errors` / the existing `retryText`. Month fallback (REQ-8.10): on `422` with `fields.month` the store calls `setMonth(current)` once.

## Components

| Component | Inputs | Outputs | Notes |
|---|---|---|---|
| `DashboardPage` | route `?mois` | — | Reads `DashboardStore`; month switcher; composes cards; `first-use-card` replaces them (REQ-4.4). |
| `HeroCard` | `budget`, `currency`, `locale` | — | Whole units (`whole-units.ts`), per-day, "Budget épuisé", "Gérer le budget". |
| `NoPlanCard` | `current`, `previous`, `currency` | — | Same-day comparison, "Fixer un budget". |
| `WatchListCard` | `lines` | `open(category)` | `watch-list.ts` sort and cap (REQ-3.2); uses `ui-meter`. |
| `CategoriesCard` | `summary` | `open(code)` | `top-categories.ts` (REQ-3.3); `ui-bar-list`. |
| `MembersCard` | `members`, `isHousehold` | — | `ui-bar-list`, not clickable. |
| `UpcomingCard` | `rules`, `today`, `month` | — | Filter and cap (REQ-3.5), link to recurrentes. |
| `RecentCard` | `entries` | — | Reuses `day-groups` and `EntryRow` (badge). |
| `BudgetPage` | route `?mois` | — | Month switcher, `BudgetDraft`, save and copy bar, dirty guard (`canDeactivate` + month change confirm). |
| `PlanLineRow` | `line`, `draft`, `currency` | `remove` | Planned field, actual, `ui-meter`, "Retirée". |
| `BudgetTotals`, `OffPlanRow` | `budget` | — | Totals and "Hors budget" (hidden at `null`/`0`). |
| `RecurringPage` | — | — | List, add, per-row edit and delete (`UiConfirm`). |
| `RuleSheet` | `rule?`, `book` | `closed` | `UiDialog`; reuses the entry sheet's amount and "Other" parts; opened by a `RuleSheetService`. |
| `CategoryPicker` (changed) | `mode: 'plan'`, `excluded: Set<string>` | — | Tops and groups of type `expense`, not retired, not overlapping `excluded` lines. |

`EntrySheet` and `EntryRow` get the "récurrent" badge (REQ-6.7); `OperationsPage` reads `?mois`/`?categorie` once on open and gets a "Récurrentes" header link.

Support: `watch-list.ts` (`warning|over`, sort by `percent` with `null`+`over` first, `slice(0, 3)`), `top-categories.ts` (expense tops sorted, 6 rows + remainder, shares), `same-day.ts` (`previousRange(today)` with day clamp; uses `addDays`, month arithmetic on strings, never `Date#toISOString`), `whole-units.ts` (`Math.floor(minor / 10 ** exponent)`), `month-context.ts` (parse and clamp `mois` to `2000-01 … current + 12`).

## Routing

```
/                          workspaceGuard, bookBound, title 'home.title'           DashboardPage (replaces BookHome)
/budget                    workspaceGuard, bookBound, title 'budget.title'         BudgetPage, canDeactivate (unsaved)
/operations                existing; ?mois & ?categorie applied on open
/operations/recurrentes    workspaceGuard, bookBound, title 'recurring.title'      RecurringPage  (declared before /operations)
```

`PATHS` gains `budget: '/budget'` and `recurring: '/operations/recurrentes'`. `BookHome` and its spec are deleted. The side rail gets "Budget" (icon `wallet` added to the icon registry); phone tabs are unchanged (REQ-8.1).

## i18n keys

`dashboard.*` (hero, perDay, spentThisMonth, exhausted, manageBudget, noPlan.*, compare.*, watch.title/empty, categories.title/others, members.title, upcoming.title/empty/seeAll, recent.title/seeAll, firstUse.*, cardError, retry), `budget.*` (title, expectedIncome, plannedSaving, addLine, offPlan, remaining, totals.*, status.ok/warning/over, retired, copy.*, replaceConfirm, nothingToCopy, saved, leaveConfirm, clearConfirm, errors by contract code: `lines.category.*`, `lines.planned.*`, `expected_income.*`, `planned_saving.*`, `lines.max`, `throttled`), `recurring.*` (title, add, empty, frequency.weekly/monthly/yearly with plural interval, nextDate, ended, form.*, pastStartWarning, editNote, deleteConfirm, limit, errors by code), `operations.recurringBadge`, `categories.picker.plan*`, `shell.nav.budget`. Added to `public/i18n/{fr,en,ar}.json`; Arabic is a draft (`meta.reviewStatus`).

## Requirement coverage

| REQ | Covered by |
|---|---|
| 1.1–1.4 | `month-context.ts`, pages' `?mois`, `OperationsPage` filters from query |
| 2.1–2.5 | `HeroCard`, `whole-units.ts`, `formatMinor` |
| 3.1–3.8 | cards, `watch-list.ts`, `top-categories.ts`, `DashboardStore` per-card state, `ui-meter`, `ui-bar-list` |
| 4.1–4.4 | `NoPlanCard`, `same-day.ts`, `DashboardStore.comparison`, `firstUse`, `first-use-card` |
| 5.1–5.11 | `BudgetPage`, `BudgetDraft`, `BudgetStore`, `budget-errors.ts`, picker plan mode, `PlanLineRow` |
| 6.1–6.9 | `RecurringPage`, `RuleSheet`, `RecurringStore`, `rule-draft.ts`, `rule-errors.ts`, `EntryRow` badge |
| 7.1–7.4 | `ui-meter`, `ui-bar-list`, `parseMajor`, `ui-catalog` |
| 8.1–8.10 | routes and shell, `LedgerChanges`, `provide*`, generations, `todayIn`, translations, a11y in components |

## Risks / alternatives considered

- **Draft budget contract.** Field and error codes may change; mappers and `budget-errors.ts` are the only places that know them.
- **Hero and `remaining`.** The backend subtracts `off_plan` and never lets overspent lines offset others; the app shows `remaining` as is and does not recompute it.
- **Per-day with `days_left`.** Uses the backend's value (timezone-correct); the app never derives it from the browser clock.
- **`firstUse` request.** Cheaper alternatives (a count endpoint) do not exist; one page of one needed item is acceptable. If the month's entries are already known to be non-empty, the check is skipped.
- **"À venir" and weekly rules.** One row per rule hides repeated weekly occurrences; accepted by the owner (non-goal).
- **Whole-unit rounding.** Rounding down can show "0 DT par jour" for a very small remainder; REQ-2.2 shows "moins de 1 par jour" (key `dashboard.perDayLow`) when the floor is `0`.
- **Alternative rejected:** putting the month in a store shared by pages. A URL query keeps back/forward, links and reloads correct and needs no new store.
