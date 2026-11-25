# 006 — Households and books: Design

> Status: Draft (2026-11-24), waiting for the owner's approval
> Requirements: [requirements.md](./requirements.md)

## Overview

Households, books and invitations are expenses-domain, so everything new lives directly in the app, `apps/expenses-management/src/app/`, never in a library (owner's rule, decision 5; this supersedes the `libs/<app>/` layout of ARCHITECTURE §2, updated in T1). The toolbox gets nothing. The existing `libs/expenses/shell` moves into the app too, so the shell can host the book switcher. The shell gains a book switcher and a "Foyer" destination. The stores follow the `SessionStore` pattern of spec 005: `async` methods with `try/catch` returning a result, no `rxMethod`, so no stream can die.

## Placement

```
apps/expenses-management/src/app/
  households/
    data/                    models.ts, mappers.ts, paginate.ts, store-result.ts,
                             households-api.ts, books-api.ts, invitations-api.ts,
                             books.store.ts, household.store.ts, invitations.store.ts,
                             selected-book-storage.ts, provide-households.ts, guards.ts
    pages/                   welcome, household-new, book-new, household
    parts/                   received-invitation-card, members-list, sent-invitations, invite-form, rename-form
    support/                 server-errors.ts (or the shared one, Q4), retry-text.ts, currencies.ts, timezones.ts
  shell/                     moved from libs/expenses/shell: signed-in-shell, brand-mark, book-switcher.ts
  home/                      BookHome placeholder
```

| Piece | Where | Reason |
|---|---|---|
| Everything above | the app, in feature folders | App-specific code lives in the app (owner's rule). It moves to `shared/` only if a second app needs it. Folder boundaries inside the app are by convention, not by lint tags. |
| Shell moved into the app | `src/app/shell/` | A library cannot import the app's stores; moving it removes the problem. Its code is unchanged apart from the switcher and the nav item. |
| Book switcher in the shell | not a toolbox molecule | It reads the store and knows "Nouveau carnet". The menu itself is the toolbox `ui-menu`. |

Dependency directions: pages and shell → `households/data` → `@shared/http-data-access` (for `handling`, `ApiError`) and `@shared/identity-data-access` (account id). Pages also use `@shared/ui-*`, `@shared/util-format`.

## Reuse

- Layout: `ui-flow-layout` (step, steps, back, exit), `ui-page`, `ui-app-shell` (spec 004).
- Molecules: `ui-form-field`, `ui-option-cards`, `ui-alert`, `ui-empty-state`, `ui-list` / `ui-list-item`, `ui-section-header`, `ui-menu` (`checked` items), `ui-stepper` (inside the flow layout).
- Organisms: `UiConfirm`, `UiToast`, `ui-side-rail`, `ui-top-bar`, `ui-bottom-tabs`.
- Atoms: `uiButton`, `uiInput`, `uiSelect`, `ui-badge`, `ui-skeleton`, `ui-icon`.
- HTTP: `handling(...)`, `ApiError`; `authGuard`, `SessionStore.account`.
- **New toolbox pieces: none.** Missing and not invented (Risks): a searchable combobox, a countdown/server-error helper in a shared util, a QR component.

## Models & API

```ts
type Role = 'owner' | 'member';
interface Household { id: string; name: string; role: Role }
interface Member { id: string; name: string; role: Role }
interface Currency { code: string; exponent: number }
interface Book { id: string; name: string; currency: Currency; timezone: string;
  owner: { type: 'account' | 'household'; id: string }; canManage: boolean }
interface Invitation { id: string; email: string; createdAt: Date; expiresAt: Date }
interface ReceivedInvitation { id: string; household: { id: string; name: string };
  invitedBy: { name: string }; createdAt: Date; expiresAt: Date }
type StoreResult = { outcome: 'done' } | { outcome: 'error'; error: ApiError };
```

| Client | Method → endpoint (request / response) |
|---|---|
| `HouseholdsApi` | `list()` GET households · `create(name)` POST · `rename(id, name)` PATCH · `remove(id)` DELETE · `members(id)` GET `…/members` · `removeMember(id, userId)` DELETE · `leave(id)` POST `…/leave` |
| `BooksApi` | `list()` GET books · `create({ name, currency?, timezone?, householdId? })` POST books |
| `InvitationsApi` | `sent(hid)` · `invite(hid, email)` · `cancel(hid, id)` · `received()` · `accept(id)` → `Household` · `decline(id)` |

List methods use `fetchAll` (REQ-1.2). Dates parse from ISO UTC. No QR methods. Errors are the contract's codes; each caller passes `handling(...)` (see "Error flow").

## State (stores)

All `signalStore({ providedIn: 'root' }, withState, withComputed, withMethods)`; methods are `async`, wrap `firstValueFrom` in `try/catch` and return `StoreResult` (REQ-1.4).

- **`BooksStore`** — state `books`, `selectedBookId`, `status`, `loadPromise` (kept outside the state). Computed: `selectedBook`, `householdBook`, `personalBooks`, `canCreatePersonalBook` (REQ-1.7). Methods: `load({ force? })` (idempotent, de-duplicated, loads households too via `HouseholdStore.loadHousehold()`; `status: 'error'` on failure, REQ-2.2); `select(id)`; `create(input)` (appends, selects); `reset()`. After each load/refresh `reconcileSelection()` implements REQ-7.3/7.4 and writes the storage key.
- **`HouseholdStore`** — `household`, `members`, `sent`, `loading`. Computed `isOwner`, `isMember`. Methods: `loadHousehold()`, `loadDetail()` (members, and sent invitations when owner), `create(name)`, `rename(name)`, `deleteHousehold()`, `removeMember(id)`, `leave()`, `invite(email)`, `cancelInvitation(id)`, `applyAccepted(household)`, `reset()`.
- **`InvitationsStore`** — `received`, `loading`. Methods: `load()` (only when `HouseholdStore.household()` is null), `accept(id)`, `decline(id)`; removes the card on success and on `invitation.not_found`; `reset()`.
- **Destructive flows end with a refresh.** `deleteHousehold`, `leave`, `accept` call `BooksStore.load({ force: true })`, so the book list and the selection follow (REQ-4.3, 5.5, 6.2, 7.4).
- **Reset (REQ-1.6).** `provideHouseholds()` registers an initializer with an `effect` on `SessionStore.account()?.id`: any change calls `reset()` on the three stores.
- **Storage.** `selected-book-storage.ts` exposes `read(accountId)`, `write`, `clear`; every access is in `try/catch`, failure means "nothing stored".

## Guards (REQ-2.1–2.2, 2.6, 3.7)

Functional `CanActivateFn`, each waiting for `BooksStore.load()` (a promise converted with `from`), then:

| Guard | On | Rule |
|---|---|---|
| `workspaceGuard` | `/` | `status === 'error'` → `UrlTree` `/indisponible?returnUrl=`; no books → `/bienvenue`; else true |
| `firstRunGuard` | `/bienvenue` | books exist → `/`; else true |
| `householdBookGuard` | `/carnets/nouveau` | with `foyer=1`: owner and no household book, else `/bienvenue`; without: `canCreatePersonalBook`, else `/` (toast) |

`/foyer/nouveau` has an inline guard: a user with a household → `/foyer`. All sit after `authGuard`. The existing unavailable page calls `SessionStore.restore()` then navigates to `returnUrl`; the guard reloads the workspace on that navigation because `status` is `error`.

## Components (`app/households/`)

| Component | Inputs / outputs | Notes |
|---|---|---|
| `WelcomePage` | — | `ui-flow-layout` (`steps=1`, no stepper), states A/B/C from the stores (computed `state`), invitation cards, `ui-option-cards` + Continuer |
| `HouseholdNewPage` | — | flow layout 1/2; reactive form, `Validators.required/maxLength(60)`, trimmed; navigates on success |
| `BookNewPage` | `?foyer` read from `ActivatedRoute` | flow layout 2/2 or 1/1; currency select + "Autre…" 3-letter field (upper-cased), timezone `uiSelect`; hint "Devise définitive" |
| `HouseholdPage` | — | in the shell; `ui-page`; chooses empty / owner / member view from `HouseholdStore`; loads detail on init |
| `ReceivedInvitationCard` | `invitation`, `busy`; outputs `accept`, `decline` | presentational; `<bdi>` for names; expiry with the `util-format` date pipe |
| `MembersList` | `members`, `selfId`, `canRemove`; output `remove` | `ui-list`; role `ui-badge`; "(vous)" |
| `SentInvitations` | `invitations`; output `cancel` | empty text; email in `<bdi dir="ltr">` |
| `InviteForm` | `busy`, `serverError`; output `invite` | form field with the email |
| `RenameForm` | `name`, `busy`, `serverError`; output `rename` | inline edit |
| `BookSwitcher` (shell) | `variant: 'rail' \| 'bar'` | `ui-menu` with a `checked` item per book; footer item "Nouveau carnet"; hidden when no book |

Confirmations (`UiConfirm`) are opened by `HouseholdPage`: delete household, remove member, leave.

## Error flow

No `rxMethod` is used (spec 005 pattern). Every store call is `try/catch` and returns `StoreResult`; the page maps `error.code` to a message. `support/server-errors.ts` (Q4) sets `{ server: { message } }` on controls like identity's helper. Codes each call declares with `handling(...)` (REQ-8.3):

| Call | Handled codes |
|---|---|
| create household | `household.limit_reached`, `request.throttled` |
| create book | `book.limit_reached`, `household.forbidden`, `book.household_has_book`, `request.throttled` (+ `validation.failed` fields, never published) |
| rename / delete household | `household.forbidden`, `household.not_found` |
| accept / decline | `invitation.not_found`, `household.already_joined`, `household.member_limit` |
| invite | `invitation.self`, `invitation.already_member`, `invitation.already_pending`, `invitation.limit_reached`, `household.member_limit`, `request.throttled` |
| cancel invitation / remove member | `invitation.not_found`, `member.not_found`, `household.not_found` |
| leave | `household.owner_cannot_leave`, `household.not_found` |
| loads (`GET …`) | none: offline and server errors reach the presenter and the guard; a failed received-invitations load stays silent beyond that |

`retry-text.ts` turns `retryAfterSeconds` into "N s" / "N min" / "N h" (REQ-3.6, 5.10).

## Routing

```ts
// in app.routes.ts, before the shell parent, all behind authGuard
{ path: 'bienvenue', canActivate: [authGuard, firstRunGuard], loadComponent: WelcomePage },
{ path: 'foyer/nouveau', canActivate: [authGuard], loadComponent: HouseholdNewPage },
{ path: 'carnets/nouveau', canActivate: [authGuard, householdBookGuard], loadComponent: BookNewPage },
// children of SignedInShell (authGuard)
{ path: '', canActivate: [workspaceGuard], loadComponent: BookHome, data: { titleKey: 'home.title', bookBound: true } },
{ path: 'foyer', loadComponent: HouseholdPage, data: { titleKey: 'households.household.title' } },
```

`PATHS` gains `welcome`, `newHousehold`, `newBook`, `household`. Shell: rail and tabs gain "Foyer"; the top bar shows `BookSwitcher` in place of the title when `bookBound` is set (Q5), and the rail shows the switcher under the brand (`uiRailAction` slot, else a `uiRailItem`-styled block: verify at T11). `BookHome` (app) shows the selected book's name, `currency.code`, timezone and the spec 008 note.

## i18n keys

- `households.welcome.*` (title, options, states A/B/C), `households.invitation.*` (card, answers), `households.newHousehold.*`, `households.newBook.*` (labels, `currencyFinal` hint, `otherCurrency`), `households.household.*` (owner, member, members, sent, invite, rename, delete, leave, confirms), `households.errors.<code>` (one per handled code, REQ-8.3), `households.fields.<field>.<rule>`.
- App: `shell.household`, `shell.books.*` (switcher label, new book, limit), `home.*` for the placeholder.
- Files: the app's existing `public/i18n/{fr,en,ar}.json`, new `households.*` and `shell.*` keys only. No per-feature i18n folder, no new loader entry, no new `assets` input. Arabic keeps `meta.reviewStatus`.

## Requirement coverage

| REQ | Where |
|---|---|
| 1.1–1.2 | APIs, `paginate.ts`, mappers |
| 1.3–1.7 | stores, `provideHouseholds` |
| 2.1–2.2, 2.6 | `workspaceGuard`, `firstRunGuard` |
| 2.3–2.5, 2.7 | `WelcomePage`, `ReceivedInvitationCard` |
| 3.1–3.3, 3.8–3.9 | `HouseholdNewPage`, `BookNewPage` navigation |
| 3.4–3.7 | `BookNewPage`, `householdBookGuard`, `BooksStore.create` |
| 4.x | `InvitationsStore`, `ReceivedInvitationCard`, `WelcomePage`, `HouseholdPage` (no-household view) |
| 5.x, 6.x | `HouseholdPage` and its parts, `HouseholdStore` |
| 7.1–7.2 | `BookSwitcher`, shell |
| 7.3–7.4 | `BooksStore.reconcileSelection`, storage |
| 7.5–7.6 | `BookHome` |
| 8.1–8.5 | i18n files, handled codes table, page templates |
| 8.6 | one spec per file above, each task |
| 8.7 | tasks T1, T12 |

## Risks / alternatives considered

- **Form helpers.** `applyServerErrors` and `countdown` are inside `identity/feature-auth`; the app may use them only if its `index.ts` exports them (Q4): export them, or copy ~20 lines.
- **Timezone and currency lists.** No endpoint (G1). `Intl.supportedValuesOf` may include names the backend rejects; the field error covers it. A searchable combobox would be a new toolbox molecule: not invented here.
- **Switcher slots.** `ui-top-bar` and `ui-side-rail` may lack a slot for a menu button. If so, T11 projects the switcher through the existing title and action slots; a new slot would be a toolbox change and needs the owner's approval first.
- **Selection in the URL** (`/carnets/:id`) was rejected by the owner (decision 2): bookmarks are not needed, and spec 007's routes stay book-independent.
- **`rxMethod` stores** rejected, as in spec 005 (results per call, no dead stream).
- **Back from step 2** goes to `/bienvenue`, never to step 1, because the household already exists (REQ-3.8).
- **Stale state across devices** (household deleted elsewhere): every 404/403/422 of the contract has a reload path (REQ-3.6, 4.6, 5.4, 6.3, 6.4); no polling.
- **Accept while a household exists** is hidden rather than refused: the cards are not shown (REQ-4.1), the `already_joined` path covers a race.
