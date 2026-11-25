# 007 — Categories and operations: Design

> Status: Approved (2026-11-25)
> Requirements: [requirements.md](./requirements.md)

## Overview

Two new app feature folders follow [spec 006's layout](../006-households-books/design.md#placement): `categories/` (global tree, labels, picker) and `operations/` (entries, sheet, list page). Stores follow the 006 pattern: `signalStore({ providedIn: 'root' })`, `async` methods with `try/catch` returning `StoreResult`, no `rxMethod`. The only toolbox work is currency-aware money and timezone dates in `@shared/util-format`, and a `currency` input on `ui-amount` (decision 4).

## Placement

```
shared/util/format/src/lib/   money.ts (+ formatMinor, parseMajor), dates.ts (+ todayIn, addDays, addYears), pipes.ts (+ MinorPipe)
shared/ui/atoms/src/lib/amount/   currency input
apps/ui-catalog/                  EUR and JPY amount states
apps/expenses-management/src/app/
  categories/
    data/      models.ts, mappers.ts, categories-api.ts, categories-storage.ts, categories.store.ts,
               category-labels.ts, recent-categories.ts
    parts/     category-picker.ts (dialog content), category-chip.ts (emoji + name)
  operations/
    data/      models.ts, mappers.ts, entries-api.ts, other-names-api.ts, operations.store.ts,
               entry-draft.ts (form ↔ request, diff for PATCH), provide-operations.ts
    parts/     entry-sheet.ts (add and edit), entry-row.ts, operations-filters.ts
    pages/     operations-page.ts
    support/   entry-errors.ts (code → field and message), day-groups.ts
    entry-sheet.service.ts   opens the sheet from the shell and the page
  shell/       add button enabled, top-bar add, "Opérations" nav
```

| Piece | Where | Reason |
|---|---|---|
| Currency money, `todayIn` | `@shared/util-format` | Brand-free, every app with money needs it; TND helpers kept (REQ-1.1). |
| `ui-amount` `currency` | `@shared/ui-atoms` | Presentational; default TND keeps all uses unchanged (REQ-1.4). |
| Categories, operations | the app | Expenses domain (ARCHITECTURE §2). |
| Picker, sheet | app `parts/` | Read stores and translations; built from `ui-search-field`, `ui-list`, `ui-chip-group`, `UiDialog`. No Combobox (decision 7). |
| Date field | inline in the sheet | Native `input[uiInput][type=date]` + two chips; no DateField molecule (decision 7). |

`operations/` imports `categories/data` and `households/data` (`BooksStore`, `HouseholdStore`, `StoreResult`, `retryText`, `applyFieldErrors`). `categories/` imports `households/data` only for `StoreResult`.

## Reuse

- Molecules: `ui-form-field`, `ui-search-field`, `ui-list`/`ui-list-item`, `ui-chip-group`, `ui-segmented-control` (type filter), `ui-month-switcher`, `ui-menu` (author), `ui-empty-state`, `ui-alert`, `ui-section-header`.
- Organisms: `UiDialog` (`presentation: 'auto'`: sheet on phones), `UiConfirm`, `UiToast`, `ui-filter-bar`, `ui-grouped-list` (`groups`, `itemTemplate`, `loading`, `empty`, `endReached`), `ui-top-bar` (`uiTopBarTrailing`).
- Atoms: `ui-amount`, `uiInput`, `uiButton`, `ui-badge`, `ui-chip`, `ui-skeleton`, `ui-icon`.
- HTTP: `handling(...)`, `ApiError` (`fields`, `retryAfterSeconds`, `code` `http.offline`). 006: `toResult`, `retryText`, `applyFieldErrors`, `workspaceGuard`, `provideHouseholds` reset pattern.
- **New toolbox components: none.**

## Toolbox API (REQ-1.x)

```ts
interface CurrencyFormat { code: string; exponent: number }          // = 006 Book.currency
formatMinor(value: number, currency: CurrencyFormat): string           // fr-TN, exactly `exponent` decimals
type ParseResult = { ok: true; minor: number } | { ok: false; reason: 'empty'|'invalid'|'too_many_decimals'|'zero'|'too_large' };
parseMajor(text: string, exponent: number): ParseResult                // integer arithmetic on the digit string, no float
todayIn(timeZone: string, now = new Date()): string                    // Intl.DateTimeFormat('en-CA', { timeZone })
addDays(iso: string, n: number): string; addYears(iso: string, n: number): string
@Pipe({ name: 'minor' }) MinorPipe                                     // value | minor: book.currency
// ui-amount: currency = input<CurrencyFormat>({ code: 'TND', exponent: 3 })
```

## Models & API

```ts
type CategoryType = 'expense' | 'income' | 'saving';
interface Leaf { code: string; key: string; emoji: string | null; retired: boolean; isOther: boolean }
interface Group { code: string; key: string; emoji: string; retired: boolean; leaves: Leaf[] }
interface Top { code: string; key: string; emoji: string; type: CategoryType; retired: boolean; groups: Group[] }
interface Person { id: string; name: string }
interface Entry { id: string; amount: number; currency: string; date: string; type: CategoryType;
  category: string; otherName: string | null; comment: string | null; recurringRuleId: string | null;
  createdBy: Person; updatedBy: Person; createdAt: Date; updatedAt: Date }
interface EntryInput { id?: string; amount: number; date: string; category: string; otherName?: string | null; comment?: string | null }
interface EntryFilters { from: string; to: string; type: CategoryType | null; category: string | null; author: string | null }
interface Page<T> { items: T[]; nextCursor: string | null }
```

| Client | Method → endpoint | Handled codes (`handling`) |
|---|---|---|
| `CategoriesApi` | `tree(etag?)` → GET `categories` (`observe: 'response'`) → `{ tree, etag } \| 'notModified'` | `http.offline`, `http.304` (falls back to the stored copy) |
| `EntriesApi` | `page(book, filters, cursor?)` → GET `books/{b}/transactions` | `validation.failed` |
| | `create(book, input)` → POST · `update(book, id, patch)` → PATCH · `remove(book, id)` → DELETE | `validation.failed`, `book.not_found`, `transaction.not_found`, `transaction.id_conflict`, `request.throttled`, `http.offline` (`5xx` stays with the presenter) |
| `OtherNamesApi` | `list(book, leaf)` → GET `books/{b}/other-names?category=` | all (silent, REQ-4.5) |

Requests are snake_case, models camelCase (006 mappers). `page` sends only set filters. `create` always sends `id`.

## State (stores)

- **`CategoriesStore`** — state `tops`, `etag`, `status` (`idle | loading | ready | error`), `revalidated` (per session). `load({ force? })`: hydrates from `categories-storage` first (status `ready` if a copy exists), then calls `tree(etag)` once per session (de-duplicated promise); `200` writes storage, `304` keeps. Computed: `index` (`Map<code, { top, group?, leaf? }>`), `offerableLeaves`, `tops` ordered expense → income → saving. Never reset on account change (REQ-7.9).
- **`category-labels.ts`** — `CategoryLabels` service: `name(code)` via `TranslateService.instant`, with the REQ-2.4 fallbacks (a result equal to the key counts as missing); `emoji(code)`; `path(code)` "Groupe › Feuille"; `search(text)` normalises with `NFD` and strips marks, then matches every level.
- **`recent-categories.ts`** — `read(accountId, bookId)`, `push(...)`, max 6, `try/catch` (REQ-3.4).
- **`OperationsStore`** — state `bookId`, `filters`, `entries`, `nextCursor`, `status` (`idle | loading | ready | error`), `pageStatus` (`idle | loading | error`), `pages`. Methods:
  - `open(bookId)`: sets the book, default filters (current month by `todayIn(book.timezone)`), loads page 1;
  - `setFilters(partial)`, `clearFilters()`: reload page 1; `loadMore()`: no-op without cursor or while loading;
  - `create(input)`, `update(id, patch)`, `remove(id)`: return `StoreResult` (plus the entry); on success insert (if `matches(filters)`), replace or remove; on `transaction.not_found` remove the row;
  - `reset()`.
  - **Stale answers (REQ-5.6):** each list call takes a `generation` number; an answer whose generation is old is dropped.
  - **Book switch (REQ-5.8):** an `effect` in `provideOperations()` watches `BooksStore.selectedBookId()` and calls `open(id)` with the author and category filters cleared, when the page is active (store flag `active`, set by the page on init/destroy). The same initializer resets the store on account change (REQ-7.9).
- **`entry-draft.ts`** — pure functions: `toInput(form, exponent)`, `diff(entry, form)` → PATCH body (only changed fields, `comment: null` when cleared, `other_name` only when changed, REQ-6.2, 6.4).

## Components

| Component | Inputs / outputs | Notes |
|---|---|---|
| `EntrySheetService` | `openNew()`, `openEdit(entry)` | Opens `UiDialog` (`auto`, `md`) with `EntrySheet`; refuses when no selected book. Closes the dialog with a toast when `selectedBookId` changes (REQ-7.8). |
| `EntrySheet` | dialog data `{ book, entry? }` | Reactive form: `amount` (text, `parseMajor` validator), `category` (leaf code), `otherName`, `date`, `comment`. `id = crypto.randomUUID()` at open, new only after a `409` (REQ-4.8, 7.5). Preview `formatMinor` in an `aria-live="polite"` span. Big-amount two-step state (REQ-4.3). Recents chips, picker button, other-names chips, date chips, comment counter. Edit mode: meta line, retired badge, "Supprimer" → `UiConfirm`. Close guard when dirty (REQ-4.10). |
| `CategoryPicker` | dialog data `{ mode: 'entry' \| 'filter', recents }` → closes with a code | Levels in a signal (`top`, `group`), search `ui-search-field`; results are `ui-list-item` buttons; heading gets focus on each step (REQ-3.5). |
| `CategoryChip` | `code`, `otherName?` | emoji + name, `<bdi>`; used by rows, sheet and the filter chip. |
| `EntryRow` | `entry`, `currency`, `showAuthor`; output `open` | One button row; `ui-amount` with `currency` and tone (REQ-5.3); accessible name (REQ-8.4). |
| `OperationsFilters` | `filters`, `authors`; output `change`, `clear` | `ui-filter-bar`: month switcher, segmented type, category chip or "Catégorie" button, author `ui-menu`. |
| `OperationsPage` | — | `ui-page` with `h1` "Opérations", add button, filters, `ui-grouped-list` (groups from `day-groups.ts`: key = date, label via `todayIn`), empty templates, error `ui-alert`, end text. Authors: the user + `HouseholdStore.members` (loads detail on household books). |

Shell: the rail's "Ajouter une dépense" button loses `disabled` and calls `EntrySheetService.openNew()`; on `bookBound` routes with a selected book, the top bar gets an icon button in `uiTopBarTrailing` (`aria-label` "Ajouter une dépense"); rail and tabs get "Opérations" (`list` icon added to `SHELL_ICONS`).

## Error flow

Every store method `try/catch`es and returns `StoreResult`; the sheet maps `error.code` with `support/entry-errors.ts`:

| Code | Sheet / page reaction | REQ |
|---|---|---|
| `validation.failed` | `applyFieldErrors` with `operations.fields.<field>.<rule>`; if a `category.*` code: `CategoriesStore.load({ force: true })`, clear leaf | 7.1, 7.2 |
| `book.not_found` | close, `BooksStore.load({ force: true })`, toast | 7.3 |
| `transaction.not_found` | remove row, close, toast | 7.4 |
| `transaction.id_conflict` | new `id`, retry once | 7.5 |
| `request.throttled` | `retryText` above the button | 7.6 |
| `http.offline` | `ui-alert` in the sheet, keep `id` | 7.7 |
| `5xx` | not handled: the presenter's server-error dialog; the sheet stays open with its data and `id` | 7.7 |
| list `validation.failed` | `clearFilters()`, toast | 5.9 |
| list offline / `5xx` | presenter toast + page `ui-alert` "Réessayer" (not handled, so the presenter still speaks) | 5.9 |

## Routing

```ts
// child of SignedInShell
{ path: routePath(PATHS.operations), canActivate: [workspaceGuard], loadComponent: OperationsPage,
  data: { [SHELL_TITLE_KEY]: 'operations.title', bookBound: true } },
```

`PATHS.operations = '/operations'`. `provideOperations()` is added to `app.config.ts` next to `provideHouseholds()`.

## i18n keys

- Merged from the backend: `categories.<code>.label` (170 leaves per language; decision 8). Sync is a copy of the subtree; the task records the backend commit it came from.
- `categories.picker.*` (title, search, back, recents, noResult, retired, unavailable, retry), `categories.unknown`.
- `operations.title`, `operations.add`, `operations.types.*`, `operations.filters.*`, `operations.empty.*`, `operations.list.*` (today, yesterday, by, end, error), `operations.sheet.*` (titles, amount, preview, confirmBig, otherName, suggestions, date, today, yesterday, comment, meta, delete, discard), `operations.toasts.*`, `operations.errors.<code>`, `operations.fields.<field>.<rule>` (every code of REQ-7.1), `operations.amount.<reason>` (REQ-1.2 reasons).
- `shell.operations`, `shell.addExpense` (existing), `shell.addExpenseSoon` removed.

## Requirement coverage

| REQ | Where |
|---|---|
| 1.1–1.4 | `@shared/util-format` money, dates, pipes; `ui-amount`; ui-catalog |
| 2.1–2.3 | `CategoriesApi`, `categories-storage`, `CategoriesStore` |
| 2.4 | `CategoryLabels` |
| 2.5 | `EntrySheet`, `CategoryPicker`, `OperationsPage` (alert when `status === 'error'` and no tree) |
| 3.1–3.5 | `CategoryPicker`, `recent-categories` |
| 4.1 | shell, `EntrySheetService`, `OperationsPage` |
| 4.2–4.10 | `EntrySheet`, `OtherNamesApi`, `entry-draft`, `OperationsStore.create` |
| 5.1 | routes, shell nav |
| 5.2–5.7 | `OperationsPage`, `EntryRow`, `OperationsFilters`, `day-groups`, `OperationsStore` |
| 5.8, 7.9 | `provideOperations` effects |
| 5.9 | `OperationsStore` list errors, `OperationsPage` |
| 6.1–6.5 | `EntrySheet` edit mode, `entry-draft.diff`, `OperationsStore.update/remove` |
| 7.1–7.8 | `entry-errors.ts`, `EntrySheet`, `EntrySheetService` |
| 8.1 | i18n files; 8.2, 8.4–8.5 templates; 8.3 table above; 8.6 each task; 8.7 last task |

## Risks / alternatives considered

- **`304` through the interceptor.** Spec 005's interceptor may turn a `304` into an `ApiError` and publish it. T4 checks first; if it does, the fix (treat `304` as a response, not an error) is a one-line toolbox change in `@shared/http-data-access`, made only with the owner's approval. Browsers may also answer `200` from their own cache: harmless.
- **Toolbox changes beyond components:** `formatMinor`, `parseMajor`, `todayIn`, `addDays`, `addYears`, `MinorPipe` and `ui-amount.currency` (decision 4). No other toolbox change is planned.
- **Imports across app feature folders** (`operations/` → `households/data`, `households/support`): allowed by convention (ARCHITECTURE §2). Moving `store-result`, `retry-text` and `server-errors` to a shared app folder was rejected for now: it would touch 006 code without a behaviour change.
- **Large i18n files** (decision 8): +170 keys per language; key order follows the backend file so a later sync is a subtree replace.
- **Client "today"** uses the device clock in the book's timezone; a wrong clock is caught by the server's `date.*` codes (REQ-7.1).
- **Inserting a new entry** into a filtered list uses `matches(filters)` client-side; a mismatch only means the entry appears after the next reload.
- **Rejected:** `rxMethod` stores (006); an offline queue (non-goal); a keypad, DateField and Combobox (decision 7); recents from loaded entries (decision 3).
