# 006 — Households and books: Requirements

> Status: Draft (2026-11-24), waiting for the owner's approval
> Scope:
> - **Toolbox (`scope:shared`):** nothing new. Households and books are expenses-domain, so no `shared/` library and no new toolbox component (see design "Placement" and "Risks").
> - **App (`scope:expenses`):** all code under `apps/expenses-management/src/app/` (no new library, see decision 5); the signed-in shell moves there too. Works against the real backend like [spec 005](../005-identity/requirements.md).
>
> Backend contracts:
> - [`003-households/contract.md`](../../../personal-accountings-backend/specs/003-households/contract.md): households, members, books;
> - [`004-invitations/contract.md`](../../../personal-accountings-backend/specs/004-invitations/contract.md): invitations, leave, remove.
>
> Design source: mockups canvas "Dépenses — maquettes de l'app (Olivier)", section 2 "Foyer et carnet", the book switcher of section 3, and the Arabic versions of section 5 (not reachable from here; screens as described by the owner).
>
> Architecture: [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) §2, §3, §8. Components: [spec 004](../004-molecules-organisms-templates/) (read via [specs/README.md](../README.md)).

## Context

After spec 005 a user can sign in but nothing exists for them: the backend creates nothing at sign-up. Money belongs to a **book**: a personal book (at most 5 per account, any ISO currency, own timezone) or the household's single book. A user belongs to at most one household. This spec adds the first-run choice, the household and book creation flows, the received invitations, the household page (members, invitations) and the book switcher. The dashboard itself is spec 008: the selected book gets a placeholder page.

Backend rules are decided and not reopened here: see the contracts. Books are created once with a currency that never changes (the form says so). A household always keeps its owner: there is no ownership transfer, an owner who wants out deletes the household.

## User stories

- **US-1 — Workspace data.** As a developer, I want typed clients and stores for households, books and invitations, so that screens never handle transport or pagination.
- **US-2 — First run.** As a new user with no book, I want to be guided to create a household or a personal book, so that I can start.
- **US-3 — Create household and book.** As a user, I want to create a household (step 1 of 2) and its book (step 2 of 2), or only a personal book, so that I can record money.
- **US-4 — Received invitations.** As an invited user, I want to see my pending invitations in the app and accept or decline them, so that I can join a household.
- **US-5 — Run my household.** As a household owner, I want to rename or delete the household, invite people by email, cancel invitations and remove members.
- **US-6 — Member view.** As a household member, I want to see the household and its members and be able to leave it.
- **US-7 — Book switcher.** As a user with several books, I want to switch between my personal books and the household book from the top bar or the side rail, and have my choice remembered.
- **US-8 — Quality.** As a user, I want these screens in French, English and Arabic (right to left), usable by keyboard and screen reader, with clear messages when something fails.

## Acceptance criteria (EARS)

### US-1 — Workspace data (`app/households/data/`)
- **REQ-1.1** THE SYSTEM SHALL provide `HouseholdsApi`, `BooksApi` and `InvitationsApi`, typed clients for every endpoint of contracts 003 and 004 **except the three QR routes** (non-goal). Requests are snake_case, models camelCase (`Book.canManage`, `Invitation.expiresAt`…). Every method accepts an optional `HttpContext` from `handling(...)` ([spec 005 REQ-1.6](../005-identity/requirements.md)).
- **REQ-1.2** WHEN a list endpoint has a `next_cursor` THE SYSTEM SHALL follow it until `null` and return every item (25 per page).
- **REQ-1.3** THE SYSTEM SHALL provide `BooksStore` (books, `selectedBookId`, load `status`: `idle | loading | ready | error`), `HouseholdStore` (household or `null`, members, sent invitations) and `InvitationsStore` (received invitations), all `providedIn: 'root'`.
- **REQ-1.4** THE SYSTEM SHALL expose each store method as an `async` function that catches its errors and resolves to `{ outcome: 'done' } | { outcome: 'error', error: ApiError }`, so a failure never leaves a store unusable and pages can react to a code.
- **REQ-1.5** WHEN `load()` is called THE SYSTEM SHALL fetch `GET households` and `GET books` together, once per session (`load({ force: true })` refetches). WHILE a load runs, a second call waits for it instead of sending another.
- **REQ-1.6** WHEN the signed-in account changes or the session leaves `authenticated` THE SYSTEM SHALL reset all three stores to their initial state, so one account never sees another's data on a shared browser.
- **REQ-1.7** THE SYSTEM SHALL derive from the stores: `householdBook` (the book whose owner is the household), `personalBooks`, `canCreatePersonalBook` (fewer than 5 personal books), `isOwner` and `isMember`.

### US-2 — First run (`/bienvenue`, `app/households/pages/`)
- **REQ-2.1** WHEN a signed-in user opens a book-bound route (`/`) THE SYSTEM SHALL wait for the workspace to load (REQ-1.5), then:
  - with at least one book, let the navigation through;
  - with no book, go to `/bienvenue`.

  Routes that need no book (`/compte`, `/foyer`) never redirect.
- **REQ-2.2** IF the workspace load fails offline or with a server error THEN THE SYSTEM SHALL go to the existing unavailable page with the requested URL as `returnUrl` ([spec 005 REQ-3.3](../005-identity/requirements.md)); a later navigation retries the load.
- **REQ-2.3** THE SYSTEM SHALL provide `/bienvenue` on `ui-flow-layout` (no shell), behind `authGuard`, in one of three states:
  - **A, no household:** `ui-option-cards` "Créer un foyer" and "Carnet personnel seulement", and a "Continuer" button;
  - **B, owner of a household without a book:** a resume card "Votre foyer « … » n'a pas encore de carnet" with "Créer le carnet du foyer" (`/carnets/nouveau?foyer=1`), plus the personal-book option;
  - **C, member of a household without a book:** an `ui-alert` saying the owner has not created the household's book yet, plus the personal-book option.
- **REQ-2.4** WHEN pending invitations exist and the user has no household THE SYSTEM SHALL show them as cards above the choice (US-4).
- **REQ-2.5** WHEN the user continues THE SYSTEM SHALL go to `/foyer/nouveau` ("Créer un foyer") or to `/carnets/nouveau` ("Carnet personnel seulement").
- **REQ-2.6** IF `/bienvenue` is opened by a user who already has a book THEN THE SYSTEM SHALL go to `/`.
- **REQ-2.7** WHILE the workspace or the invitations load THE SYSTEM SHALL show a skeleton, not the choice. A failed invitations load shows no card and never blocks the choice.

### US-3 — Create household and book
- **REQ-3.1** THE SYSTEM SHALL provide `/foyer/nouveau`, on `ui-flow-layout` (`step=1`, `steps=2`, the spec 004 stepper), with one field: name (required, at most 60, trimmed).
- **REQ-3.2** WHEN `POST households` succeeds THE SYSTEM SHALL store the household and go to `/carnets/nouveau?foyer=1`.
- **REQ-3.3** IF `POST households` answers `422 household.limit_reached` THEN THE SYSTEM SHALL reload the workspace and go to `/foyer` with a toast saying the user already belongs to a household.
- **REQ-3.4** THE SYSTEM SHALL provide `/carnets/nouveau`, on `ui-flow-layout`:
  - `step=2`, `steps=2` with `?foyer=1` (the household's book; the household id comes from the store, never from the URL);
  - `step=1`, `steps=1` without it (a personal book);
  - fields: name (required, at most 60), currency (default `TND`: a short list TND, EUR, USD, GBP, MAD, DZD, SAR, AED, CAD, CHF and "Autre…" that reveals a 3-letter field), timezone (default `Africa/Tunis`, a select).
  - A hint states that the currency cannot be changed afterwards.
- **REQ-3.5** WHEN `POST books` succeeds THE SYSTEM SHALL add the book, select it (REQ-7.3) and go to `/`. The request for a household book sends `household_id` and no currency or timezone fields the user did not choose.
- **REQ-3.6** IF `POST books` answers one of these THEN THE SYSTEM SHALL:
  - `422 validation.failed`: put each code on its field, translated (`name.required|string|max`, `currency.supported_currency`, `timezone.iana_timezone`);
  - `422 book.limit_reached`: say five personal books is the maximum and go to `/`;
  - `403 household.forbidden`, `422 book.household_has_book` or `422 household_id.not_found`: the state is stale, so reload the workspace and go to `/bienvenue` (or `/` when a book now exists);
  - `429 request.throttled`: show "Réessayez dans N s" above the form (static text from `retryAfterSeconds`; the user presses the button again).
- **REQ-3.7** WHEN `/carnets/nouveau?foyer=1` is opened and the user is not the owner of a household without a book THEN THE SYSTEM SHALL go to `/bienvenue`. WHEN it is opened without `foyer` and the user already has 5 personal books THEN THE SYSTEM SHALL go to `/` with a toast.
- **REQ-3.8** WHEN "Retour" is used on step 2 THE SYSTEM SHALL go to `/bienvenue` (state B shows the resume card, so the household is never created twice). WHEN "Quitter" is used THE SYSTEM SHALL go to `/` when the user has a book, else to `/bienvenue`.
- **REQ-3.9** WHILE a request runs THE SYSTEM SHALL show the submit button `loading` and ignore a second submit.

### US-4 — Received invitations
- **REQ-4.1** WHEN `/bienvenue` or `/foyer` opens for a user without a household THE SYSTEM SHALL load `GET invitations`. A user who belongs to a household sees none (accepting would be refused).
- **REQ-4.2** THE SYSTEM SHALL show each invitation as a card: the household name, who invited ("Invité par …"), the expiry date, "Accepter" and "Refuser". Names are isolated with `<bdi>`.
- **REQ-4.3** WHEN the user accepts and the call succeeds THE SYSTEM SHALL store the household (role `member`) and reload the books, then:
  - IF the household's book exists THEN select it and go to `/`;
  - ELSE stay on the page, which now shows state C (REQ-2.3).
- **REQ-4.4** WHEN the user declines and the call succeeds THE SYSTEM SHALL remove the card and show a toast.
- **REQ-4.5** IF accept or decline answers `404 invitation.not_found` THEN THE SYSTEM SHALL remove the card and say the invitation is no longer valid (expired, cancelled or already answered).
- **REQ-4.6** IF accept answers `422 household.already_joined` THEN THE SYSTEM SHALL reload the household, remove every card and say the user already belongs to a household. IF it answers `422 household.member_limit` THEN THE SYSTEM SHALL keep the card and say the household is full.
- **REQ-4.7** WHILE an answer is in flight THE SYSTEM SHALL disable both buttons of that card and show `loading` on the one used.

### US-5 — Household page, owner (`/foyer`, in the shell)
- **REQ-5.1** THE SYSTEM SHALL provide `/foyer` in the signed-in shell, behind `authGuard`, with a "Foyer" destination in the side rail and the bottom tabs. It loads the household, its members and (owner only) its pending invitations.
- **REQ-5.2** WHILE the user has no household THE SYSTEM SHALL show an `ui-empty-state` ("Pas encore de foyer") with "Créer un foyer" (`/foyer/nouveau`) and the invitation cards (US-4).
- **REQ-5.3** WHILE the user is the owner THE SYSTEM SHALL show the household name with a "Propriétaire" badge, a rename action, a delete action, the members, the invitations and the invite form. IF the household has no book THEN it also shows "Créer le carnet du foyer" (`/carnets/nouveau?foyer=1`).
- **REQ-5.4** WHEN the owner renames the household (name required, at most 60) and `PATCH` succeeds THE SYSTEM SHALL update the name and show a toast. `422` field codes go on the field. `403 household.forbidden` reloads the household and shows the member view (the role changed).
- **REQ-5.5** WHEN the owner deletes the household THE SYSTEM SHALL first ask for confirmation (`UiConfirm`) saying that members leave at once, the household's book is deleted and invitations are cancelled. On `204` (or `404 household.not_found`) THE SYSTEM SHALL reset the household, reload the books and go to `/` (when a book remains) or `/bienvenue`.
- **REQ-5.6** THE SYSTEM SHALL list members owners first, then by date joined (the API order), each with a role badge and "(vous)" on the user's own row. The owner has "Retirer" on every other member.
- **REQ-5.7** WHEN the owner removes a member THE SYSTEM SHALL ask for confirmation, then call `DELETE members/{user}`; on `204` remove the row and show a toast. `404 member.not_found` reloads the list without an error. `422 household.owner_cannot_leave` is never offered (no button on the owner's own row).
- **REQ-5.8** THE SYSTEM SHALL list pending invitations (email, expiry date, "Annuler"), oldest first. WHEN the owner cancels one and the call succeeds THE SYSTEM SHALL remove the row; `404 invitation.not_found` removes it too.
- **REQ-5.9** THE SYSTEM SHALL provide an invite form (email: required, valid, at most 255; trimmed, lowercased by the server). WHEN it succeeds THE SYSTEM SHALL add the invitation to the list, clear the field and show a toast saying a notice email was sent. The answer never reveals whether the address has an account.
- **REQ-5.10** IF the invite call answers one of these THEN THE SYSTEM SHALL show its own message on the email field:
  - `422 invitation.self`, `invitation.already_member`, `invitation.already_pending`;
  - `422 household.member_limit` (household full) and `invitation.limit_reached` (too many pending invitations);
  - `422 validation.failed` with `email.required|string|email|max`;
  - `429 request.throttled`: "Limite d'invitations atteinte, réessayez dans N h" (N from `retryAfterSeconds`, rounded up to minutes or hours).
- **REQ-5.11** WHILE members load or invitations load THE SYSTEM SHALL show list skeletons. WHEN a list is empty THE SYSTEM SHALL show a one-line empty text ("Aucune invitation en attente").

### US-6 — Household page, member
- **REQ-6.1** WHILE the user is a member THE SYSTEM SHALL show the household name, the members (read-only) and "Quitter le foyer". No rename, delete, invite, cancel or remove control exists in the DOM.
- **REQ-6.2** WHEN the member leaves THE SYSTEM SHALL ask for confirmation saying access to the household's book ends at once, then call `POST households/{id}/leave`. On `204` (or `404 household.not_found`) THE SYSTEM SHALL reset the household, reload the books and go to `/` or `/bienvenue`.
- **REQ-6.3** IF leave answers `422 household.owner_cannot_leave` (the role changed) THEN THE SYSTEM SHALL reload the household and show the owner view with a message that an owner deletes the household instead.
- **REQ-6.4** IF any household call answers `404 household.not_found` for a member (the owner deleted the household or removed them) THEN THE SYSTEM SHALL reload the workspace, show a toast "Vous ne faites plus partie de ce foyer", and go to `/` or `/bienvenue`.

### US-7 — Book switcher and selected book
- **REQ-7.1** THE SYSTEM SHALL show a book switcher (a `ui-menu` on a button with the selected book's name, `<bdi>`) in the side rail on desktop and in the top bar on phones, on book-bound routes. It lists personal books, then the household's book with a household icon. The selected one is `checked`. WHEN there is no book THE SYSTEM SHALL not show it.
- **REQ-7.2** WHEN a book is chosen THE SYSTEM SHALL select it, remember it (REQ-7.3) and stay on the page. The menu ends with "Nouveau carnet" (`/carnets/nouveau`), disabled with an explanation when `canCreatePersonalBook` is false.
- **REQ-7.3** THE SYSTEM SHALL remember the selected book id in `localStorage` under `expenses.book.<accountId>`, in `try/catch`. WHEN the books load THE SYSTEM SHALL select the stored id if that book is in the list, else the household's book, else the first book (oldest).
- **REQ-7.4** IF the stored id is not in the loaded books, or the books are reloaded and the selected one is gone (household deleted, user removed or left) THEN THE SYSTEM SHALL fall back as in REQ-7.3 and clear the stored id. No error dialog and no toast for this fallback alone.
- **REQ-7.5** THE SYSTEM SHALL replace the Home placeholder with a placeholder for the selected book: its name, currency code and timezone, "Le tableau de bord arrive bientôt" (spec 008). WHEN the selection changes it shows the new book.
- **REQ-7.6** THE SYSTEM SHALL show no amount in this spec. The book's currency exponent is kept in the model for specs 007 and 008.

### US-8 — Quality (languages, accessibility, tests, docs)
- **REQ-8.1** THE SYSTEM SHALL keep texts under `households.*` and `shell.*` in the app's `public/i18n/{fr,en,ar}.json` (no separate i18n folder or file for this feature) ([spec 005 REQ-8.2, REQ-10.4](../005-identity/requirements.md)). The Arabic files are a draft flagged for a native reader.
- **REQ-8.2** THE SYSTEM SHALL use logical properties only and `<bdi>` around names, emails, currency codes and timezone ids; emails are left-to-right inside Arabic text.
- **REQ-8.3** THE SYSTEM SHALL declare, on each request, the codes its page handles (REQ-3.3, 3.6, 4.5–4.6, 5.4–5.10, 6.2–6.4), so the error presenter never shows the same error again. Unhandled `403`, `404`, `429` and `5xx` still reach the presenter.
- **REQ-8.4** THE SYSTEM SHALL give each page one `h1`, labelled fields with linked errors, `ui-alert` (announced) for messages above a form, and a confirmation dialog for every destructive action (delete household, remove member, leave).
- **REQ-8.5** THE SYSTEM SHALL build the screens only from specs 002–004 components, with no new toolbox component and no raw style values.
- **REQ-8.6** THE SYSTEM SHALL have unit tests (Vitest, jsdom, `HttpTestingController`) for: the three APIs (mapping, pagination), the stores (success and each handled error, reset, selection, storage failure), the guards, and one spec per page and for the switcher. They are written, not run (CLAUDE.md).
- **REQ-8.7** THE SYSTEM SHALL update ARCHITECTURE §2 and §3 (app-specific code lives in the app, not in `libs/<app>/`), mark 006 in `docs/ROADMAP.md`, and update `specs/README.md` when the spec is done.

## Unhappy paths checklist
- [x] Loading: skeletons (REQ-2.7, 5.11), `loading` buttons (REQ-3.9, 4.7), guards wait (REQ-2.1)
- [x] Empty: no household (REQ-5.2), no invitations (REQ-5.11), no book (REQ-2.1)
- [x] HTTP / network: unavailable page (REQ-2.2), presenter for the rest (REQ-8.3)
- [x] Validation: client and server field codes (REQ-3.1, 3.6, 5.4, 5.9–5.10)
- [x] 404 / 403 / 422 codes: REQ-3.3, 3.6, 4.5, 4.6, 5.4, 5.7, 5.8, 6.3, 6.4
- [x] Throttling: 10/min creations (REQ-3.6), 20/day invitations (REQ-5.10)
- [x] Unauthenticated: `authGuard`, session expiry ([spec 005](../005-identity/requirements.md)); stores reset (REQ-1.6)
- [x] Expired invitation: REQ-4.5. Limit reached: REQ-3.3, 3.6, 5.10. Last owner: REQ-5.7, 6.3
- [x] Date and timezone: invitation dates arrive in UTC and show in the browser's timezone; the book's timezone is only stored and shown (REQ-7.5)
- [x] i18n / RTL: REQ-8.1, 8.2. Duplicate submit: REQ-3.9, 4.7

## Non-goals
- **QR invitations** (`qr-invitations`, `preview`, `accept`): spec 009, with the camera scan and the link format (owner's decision 1).
- Editing a book (rename, timezone) and the book's `can_manage`: see Open questions. The backend has no book deletion.
- Notifications of pending invitations elsewhere (badge on the nav); a separate `/invitations` page (the cards are inline, REQ-2.4, 5.2).
- Transferring ownership, several households, household roles other than owner and member (backend).
- Amounts, categories, operations, dashboard (specs 007, 008).

## Backend gaps (known limits; no workaround is built)
- **G1** No endpoint lists supported currencies or timezones. The client offers a short currency list plus free ISO input and the browser's timezone list; the backend's `422` is the judge.
- **G2** No ownership transfer: an owner cannot leave, only delete the household (members are freed, the book is lost).
- **G3** No book deletion: the 5-personal-book limit is permanent.
- **G4** Invitation lists carry no invitee name; the owner sees emails only (by design).

## Decisions (2026-11-24)
1. [x] **QR:** deferred to spec 009.
2. [x] **Selected book:** `localStorage` key `expenses.book.<accountId>`; on disappearance fall back and clear, silently (REQ-7.3, 7.4).
3. [x] **Household settings:** one page `/foyer` (REQ-5.x, 6.x).
4. [x] **First-run guard:** no book *and* no household sends to `/bienvenue`; a household without a book resumes there too (REQ-2.1, 2.3).
5. [x] **Placement (2026-11-24, after the draft):** everything app-specific lives directly in the app (`apps/expenses-management/src/app/`), never in `libs/<app>/`. `libs/expenses/shell` moves into the app (T2). `shared/` stays the only place for libraries.

## Open questions
Not blocking; each has a default.
- [ ] **Q1 Currency picker.** Short list + "Autre…" (REQ-3.4). **Proposed — owner to confirm.** Alternative: the full ISO list.
- [ ] **Q2 Timezone picker.** A native select fed by `Intl.supportedValuesOf('timeZone')`, default `Africa/Tunis`. **Proposed — owner to confirm.** Risk: a name the browser accepts but the backend refuses (shown as a field error).
- [ ] **Q3 Book settings.** Renaming a book or changing its timezone (`PATCH books`) is **not** in 006. **Proposed — owner to confirm.** Alternative: a small dialog from the placeholder page when `canManage`.
- [ ] **Q4 Form helpers.** `applyServerErrors` and `countdown` are inside `identity/feature-auth`. The app may import a `feature`, but only what its `index.ts` exports. **Proposed — owner to confirm:** export them from `@shared/identity-feature-auth` if they are not yet (a one-line change to spec 005 code) and reuse them; if the owner prefers not to touch 005, a ~20-line local helper. REQ-3.6 and 5.10 keep static "Réessayez dans N s" text either way.
- [ ] **Q5 Top bar.** On phones the switcher replaces the title on book-bound routes; other routes keep their title. **Proposed — owner to confirm.**
- [ ] **Q6 Routes.** `/bienvenue`, `/foyer/nouveau`, `/carnets/nouveau`, `/foyer`; no `/invitations`. **Proposed — owner to confirm.**
