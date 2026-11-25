# 007 — Categories and operations: Requirements

> Status: Approved (2026-11-25)
> Scope:
> - **Toolbox (`scope:shared`):** `@shared/util-format` learns any currency (minor units plus exponent) and "today in a timezone"; `ui-amount` gets a `currency` input. No new component (decision 7).
> - **App (`scope:expenses`):** `apps/expenses-management/src/app/categories/` and `operations/`, the shell's add button and nav, as in [spec 006](../006-households-books/design.md#placement).
>
> Backend contracts (not restated here):
> - [`005-categories/contract.md`](../../../personal-accountings-backend/specs/005-categories/contract.md): `GET /categories`, ETag, translation keys;
> - [`006-transactions/contract.md`](../../../personal-accountings-backend/specs/006-transactions/contract.md): entries, field codes, error order, throttle, `other-names`. Recurring rules are a non-goal.
>
> Design source: mockups canvas "Dépenses — maquettes de l'app (Olivier)", section 4 "Opérations" (phone and desktop) and section 5 (Arabic), plus the UX notes, as described by the owner (the canvas is not reachable from here).

## Context

After spec 006 a user has a selected book but cannot record anything. This spec adds the global category tree, the quick add sheet (amount first), the operations list of the selected book with filters, and editing and deleting an entry. Totals, the dashboard and the budget are spec 008. Amounts are in the book's currency, which may be TND (3 decimals) or another ISO currency, so the toolbox's money helpers stop being TND-only.

## User stories

- **US-1 — Money in any currency.** As a developer, I want the toolbox to format and parse amounts in any currency's minor unit, so that a EUR book shows cents and a TND book millimes.
- **US-2 — Category tree.** As a user, I want the categories to load fast and show in my language, so that picking one is instant.
- **US-3 — Category picker.** As a user, I want to browse top → group → leaf with emoji or search by name, with my recent leaves first.
- **US-4 — Quick add.** As a member of a book, I want to record an entry in 2–3 taps: amount, category, save.
- **US-5 — Operations list.** As a member of a book, I want to see its entries by day, newest first, filtered by month, type, category and author.
- **US-6 — Edit and delete.** As a member of a book, I want to correct or delete any entry of the book.
- **US-7 — Quality.** As a user, I want these screens in French, English and Arabic (RTL), accessible, with clear messages when something fails.

## Acceptance criteria (EARS)

### US-1 — Money in any currency (`@shared/util-format`, `ui-amount`)
- **REQ-1.1** THE SYSTEM SHALL provide `formatMinor(value, currency)` and a `minor` pipe, where `currency` is `{ code, exponent }`: an integer in minor units shown in `fr-TN` with exactly `exponent` decimals (TND 3, EUR 2, JPY 0). The millimes helpers stay and give the same output for TND.
- **REQ-1.2** THE SYSTEM SHALL provide `parseMajor(text, exponent)`, returning minor units or a reason (`empty`, `invalid`, `too_many_decimals`, `zero`, `too_large`):
  - digits are major units: `"1500"` is 1 500 dinars, never 1,5;
  - `,` and `.` are both the decimal separator, at most one of them; spaces (including narrow and non-breaking) are ignored;
  - more decimals than `exponent` is `too_many_decimals`; above `999999999999` minor units is `too_large`.
- **REQ-1.3** THE SYSTEM SHALL provide `todayIn(timeZone)` returning the local `YYYY-MM-DD` date in that IANA timezone, and `addDays` / `addYears` on such strings, without `toISOString`.
- **REQ-1.4** THE SYSTEM SHALL give `ui-amount` an optional `currency` input (default TND, exponent 3), so every existing use renders unchanged. `apps/ui-catalog` shows a EUR and a JPY amount.

### US-2 — Category tree (`app/categories/data/`)
- **REQ-2.1** THE SYSTEM SHALL provide `CategoriesApi.tree(etag?)` (`GET /categories`, `If-None-Match` when an ETag is known) returning the mapped tree and the new ETag, or `notModified` on `304`.
- **REQ-2.2** THE SYSTEM SHALL keep the tree and its ETag in `localStorage` under `expenses.categories` (global, no account data), in `try/catch`. WHEN the app needs categories THE SYSTEM SHALL show the stored copy at once and revalidate it once per session; `304` keeps the copy, `200` replaces it. A copy that cannot be read or parsed is dropped.
- **REQ-2.3** THE SYSTEM SHALL provide `CategoriesStore` (`providedIn: 'root'`; tree, `status`; async `load({ force? })` de-duplicated as in spec 006 REQ-1.5, returning a `StoreResult`) and derive: a lookup from any code to its leaf, group and top; the offerable leaves (not `retired`); a leaf's type and emoji (the group's when the leaf's is `null`).
- **REQ-2.4** THE SYSTEM SHALL name a category by translating `translation_key`. IF the key has no translation THEN it uses the parent's name. IF the code is not in the tree THEN it shows "Autre" with the group emoji fallback `📝`.
- **REQ-2.5** IF the tree cannot be loaded and no copy is stored THEN THE SYSTEM SHALL show, wherever categories are needed, an `ui-alert` "Catégories indisponibles" with "Réessayer", and disable saving. Entries still list with their codes resolved by REQ-2.4.

### US-3 — Category picker (`app/categories/parts/`)
- **REQ-3.1** THE SYSTEM SHALL provide a category picker in a `UiDialog` (sheet on phones): a list of top categories (emoji, name), then a top's groups, then a group's leaves, with a "Retour" step and the path as heading. Tops are ordered expense, income, saving, then the API order.
- **REQ-3.2** THE SYSTEM SHALL offer a search field across translated names of every level. A match on a top or group lists its offerable leaves; each result shows "Groupe › Feuille". Matching ignores case and accents. No result shows a one-line empty text.
- **REQ-3.3** IN entry mode THE SYSTEM SHALL let only offerable leaves be picked. IN filter mode (REQ-5.4) it lets a top, a group or a leaf be picked, retired ones included.
- **REQ-3.4** THE SYSTEM SHALL keep up to 6 recently used leaves per account and book in `localStorage` (`expenses.recentCategories.<accountId>.<bookId>`), most recent first, updated after each successful save. Retired and unknown codes are skipped when shown. They appear as chips at the top of the picker and in the quick add sheet.
- **REQ-3.5** THE SYSTEM SHALL make the picker keyboard and screen-reader usable: list items are buttons, the search field is labelled, focus moves to the new list's heading on each step and returns to the opener on close.

### US-4 — Quick add (`app/operations/parts/entry-sheet`)
- **REQ-4.1** THE SYSTEM SHALL enable the shell's "Ajouter une dépense" button (desktop rail) and add an add button in the top bar's trailing slot (phones) and on the operations page, on book-bound routes with a selected book. Each opens the entry sheet for the selected book, whose name is shown in the sheet.
- **REQ-4.2** THE SYSTEM SHALL put the amount first and focus it: one text input with `inputmode="decimal"`, parsed with `parseMajor` (REQ-1.2) using the book's exponent, and a live preview "= 1 500,000 DT" in the book's currency under it. An invalid value shows its reason under the field.
- **REQ-4.3** IF the amount is at or above 1 000 major units THEN THE SYSTEM SHALL, on the first save, show an inline warning repeating the amount and change the button to "Confirmer 1 500,000 DT"; the second press saves. Changing the amount clears the warning.
- **REQ-4.4** THE SYSTEM SHALL show the recent leaves as chips (REQ-3.4) and a "Choisir une catégorie" button opening the picker. The chosen leaf shows its emoji, name and type ("Dépense", "Revenu", "Épargne"); the type is never chosen separately.
- **REQ-4.5** WHEN the chosen leaf is an "Other" leaf THE SYSTEM SHALL show a required "Précisez" field (trimmed, at most 60) and up to 10 suggestions as chips from `GET other-names?category=`; picking a chip fills the field. A failed suggestions call shows no chips and no error.
- **REQ-4.6** THE SYSTEM SHALL default the date to today in the book's timezone (REQ-1.3), offer "Aujourd'hui" and "Hier" chips and a native date input limited to 2000-01-01 … today + 1 year.
- **REQ-4.7** THE SYSTEM SHALL offer an optional comment (trimmed, at most 200, counter shown near the limit).
- **REQ-4.8** WHEN the sheet opens THE SYSTEM SHALL create a UUID for the entry and send it as `id`. Every retry of that sheet (offline, `5xx`, throttled) resends the same `id`, so a save is never recorded twice.
- **REQ-4.9** WHEN `POST` answers `201` or `200` THE SYSTEM SHALL close the sheet, show a toast ("Dépense enregistrée", "Revenu enregistré", "Épargne enregistrée"), update the recents, and insert the entry into the list when it matches the book and the active filters.
- **REQ-4.10** WHILE a save runs THE SYSTEM SHALL show the button `loading` and ignore a second submit. Closing the sheet with typed data asks "Abandonner la saisie ?" (`UiConfirm`).

### US-5 — Operations list (`/operations`, `app/operations/pages/`)
- **REQ-5.1** THE SYSTEM SHALL provide `/operations` in the signed-in shell, book-bound, behind `workspaceGuard`, with an "Opérations" destination in the side rail and the bottom tabs (between "Accueil" and "Foyer").
- **REQ-5.2** THE SYSTEM SHALL list the selected book's entries newest first (API order), grouped by day in `ui-grouped-list`; group labels "Aujourd'hui", "Hier", else the long date in the UI language. No day or month totals (spec 008).
- **REQ-5.3** THE SYSTEM SHALL show each row as: emoji, name (the `other_name` for an "Other" leaf, else the translated leaf), the comment on a second line, the author's name ("par …") on household books, and the amount in the book's currency (`ui-amount`): income in the `income` tone, expense and saving `neutral` (never a danger colour). Names, comments and amounts are wrapped in `<bdi>`. A retired category shows normally.
- **REQ-5.4** THE SYSTEM SHALL provide filters in `ui-filter-bar`: month (`ui-month-switcher`, default the current month in the book's timezone, sent as `from`/`to`), type ("Tout", "Dépenses", "Revenus", "Épargne"), category (the picker in filter mode, shown as a removable chip) and author (a `ui-menu`: "Tous", the user, and the household's members on a household book). "Effacer les filtres" resets all but the month.
- **REQ-5.5** WHEN the end of the list is reached and `next_cursor` is set THE SYSTEM SHALL load the next page (25) and append it. WHEN `next_cursor` is `null` THE SYSTEM SHALL show "Toutes les opérations sont affichées" (only when more than one page was loaded).
- **REQ-5.6** WHILE the first page loads THE SYSTEM SHALL show skeleton rows; WHILE a next page loads, the list's loading row. A filter change during a load wins: an older answer is dropped.
- **REQ-5.7** WHEN the list is empty THE SYSTEM SHALL show `ui-empty-state`: without filters "Aucune opération ce mois-ci" with "Ajouter une dépense"; with filters "Aucune opération ne correspond" with "Effacer les filtres".
- **REQ-5.8** WHEN the selected book changes THE SYSTEM SHALL reset the category and author filters, keep the month and type, and reload the list for the new book.
- **REQ-5.9** IF the list answers `422 validation.failed` (`category.not_found` after a tree change, a malformed author) THEN THE SYSTEM SHALL reset the filters, reload and show a toast "Filtres réinitialisés". IF a page fails offline or with `5xx` THEN the list shows `ui-alert` with "Réessayer" and keeps the rows already loaded.

### US-6 — Edit and delete
- **REQ-6.1** WHEN a row is activated THE SYSTEM SHALL open the entry sheet in edit mode, prefilled, with "Créé par X · modifié par Y" and a "Supprimer" action.
- **REQ-6.2** WHEN the user saves an edit THE SYSTEM SHALL `PATCH` only the changed fields (`comment: null` when cleared) and replace the row with the answer. Unchanged data closes the sheet without a call.
- **REQ-6.3** WHILE the entry's leaf is retired THE SYSTEM SHALL show it with a "Catégorie retirée" badge and keep it unless the user picks another leaf; a retired leaf is never offered again.
- **REQ-6.4** WHEN the entry is moved to an "Other" leaf THE SYSTEM SHALL require `other_name` (REQ-4.5); on an unchanged "Other" leaf the stored name is prefilled and sent only if changed.
- **REQ-6.5** WHEN the user deletes THE SYSTEM SHALL ask for confirmation (`UiConfirm`, destructive), then call `DELETE`; on `204` remove the row, close the sheet and show a toast.

### Error paths (all writes)
- **REQ-7.1** IF a write answers `422 validation.failed` THEN THE SYSTEM SHALL put each code on its field, translated: `amount.required|integer|min|max`, `date.required|date_format|after_or_equal|before_or_equal`, `category.required|string|not_found|not_leaf|retired`, `other_name.required|prohibited|string|max`, `comment.string|max`, `id.uuid`.
- **REQ-7.2** IF a write answers `category.not_found`, `category.not_leaf` or `category.retired` THEN THE SYSTEM SHALL also revalidate the tree (`load({ force: true })`) and clear the chosen leaf.
- **REQ-7.3** IF a write answers `404 book.not_found` THEN THE SYSTEM SHALL close the sheet, reload the workspace (spec 006 REQ-7.4 fallback), and show a toast "Ce carnet n'est plus accessible".
- **REQ-7.4** IF an edit or delete answers `404 transaction.not_found` THEN THE SYSTEM SHALL remove the row, close the sheet and show a toast "Cette opération a été supprimée".
- **REQ-7.5** IF `POST` answers `409 transaction.id_conflict` THEN THE SYSTEM SHALL make a new `id` and retry once; a second `409` shows a generic error in the sheet.
- **REQ-7.6** IF a write answers `429 request.throttled` THEN THE SYSTEM SHALL show "Réessayez dans N s" above the save button (static, spec 006 REQ-3.6) and keep the data.
- **REQ-7.7** IF a write fails offline (`http.offline`) THEN THE SYSTEM SHALL keep the sheet open with its data, show `ui-alert` "Échec de l'enregistrement, vérifiez la connexion" and let the user retry with the same `id` (REQ-4.8). IF it fails with `5xx` THEN the error presenter shows its dialog (spec 005) and the sheet keeps its data and `id`. No offline queue.
- **REQ-7.8** WHEN the selected book changes while the sheet is open THE SYSTEM SHALL close it without saving and show a toast "Carnet changé, saisie abandonnée".
- **REQ-7.9** WHEN the account changes or the session ends THE SYSTEM SHALL reset the operations store (spec 006 REQ-1.6). The category tree is global and stays.

### US-7 — Quality
- **REQ-8.1** THE SYSTEM SHALL merge the backend's `categories.*` files (126 leaves, 33 groups, 11 tops) into the app's `public/i18n/{fr,en,ar}.json` (decision 8), and add `operations.*`, `categories.picker.*` and new `shell.*` keys there. Arabic stays flagged as a draft.
- **REQ-8.2** THE SYSTEM SHALL use logical properties only; `<bdi>` around amounts, names, comments and "Other" names; amounts stay left-to-right inside Arabic text.
- **REQ-8.3** THE SYSTEM SHALL declare on each request the codes it handles (REQ-5.9, 7.1–7.7) with `handling(...)`, so the error presenter never repeats them.
- **REQ-8.4** THE SYSTEM SHALL give `/operations` one `h1`, label every field with linked errors, announce the amount preview politely (`aria-live`), and give each row an accessible name "Catégorie, montant, date".
- **REQ-8.5** THE SYSTEM SHALL build the screens from specs 002–004 components, with no new toolbox component and no raw style values.
- **REQ-8.6** THE SYSTEM SHALL have unit tests (Vitest, jsdom, `HttpTestingController`) for the util-format additions, `ui-amount`, the APIs, the stores (ETag, storage, pagination, stale answers, each handled code), the picker, the sheet and the page. Written, not run (CLAUDE.md).
- **REQ-8.7** THE SYSTEM SHALL mark 007 in `docs/ROADMAP.md` and add it to `specs/README.md` when done.

## Unhappy paths checklist
- [x] Loading: skeletons and paging (REQ-5.6), `loading` save (REQ-4.10), tree from storage first (REQ-2.2)
- [x] Empty: no entries, with or without filters (REQ-5.7); no search result (REQ-3.2); end of pages (REQ-5.5)
- [x] HTTP / network: tree unavailable (REQ-2.5), list (REQ-5.9), writes offline or `5xx` (REQ-7.7)
- [x] Validation: client checks (REQ-4.2–4.7) and every field code (REQ-7.1–7.2)
- [x] 404 book / entry, 409, 429: REQ-7.3–7.6; order follows the contract
- [x] Retired category on edit: REQ-6.3; unknown code or missing label: REQ-2.4
- [x] Unauthenticated: spec 005 session expiry; reset on account change (REQ-7.9)
- [x] Dates: today and limits in the book's timezone (REQ-1.3, 4.6), month filter (REQ-5.4)
- [x] Book switched while the sheet is open: REQ-7.8. Duplicate save: REQ-4.8, 4.10
- [x] i18n / RTL: REQ-8.1, 8.2

## Non-goals
- Recurring rules (list, form, "Répéter" toggle): a later spec (decision 1).
- Totals per day or month, dashboard, budget (spec 008). Wallets, transfers, cash adjustment, attachments, offline queue, Capacitor.
- AmountKeypad, DateField and Combobox in the toolbox (decision 7). Text search over comments.

## Backend gaps (known limits; no workaround is built)
- **G1** No list of a book's authors: the author filter offers current household members only; entries by a former member cannot be filtered by author.
- **G2** No precondition on `PATCH` (`If-Match` / `updated_at`): two members editing the same entry, the last write wins silently.
- **G3** Category names ship as app files: a category added by the backend shows "Autre" or its parent's name until the app is updated (REQ-2.4).
- **G4** No per-user "recent categories": recents are local to the browser (REQ-3.4).

## Decisions (2026-11-25)
1. [x] **Scope:** `other-names` suggestions in 007; recurring rules in a later spec.
2. [x] **Amount:** one decimal input everywhere, major units, live preview, confirmation at or above 1 000 (REQ-1.2, 4.2, 4.3). No keypad.
3. [x] **Picker:** sheet with drill-down and search; recents in `localStorage` per account and book (REQ-3.x).
4. [x] **Currency:** extend `@shared/util-format` and `ui-amount` (REQ-1.x).
5. [x] **Filters:** month, type, category and author, author always shown (REQ-5.4).
6. [x] **Tree cache:** `localStorage` with the ETag (REQ-2.2).
7. [x] **Toolbox components:** none of AmountKeypad, DateField, Combobox.
8. [x] **Category labels:** merged into the main `public/i18n/{fr,en,ar}.json`.

## Open questions
Not blocking; each has a default.
- [ ] **Q1 Large-amount threshold.** 1 000 major units in any currency (REQ-4.3). **Proposed — owner to confirm.** Alternative: per currency (e.g. 1 000 TND, 500 EUR).
- [ ] **Q2 Number locale.** Amounts use `fr-TN` in every UI language, as today (REQ-1.1). **Proposed — owner to confirm.** Alternative: the UI language's locale (`ar-TN` digits in Arabic).
- [ ] **Q3 Filters in the URL.** Filters live in the store and reset on reload (REQ-5.4). **Proposed — owner to confirm.** Alternative: query parameters (`?mois=2026-11&type=expense`), so back and reload keep them.
- [ ] **Q4 `ui-amount` input name.** Keep `millimes` (it now means "minor units" when `currency` is set) to avoid touching every use. **Proposed — owner to confirm.** Alternative: rename to `minor` in the same task.
- [ ] **Q5 Saving tone.** Saving entries use the neutral tone, like expenses (REQ-5.3). **Proposed — owner to confirm.** Alternative: a new `saving` tone on `ui-amount` (toolbox change).
