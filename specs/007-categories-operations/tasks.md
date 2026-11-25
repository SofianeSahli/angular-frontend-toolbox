# 007 — Categories and operations: Tasks

> Status: Approved (2026-11-25), implemented
> Design: [design.md](./design.md)

Each task is at most ~150 lines of diff (i18n JSON aside), with its tests written first. Verification of every task: left to CI and the owner (no tests, lint, build, serve or browser run by Claude). One commit per task at most; push once at the end.

- [x] **T1** — `@shared/util-format`: `formatMinor`, `parseMajor`, `MinorPipe` (REQ-1.1, 1.2)
  - Files: `shared/util/format/src/lib/{money,pipes}.ts` + specs (TND/EUR/JPY, every parse reason, `"1500"`, `"1,5"`, `"1.5"`, spaces, two separators)
  - Verification: left to CI and the owner
- [x] **T2** — `@shared/util-format` dates `todayIn`, `addDays`, `addYears`; `ui-amount` `currency` input; ui-catalog EUR and JPY states (REQ-1.3, 1.4)
  - Verify: dates spec (timezone around midnight, 29 February), amount spec (default unchanged, EUR)
  - Verification: left to CI and the owner
- [x] **T3** — Categories models, mappers, `categories-storage`, `CategoriesApi` with ETag; check how the interceptor treats `304` first (design Risks) (REQ-2.1, 2.2)
  - Files: `app/categories/data/{models,mappers,categories-storage,categories-api}.ts` + specs
  - Verification: left to CI and the owner
- [x] **T4** — `CategoriesStore`, `CategoryLabels`, `recent-categories` (REQ-2.2–2.4, 3.4)
  - Verify: hydrate-then-revalidate, `304`, corrupt storage, label fallbacks, accent-insensitive search, recents cap
  - Verification: left to CI and the owner
- [x] **T5** — Merge backend `categories.*` into `public/i18n/{fr,en,ar}.json`; add `categories.picker.*`, `categories.unknown` (REQ-8.1)
  - Verify: keys present in all three files with the same leaves; note the backend commit copied
  - Verification: left to CI and the owner
- [x] **T6** — `CategoryPicker` and `CategoryChip` (REQ-3.1–3.3, 3.5, 2.5)
  - Verify: drill-down, back, search results, entry vs filter mode, retired hidden, focus moves
  - Verification: left to CI and the owner
- [x] **T7** — Operations models, mappers, `EntriesApi`, `OtherNamesApi`, `entry-draft` (REQ-4.8, 6.2, 6.4, 8.3)
  - Verify: `HttpTestingController` (paths, snake_case, filters, cursor, `handling` codes), `diff` cases
  - Verification: left to CI and the owner
- [x] **T8** — `OperationsStore` and `provideOperations` (REQ-5.5, 5.6, 5.8, 5.9, 4.9, 6.5, 7.4, 7.9)
  - Verify: pagination, stale generation dropped, insert when matching, book switch, reset on account change
  - Verification: left to CI and the owner
- [x] **T9** — `EntrySheet` add mode and `EntrySheetService`; `operations.sheet.*`, `operations.fields.*`, `operations.amount.*`, `operations.errors.*` keys fr/en/ar (REQ-4.2–4.10, 7.1–7.3, 7.5–7.8)
  - Verify: amount preview and reasons, big-amount two-step, other-name chips, date chips and limits, same `id` on retry, new `id` after `409`, every handled code, book switch closes
  - Verification: left to CI and the owner
- [x] **T10** — `EntrySheet` edit mode and delete (REQ-6.1–6.5, 7.4)
  - Verify: prefill, retired badge, PATCH diff only, no call when unchanged, confirm then delete, `transaction.not_found`
  - Verification: left to CI and the owner
- [x] **T11** — `EntryRow`, `OperationsFilters`, `day-groups` (REQ-5.2–5.4, 8.2, 8.4)
  - Verify: row content and tones, author only on household books, filters emit, day labels in the book's timezone
  - Verification: left to CI and the owner
- [x] **T12** — `OperationsPage`; `operations.*` page keys fr/en/ar (REQ-5.1–5.7, 5.9, 2.5)
  - Verify: skeleton, empty with and without filters, end text, error alert keeps rows, add button
  - Verification: left to CI and the owner
- [x] **T13** — Wiring: route and `PATHS.operations`, `provideOperations` in `app.config.ts`, shell add buttons (rail and top bar), "Opérations" nav, `shell.*` keys (REQ-4.1, 5.1)
  - Verify: routes spec, shell spec (button enabled only with a selected book)
  - Verification: left to CI and the owner
- [x] **T14** — Report: verification table, `specs/README.md` entry, ROADMAP (REQ-8.6, 8.7)
  - Verification: left to CI and the owner

## Deviations from spec

- **D1 (T1):** `formatMinor(value, currency, options?)` takes an optional `{ display: 'full' | 'rounded', signed }` so `ui-amount` and the millimes helpers share one formatter; the millimes helpers now delegate to it (same output). Also exported: `TND`, `MAX_MINOR`, `assertMinor`, `CurrencyFormat`, `ParseResult`.
- **D2 (T3):** the interceptor turns a `304` into an `ApiError` with code `http.304` (kind `server`). Listing it in `handling(...)` keeps it off the error bus, so no toolbox change was needed (design Risks).
- **D3 (T4, T11, T12):** `i18n/translation-revision.ts` (`injectTranslationRevision`) re-runs computed labels on language or translation change; used by `CategoryLabels`, `EntryRow`, `OperationsFilters`, `OperationsPage`.
- **D4 (T6):** at the picker's root step there is no heading, so "Retour" moves focus to the search field.
- **D5 (T7, T8):** pure helpers in `operations/data/filters.ts` (`monthRange`, `defaultFilters`, `matches`, `insertInOrder`). Store writes take the book explicitly: `create(bookId, input)`, `update(bookId, id, patch)`, `remove(bookId, id)`, returning `WriteResult` (`StoreResult` plus the saved entry), because the sheet also opens outside the page. A new entry that would land after the last loaded row while more pages exist is not inserted (it comes with paging). Added `reload()` and `setActive()`.
- **D6 (T8):** the list's `validation.failed` toast "Filtres réinitialisés" is shown by `OperationsStore` itself, because a book-switch reload has no page caller.
- **D7 (T7):** `OtherNamesApi` also lists `server.error` and `server.unavailable` as handled, so suggestions stay silent on `5xx` (REQ-4.5).
- **D8 (T9):** the close guard is built by `EntrySheet` overriding `UI_DIALOG_CONTEXT` for its header; `EntrySheetService` sets `disableClose` and routes backdrop clicks and Escape to the same guard. The book-switch close (REQ-7.8) lives in `EntrySheet` (an effect), not in the service.
- **D9 (T9, T10):** the big-amount confirmation (REQ-4.3) also applies in edit mode when the amount changes.
- **D10 (T5):** `i18n/translation-files.spec.ts` checks the `categories`, `operations` and `shell` keys are the same in fr/en/ar and that the tree holds 11/33/126 labels. Category labels copied from backend `personal-accountings-backend` commit `0bd6f91` (`specs/005-categories/translations/`).

## Verification report
| REQ | Verified how | Result |
|---|---|---|
| 1.1–1.2 | `shared/util/format` `money.spec.ts`, `pipes.spec.ts` | left to CI and the owner |
| 1.3 | `dates.spec.ts` (timezone around midnight, 29 February) | left to CI and the owner |
| 1.4 | `amount.spec.ts`; ui-catalog EUR and JPY states | left to CI and the owner |
| 2.1 | `categories-api.spec.ts` (ETag, `304`, handled codes) | left to CI and the owner |
| 2.2–2.3 | `categories-storage.spec.ts`, `categories.store.spec.ts` | left to CI and the owner |
| 2.4 | `category-labels.spec.ts` | left to CI and the owner |
| 2.5 | `categories.store.spec.ts` (error status); alert in `category-picker`, `entry-sheet`, `operations-page` templates | left to CI and the owner |
| 3.1–3.3, 3.5 | `category-picker.spec.ts` | left to CI and the owner |
| 3.4 | `recent-categories.spec.ts`, `category-picker.spec.ts` | left to CI and the owner |
| 4.1 | `signed-in-shell.spec.ts`, `entry-sheet.service.spec.ts`, `operations-page.spec.ts` | left to CI and the owner |
| 4.2–4.10 | `entry-sheet.spec.ts` (add mode), `entry-draft.spec.ts`, `entries-api.spec.ts` | left to CI and the owner |
| 5.1 | `app.routes.spec.ts`, `signed-in-shell.spec.ts` | left to CI and the owner |
| 5.2–5.7 | `operations-page.spec.ts`, `entry-row.spec.ts`, `operations-filters.spec.ts`, `day-groups.spec.ts`, `operations.store.spec.ts` | left to CI and the owner |
| 5.8, 7.9 | `operations.store.spec.ts` (`provideOperations` effects) | left to CI and the owner |
| 5.9 | `operations.store.spec.ts`, `operations-page.spec.ts` | left to CI and the owner |
| 6.1–6.5 | `entry-sheet.spec.ts` (edit mode), `entry-draft.spec.ts`, `operations.store.spec.ts` | left to CI and the owner |
| 7.1–7.8 | `entry-errors.spec.ts`, `entry-sheet.spec.ts` | left to CI and the owner |
| 8.1 | `translation-files.spec.ts` | left to CI and the owner |
| 8.2, 8.4, 8.5 | templates (`<bdi>`, `aria-live`, row `aria-label`, one `h1`), `entry-row.spec.ts`, `operations-page.spec.ts` | left to CI and the owner |
| 8.3 | `categories-api.spec.ts`, `entries-api.spec.ts` | left to CI and the owner |
| 8.6 | the specs above (written, not run) | left to CI and the owner |
| 8.7 | `docs/ROADMAP.md`, `specs/README.md` | done |

## Follow-up fixes (post-merge)

Mobile polish found after the merge, shipped in [#11](https://github.com/SofianeSahli/angular-frontend-toolbox/pull/11) without a new spec. Verification: left to CI and the owner.

1. **Dialog body scrolls on phones** (toolbox Dialog organism). The CDK injects its overlay and dialog-container styles at runtime outside any cascade layer (`.cdk-overlay-pane { max-height: 100% }`, `.cdk-dialog-container { display: block; max-height: inherit }`), and these beat every rule in `@layer ui`. The pane's own cap never applied, and the container inherited a bare `100%` that resolved against a parent with no definite height. `UiDialog` now passes the cap as CDK `maxHeight` (inline, `var(--ui-overlays-pane-max-block-size)`, set per variant in `overlays.scss`), and the content host and an optional `<form>` inherit it as a flex column. Only `[uiDialogBody]` scrolls, the footer stays visible with the safe-area inset, and sheet footers put two buttons side by side. The entry sheet shows field errors only after a save attempt or after typing in and leaving a field. Specs: `dialog.spec.ts`, `entry-sheet.spec.ts`.
2. **Add action in the phone bottom tabs.** The shell uses the existing toolbox `uiTabAction` on Accueil and Opérations, in place of the top-bar "+". The app shell pads its main area while the tabs hold an action. Specs: `app-shell.spec.ts`, `signed-in-shell.spec.ts`.
3. **Category picker accordion.** Tops and groups expand in place (one open at a time) with a `grid-template-rows` animation, in place of the drill-down. Filter mode starts each open branch with an "All of" row (`categories.picker.allOf`). Spec: `category-picker.spec.ts`.
