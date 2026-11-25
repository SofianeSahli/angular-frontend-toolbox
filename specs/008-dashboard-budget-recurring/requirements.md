# 008 — Dashboard, budget and recurring operations: Requirements

> Status: Draft — awaiting approval
> Scope:
> - **Toolbox (`scope:shared`):** `ui-meter` and `ui-bar-list` molecules; `parseMajor` gets an `allowZero` option. No chart, DateField, AmountKeypad or Combobox.
> - **App (`scope:expenses`):** `apps/expenses-management/src/app/dashboard/`, `budget/`, `recurring/`, small changes in `operations/`, `categories/` (picker "plan" mode) and `shell/`. Layout as in [spec 006](../006-households-books/design.md#placement) and [spec 007](../007-categories-operations/design.md#placement).
>
> Backend contracts (not restated here; the app follows them):
> - [`007-summary/contract.md`](../../../personal-accountings-backend/specs/007-summary/contract.md): `GET books/{book}/summary`.
> - [`008-budget/contract.md`](../../../personal-accountings-backend/specs/008-budget/contract.md): `GET`/`PUT books/{book}/budgets/{month}`, `POST …/copy`. **Still "Draft — awaiting approval" when this spec was written; the owner chose to proceed on 2026-11-25.** If the contract changes, this spec is updated before any code.
> - [`006-transactions/contract.md`](../../../personal-accountings-backend/specs/006-transactions/contract.md): shared rules, `recurring-rules` routes, `recurring_rule_id` of an entry.
>
> Design source: UX direction approved on 2026-11-21 (research summary), as briefed by the owner. The mockups canvas (page 3 "Tableau de bord") was not available; the layout is designed from the brief and corrected at review.

## Context

After spec 007 a user can record and list entries, but `/` is still a placeholder. This spec adds the dashboard (what is left to spend, where the money goes, what is coming), the monthly budget screen, and the management of recurring rules. Every card and screen belongs to the selected book and one month, in the book's timezone and currency. The toolbox gets two presentational molecules; everything else is app code.

## User stories

- **US-1 — Month context.** As a member of a book, I want one selected month that follows me from the dashboard to the budget and the operations, so that numbers always match.
- **US-2 — Hero.** As a member, I want to see how much I can still spend this month and per day, so that I decide at a glance.
- **US-3 — Dashboard cards.** As a member, I want to see what to watch, where the money goes, who spent it, what is coming and the latest entries.
- **US-4 — Honest empty states.** As a member without a plan, or with an empty book, I want no misleading numbers and a clear next step.
- **US-5 — Budget.** As a member, I want to plan the month by category, income and saving, compare with what was spent, and copy last month's plan.
- **US-6 — Recurring operations.** As a member, I want to manage the rules that record rent, bills and salary by themselves, and recognise the entries they made.
- **US-7 — Toolbox.** As a developer, I want a meter and a bar list in the toolbox, so that every app shows progress and rankings the same way.
- **US-8 — Quality.** As a user, I want these screens in French, English and Arabic (RTL), accessible, in any currency, with clear messages when something fails.

## Acceptance criteria (EARS)

### US-1 — Month context
- **REQ-1.1** THE SYSTEM SHALL carry the selected month in the query parameter `?mois=YYYY-MM` on `/`, `/budget` and `/operations`. WHEN the parameter is absent or invalid THEN it defaults to the current month in the book's timezone (`todayIn`).
- **REQ-1.2** THE SYSTEM SHALL show a `ui-month-switcher` on the dashboard and the budget. Changing the month updates the URL (replace, not push) and reloads the page's data. The range is `2000-01` up to the current month + 12 months (budget contract, "The month").
- **REQ-1.3** WHEN the user opens a drill-down (a category bar, a watch-list row, "Tout voir") THE SYSTEM SHALL pass `mois` (and `categorie` when relevant). The operations page SHALL apply them to its filters when it opens with them, in place of the default filters of spec 007, and SHALL still let the user change them afterwards.
- **REQ-1.4** WHEN the selected book changes THE SYSTEM SHALL keep the month and reload every card for the new book (REQ-8.2).

### US-2 — Hero (`/`)
- **REQ-2.1** WHEN the month has a plan (`has_plan`) THE SYSTEM SHALL show "Reste à dépenser" from `expenses.remaining`, in whole units of the currency (decimals dropped, rounded down), beside "Dépensé ce mois" from `expenses.actual`.
- **REQ-2.2** WHEN `days_left` is a number and `expenses.remaining` is above `0` THE SYSTEM SHALL show the per-day amount `floor(remaining ÷ days_left)` in whole units with "par jour". IF `days_left` is `null` (past or future month) or `remaining` is `0` THEN it SHALL show no per-day amount. WHEN the whole-unit per-day amount is `0` it SHALL show "moins de 1 par jour" (with the currency symbol).
- **REQ-2.3** WHEN `expenses.remaining` is `0` and the plan has lines THE SYSTEM SHALL show "Budget épuisé" with the `over` style (REQ-3.1) instead of a balance of zero.
- **REQ-2.4** THE SYSTEM SHALL show a "Gérer le budget" link to `/budget?mois=…` in the hero.
- **REQ-2.5** THE SYSTEM SHALL show amounts with `tabular-nums`, wrapped in `<bdi>`, in the book's currency (REQ-8.7).

### US-3 — Dashboard cards
- **REQ-3.1** THE SYSTEM SHALL use a calm palette: expenses in neutral ink, income in the success colour, `warning` and `over` colours only for budget states. `over` is always shown with stripes **and** an icon and text; `warning` with an icon and text.
- **REQ-3.2** **À surveiller:** THE SYSTEM SHALL build the list from the budget `lines`: keep `warning` and `over`, sort by `percent` descending (`null` with `over` first), keep at most 3. Each row shows the category name, a `ui-meter`, actual of planned and the percent. A row opens `/operations?mois=…&categorie=…`. WHEN no line qualifies THE SYSTEM SHALL show "Tout est dans les clous ce mois-ci".
- **REQ-3.3** **Où va l'argent:** THE SYSTEM SHALL list the month's top expense categories from `summary.categories` (type `expense`, top level), sorted by `total` descending, as a `ui-bar-list` with amount and share of `totals.expense`, at most 6 rows. WHEN there are more, the remainder is one non-clickable "Autres catégories" row. Tapping a row opens `/operations?mois=…&categorie=<code>`.
- **REQ-3.4** **Par membre:** WHEN the book belongs to a household and `summary.members` has more than one line THE SYSTEM SHALL show a `ui-bar-list` of the members' `expense` in the API order. A member who left keeps their line and name. A personal book shows no such card.
- **REQ-3.5** **À venir:** THE SYSTEM SHALL list the book's recurring rules whose `next_date` is after today and on or before the last day of the selected month, soonest first, at most 5 rows, one row per rule (date, category name or comment, amount). A past month shows the empty state. "Voir les récurrentes" opens `/operations/recurrentes`.
- **REQ-3.6** **Récent:** THE SYSTEM SHALL list the 5 latest entries of the selected month (first page of the entries list for that month, cut to 5), grouped by day, each with category, amount and who added it (`created_by.name`), and "Tout voir" to `/operations?mois=…`. Entries made by a rule carry the badge of REQ-6.7.
- **REQ-3.7** Each card SHALL have its own loading (`ui-skeleton`), error (`ui-alert` with "Réessayer") and empty state. WHEN one card's request fails THE SYSTEM SHALL still show the others.
- **REQ-3.8** Cards SHALL load from independent requests: the hero and "À surveiller" from the budget only; "Où va l'argent" and "Par membre" from the summary only; "À venir" from the rules only; "Récent" from the entries only.

### US-4 — Honest empty states
- **REQ-4.1** WHEN the month has no plan (`has_plan` is `false`) THE SYSTEM SHALL NOT show "Reste à dépenser", the per-day amount or "À surveiller". It SHALL show "Dépensé ce mois" compared with the same day of the previous month, and an invitation "Fixer un budget" to `/budget?mois=…`.
- **REQ-4.2** The comparison SHALL use two `summary` calls: this month from its first day up to today, and the previous month from its first day to the same day number, clamped to the previous month's last day (31 March → 28 February). For a past or future month it compares the whole month with the whole previous month. It shows the two amounts and the difference in neutral ink (no red, no judgement).
- **REQ-4.3** IF the previous-month call fails THEN THE SYSTEM SHALL show "Dépensé ce mois" alone, with no comparison and no error.
- **REQ-4.4** WHEN the book has never had an entry THE SYSTEM SHALL replace all cards by one first-use card with "Ajouter une opération" (opens the entry sheet) and "Préparer le budget" (`/budget`). The check uses a request not limited to a month, so an empty month in a used book shows the normal cards with their own empty states.

### US-5 — Budget (`/budget`)
- **REQ-5.1** THE SYSTEM SHALL provide `/budget` (book-bound, `workspaceGuard`) with a month switcher, "Revenu prévu" and "Épargne prévue" amounts, the plan lines, the "Hors budget" row and totals.
- **REQ-5.2** Each plan line SHALL show the category (emoji, name), a planned-amount field, the actual amount, `percent` and `status` with a `ui-meter`. A line with `planned` `0` shows no percent; with `actual` above `0` it is `over`. A retired category keeps its line, marked "Retirée", editable and removable but not addable.
- **REQ-5.3** THE SYSTEM SHALL add a line through the category picker in a new **plan mode** (extends spec 007 REQ-3.3): only expense top categories and groups, never leaves, income or saving categories, retired ones, or ones that overlap a line already in the draft (the same category, its parent, or one of its children). Lines stay in category-tree order.
- **REQ-5.4** THE SYSTEM SHALL parse amounts with `parseMajor` and the book's exponent, accepting `0` (REQ-7.3), and show full precision (no whole-unit rounding) on this screen. Income and saving may be left empty (`null`).
- **REQ-5.5** THE SYSTEM SHALL show from the answer: `expenses.planned`, `expenses.actual`, `expenses.off_plan` as the "Hors budget" row (hidden when `null` or `0`), `expenses.remaining`, income expected and actual, saving planned and actual. While the user edits, actuals and statuses stay those of the last answer and planned totals are recomputed locally.
- **REQ-5.6** WHEN the user saves THE SYSTEM SHALL `PUT` the whole month (`expected_income`, `planned_saving`, `lines`), then replace the screen with the answer. Saving an empty draft sends `{"lines": []}` and clears the plan, after a `UiConfirm` when a plan existed.
- **REQ-5.7** THE SYSTEM SHALL handle the save errors: each `validation.failed` code of the contract's field table shown on its field or line (`lines.N.category`, `lines.N.planned`, `expected_income`, `planned_saving`) or, for `lines.max` and codes without a field, in an `ui-alert`; `book.not_found` (REQ-8.2); `request.throttled` with the `Retry-After` seconds; offline. A refused draft stays editable and nothing is lost.
- **REQ-5.8** WHEN the user changes the month or leaves the screen with unsaved changes THE SYSTEM SHALL ask for confirmation with `UiConfirm`.
- **REQ-5.9** "Copier le mois dernier" SHALL `POST …/copy`. WHEN the month has no plan and the draft is untouched it copies at once and shows the answer. Otherwise THE SYSTEM SHALL first confirm "Remplacer le budget de ce mois ?" and send `replace: true`. IF the answer is `409 budget.not_empty` (someone saved meanwhile) THEN it offers the same confirmation; IF `409 budget.nothing_to_copy` THEN it shows "Le mois précédent n'a pas de budget" and changes nothing. `request.throttled`, `404` and offline are handled as in REQ-5.7.
- **REQ-5.10** WHILE two people save the same month THE SYSTEM SHALL accept last-save-wins (backend) and show the saver's own answer after a save.
- **REQ-5.11** WHEN a month has no plan THE SYSTEM SHALL show the empty form, a short invitation and the copy button. The screen works for past months and for months up to 12 months ahead.

### US-6 — Recurring operations (`/operations/recurrentes`)
- **REQ-6.1** THE SYSTEM SHALL provide `/operations/recurrentes` (book-bound) listing the book's rules in API order (`next_date` ascending, ended rules last): category (emoji, name, "Autre" name), comment, amount, frequency text ("Chaque mois", "Toutes les 2 semaines"), next date or "Terminée", and author. All pages are followed (a book has at most 100 live rules).
- **REQ-6.2** THE SYSTEM SHALL offer "Ajouter une récurrente" and, per rule, "Modifier" and "Supprimer". There is no pause or resume (no backend support).
- **REQ-6.3** The rule form SHALL be a `UiDialog` (sheet on phones) reusing the entry sheet's amount input (`parseMajor`, live preview, big-amount confirmation), the leaf picker in entry mode with recents, the required "Précisez" field and suggestions on an "Other" leaf, an optional comment (200), frequency (`weekly`, `monthly`, `yearly`), interval (1–12, default 1), `starts_on` (native date, today − 1 year … today + 1 year) and optional `ends_on` (on or after `starts_on`).
- **REQ-6.4** WHEN `starts_on` is today or in the past THE SYSTEM SHALL warn before creating: "Les opérations échues jusqu'à aujourd'hui seront créées tout de suite". WHEN editing it SHALL explain that entries already made do not change and that a new schedule applies from today.
- **REQ-6.5** THE SYSTEM SHALL send only the changed fields on edit (the `entry-draft` diff approach of spec 007), `ends_on: null` to remove the end, and show every code of the field table (`amount.*`, `category.*`, `other_name.*`, `comment.*`, `frequency.in`, `interval.*`, `starts_on.*`, `ends_on.*`) on its field, plus `recurring_rule.limit_reached` ("100 récurrentes au maximum"), `book.not_found`, `recurring_rule.not_found` (the row disappears with a toast), `request.throttled` and offline.
- **REQ-6.6** WHEN the user deletes a rule THE SYSTEM SHALL ask with `UiConfirm`, saying that entries already made stay, and remove the row after success.
- **REQ-6.7** THE SYSTEM SHALL show a small "récurrent" `ui-badge` on every entry with a `recurring_rule_id`: in `/operations`, in the dashboard's "Récent" list, and in the entry sheet's header when editing it. The entry model already carries `recurringRuleId` (spec 007).
- **REQ-6.8** WHEN a rule uses a retired category THE SYSTEM SHALL keep showing and editing it, and refuse a retired category on a new choice. A rule whose author left keeps their name.
- **REQ-6.9** "Récurrentes" SHALL open from the operations page header and from "À venir". WHEN a rule is created, edited or deleted THE SYSTEM SHALL mark the book's budget, summary and entries as stale (REQ-8.3), because creating a rule can record past entries at once.

### US-7 — Toolbox and money helpers
- **REQ-7.1** THE SYSTEM SHALL provide `ui-meter` in `@shared/ui-molecules`: inputs `value`, `max`, `state` (`ok | warning | over`, default `ok`), `label` (accessible name) and optional `valueText`. It renders `role="meter"` with `aria-valuenow/min/max` and `aria-valuetext`. The fill is capped at 100 % and grows from the inline-start (mirrored in RTL). `over` uses diagonal stripes plus a `ui-icon`, `warning` an icon, so state never relies on colour alone. Only `var(--ui-*)` tokens.
- **REQ-7.2** THE SYSTEM SHALL provide `ui-bar-list` in `@shared/ui-molecules`: input `items` (`{ id, label, value, valueText, shareText?, clickable? }`) and optional `emptyText`; output `itemSelect(id)`. Rows keep the given order (the caller sorts), each bar is scaled to the largest value and grows from the inline-start (RTL), clickable rows are buttons. No store, translation keys or currency logic (the caller passes `valueText`).
- **REQ-7.3** THE SYSTEM SHALL give `parseMajor` an option `{ allowZero?: boolean }` (default `false`, so spec 007 callers are unchanged). With `allowZero`, `"0"` returns `0` instead of reason `zero`.
- **REQ-7.4** Both molecules SHALL appear in `apps/ui-catalog` in every state (meter `ok`, `warning`, `over`, at `0`, above 100 %; bar list empty, one row, many rows, clickable, long labels, RTL).

### US-8 — Navigation, freshness, quality
- **REQ-8.1** THE SYSTEM SHALL add a "Budget" destination to the desktop side rail and no tab on phones (there it opens from "Gérer le budget"). `/budget` and `/operations/recurrentes` carry `SHELL_BOOK_BOUND` and a title key.
- **REQ-8.2** IF a request answers `404 book.not_found` after a book switch or removal THEN THE SYSTEM SHALL refetch the books as spec 007 does, drop the stale answer and show the current book's data, not the old book's error.
- **REQ-8.3** WHEN an entry is added, edited or deleted, or a rule is created, edited or deleted, THE SYSTEM SHALL refetch the summary and the budget of the affected month only (the entry's month; both months when an edit moves an entry across months; for a rule, the current month and the months of the entries it made), and the recent and upcoming lists. Answers older than the latest request SHALL be dropped (`generation`, as in `OperationsStore`).
- **REQ-8.4** THE SYSTEM SHALL reset the new stores on account change (`provideDashboard`, `provideBudget`, `provideRecurring`, as `provideOperations` does) and clear a book's data when another is selected.
- **REQ-8.5** WHILE the device is offline THE SYSTEM SHALL show per-card `http.offline` messages with "Réessayer"; the budget save shows the offline message and keeps the draft.
- **REQ-8.6** THE SYSTEM SHALL compute "today" and month boundaries from the book's timezone (`todayIn(book.timezone)`), never the browser's.
- **REQ-8.7** THE SYSTEM SHALL format every amount with `formatMinor` and the book's `currency` (exponent 3, 2 or 0). Whole-unit rounding on the dashboard drops the exponent's decimals.
- **REQ-8.8** THE SYSTEM SHALL provide every user-visible text as ngx-translate keys in `public/i18n/{fr,en,ar}.json`; Arabic is a draft (`meta.reviewStatus`). Category names use the spec 007 labels and fallbacks (unknown or retired codes).
- **REQ-8.9** THE SYSTEM SHALL be usable with keyboard and screen reader: cards have headings, meters and bars have accessible names and values, status is never colour alone, focus returns to the opener when a dialog closes.
- **REQ-8.10** IF a request answers `422 validation.failed` for `month` (for example a month typed in the URL too far ahead) THEN THE SYSTEM SHALL fall back to the current month.

Checklist — covered?
- [x] Loading state (REQ-3.7)
- [x] Empty state (REQ-3.2, 4.1, 4.4, 5.11)
- [x] HTTP / network errors (REQ-3.7, 5.7, 6.5, 8.5)
- [x] Validation errors (REQ-5.7, 6.5, 8.10)
- [x] Unauthenticated / expired session (global interceptor and guards, spec 005; no new behaviour)
- [x] Date & timezone edge cases (REQ-4.2, 8.6)
- [x] i18n (REQ-8.8)

## Non-goals
- Pace chart and any other chart; DateField, AmountKeypad and Combobox stay deferred (spec 004).
- Insights ("+18 % vs ta moyenne"), provisions and sinking funds, pay-day months, notifications and reminders, exports, Capacitor widgets.
- Pause and resume of rules (no backend support), a "Répéter" option in the entry sheet, repeated occurrences of one rule in "À venir".
- Budget lines on leaves or on income and saving categories (the backend refuses them).

## Open questions
All answered by the owner on 2026-11-25 (every recommendation accepted, no mockups sent). Remaining risk: the backend 008 contract is still a draft (see Scope).
