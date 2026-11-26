# 009 — Mobile-first redesign: Design

> Status: Approved (2026-11-25, owner asked to proceed from requirements to code without further gates)
> Requirements: [requirements.md](./requirements.md) · Screens: [design-reference/](./design-reference/README.md)

## Overview

The toolbox gets four presentational pieces (drawer, amount keypad, month strip, save bar). The app gets a new shell (top bar, drawer, tabs, rail) and two new pages (`/analyse`, `/rejoindre`). The add sheet gets a one-off / recurring mode, and the budget page is rebuilt around a month strip. The existing stores, APIs and error handling of specs 005–008 stay. Pages change layout and reuse them. Open questions A–D were accepted as recommended with the requirements.

## Placement

| Piece | Location | Reason |
|---|---|---|
| `UiDrawer` service, `UI_DRAWER_CONTEXT`, `.ui-drawer-pane` styles | `shared/ui/organisms/src/lib/drawer/`, `styles/overlays.scss` | Overlay on the CDK dialog, like `UiDialog` (REQ-14.1) |
| `ui-amount-keypad` + `pressKeypadKey()` | `shared/ui/molecules/src/lib/amount-keypad/` | Twelve buttons doing one job (REQ-14.2) |
| `ui-month-strip` | `shared/ui/molecules/src/lib/month-strip/` | REQ-14.3 |
| `ui-save-bar` | `shared/ui/molecules/src/lib/save-bar/` | Text + two `uiButton` (REQ-14.4) |
| Dock offset `--ui-app-shell-dock-offset` | `shared/ui/templates/.../app-shell.scss` | Lets the save bar sit above the tabs |
| `UiText.keypad`, `keypadDelete`, `keypadSeparator` | `shared/ui/tokens/src/lib/ui-text.ts` | Built-in strings of the keypad |
| `IDENTITY_PREFERENCES` token, theme and language rows | `shared/identity/feature-auth/src/lib/shared/` | The account page lives in the toolbox; the app provides its language list |
| Code step, two-step forgot password | `shared/identity/feature-auth/src/lib/` | REQ-13.3, 13.4 |
| Shell, drawer content, drawer hints | `apps/expenses-management/src/app/shell/` | App navigation |
| Analysis page and store | `apps/.../analysis/` (new) | REQ-6 |
| QR invitations, join page, invite sheet | `apps/.../households/` | REQ-11 |

## Reuse

Reused: `UiDialog` (sheets), `UiConfirm`, `UiToast`, `ui-top-bar`, `ui-bottom-tabs` with `uiTabAction` (already a raised middle button that emits a click, so REQ-14.5 needs only a catalog state), `ui-side-rail` sections, `ui-month-switcher`, `ui-segmented-control`, `ui-chip`, `ui-search-field`, `ui-grouped-list` (its `total` per group), `ui-meter`, `ui-pace-chart`, `ui-trend-bars`, `ui-bar-list`, `ui-empty-state`, `ui-avatar`. The category picker's accordion and recents (spec 007 fix) already meet REQ-8.1 unchanged. Sign-up already sends `fr` for Arabic (REQ-13.2, `accountLocaleOf`).

New shared pieces: the four above, each asked for in REQ-14. New dependency: `qrcode` (MIT) plus `@types/qrcode`, used only by the app's `QrCode` part (open question D).

## Toolbox components

| Component | Inputs | Outputs | Notes |
|---|---|---|---|
| `UiDrawer.open(component, { data, title })` → `UiDrawerRef<R>` (`close(result)`, `closed: Observable<R \| undefined>`) | — | — | CDK dialog, `ariaLabel = title`, global position `top(0).start(0)`, full height, panel `ui-drawer-pane`. Focus trap and restore, Escape and backdrop close are CDK defaults. Pushes one history entry on open; `popstate` closes; closing in another way pops it and `closed` emits after that `popstate`, so the caller can navigate safely. A `MutationObserver` on `<html dir>` calls `overlayRef.setDirection()` + `updatePosition()` so the drawer stays at the inline-start edge after a language change (REQ-1.4, 1.9, 14.1). Slide-in keyframes use `--ui-duration-slow` (0 ms under reduced motion) and a `prefers-reduced-motion` block (REQ-15.3). |
| `ui-amount-keypad` | `value` (model, text), `decimals`, `separator` (`,`), `maxDigits` (9) | `valueChange` | Keys 1–9, separator, 0, ⌫ in a `role=group` grid with `dir=ltr` so the order holds in RTL. Separator key disabled when `decimals` is 0. Keydown on the host accepts digits, `,` / `.`, Backspace. Pure `pressKeypadKey(text, key, options)` holds the rules. Keys ≥ `--ui-control-height-md`. |
| `ui-month-strip` | `months: UiMonthStripItem[]` (`month`, `label`, `caption?`, `status?`, `statusLabel?`), `selected` (model), `ariaLabel` | `selectedChange` | `nav` with a list of buttons; roving tabindex; Arrow keys move focus (mirrored with `isRtl`), Home/End, Enter/Space select (native buttons). Selected has `aria-current="date"`. Status always as text, `todo` dashed. Scrolls the selected month into view after render and on change. |
| `ui-save-bar` | `text`, `primaryLabel`, `secondaryLabel`, `busy` | `primary`, `secondary` | Sticky at `inset-block-end: var(--ui-app-shell-dock-offset, 0)`; the text is `role=status`. While present it sets `scroll-padding-block-end` on `<html>` to its height plus offset, so focused fields scroll clear of it; removed on destroy. Enters with `--ui-duration-base`. |

## App

### Shell (US-1)
- `SignedInShell` top bar below medium: leading menu button (`aria-haspopup=dialog`) → `NavDrawerService.open()`; title: on `bookBound` routes a button « <book> ▾ » that opens the drawer with `focus: 'books'`, else the route title (`h1`); trailing link to `/compte` with `ui-avatar` (REQ-1.1). The `BookSwitcher` menu stays in the rail only.
- `NavDrawer` (drawer content): account header and close button; « Carnets » list (household book first, then personal; `aria-current` on the selected; owner and currency as subtitle; « Nouveau carnet » disabled at the limit, as in spec 006); Accueil, Opérations; « Prévoir »; « Foyer et compte »; theme segmented control (`UiThemeService.setChoice`); language segmented control (`LanguageService.use`); sign out (REQ-1.2, 1.4, 1.5). Links call `drawer.close({ navigate: url })`; the service navigates after `closed` (REQ-1.9). The current destination is the longest matching path of the router URL.
- `DrawerHints` (created by `NavDrawer`): on construction, in parallel, `BudgetApi.get(book, current month)` → « <mois abrégé> · <reste entier> restants » when `hasPlan` and `remaining !== null`; `RecurringApi.list` → count of rules with `nextDate !== null`; `HouseholdsApi.members` → count (household only). Each is a signal `string | null`, `null` while loading or on error. Calls use `quietReads()` (`handling` of offline, 5xx, not-found and throttle codes) so nothing reaches the error presenter (REQ-1.3).
- Tabs: Accueil, Opérations, raised « + » (`EntrySheetService.openNew()`), Budget, Récurrentes (REQ-1.6). Rail: Accueil, Opérations, section « Prévoir » (Budgets, Récurrentes, Analyse du mois), section « Foyer et compte » (Foyer, Compte), add button and book switcher kept (REQ-1.8).
- Icons added to `SHELL_ICONS`: `chart-column`, `sun`, `moon`, `monitor`, `qr-code`, `mail`.

### Routes (REQ-1.7, 11.4, 13.4, 15.7)
`PATHS.recurring = '/recurrentes'`, `PATHS.analysis = '/analyse'`, `PATHS.join = '/rejoindre'`. New children of the signed-in shell: `analyse` (`workspaceGuard`, bookBound, `analysis.title`), `recurrentes` (`workspaceGuard`, bookBound), `rejoindre` (`households.join.title`). Redirects: `operations/recurrentes` → `/recurrentes` (Angular keeps query parameters on a string redirect), `mot-de-passe/nouveau` → `/mot-de-passe-oublie`. Signed-out `/rejoindre#t` goes through `authGuard` with `returnUrl` = `state.url`, which keeps the fragment; `safeReturnUrl` accepts it.

### Accueil (US-2)
- `DashboardStore` keeps `budget`, `comparison`, `upcoming`, `recent`, `firstUse`; `summary`, `previous`, `trend` and the `history` refresh move to `AnalysisStore`. `recent` loads `from = to = today` when the month is the current one (all of the first page), else the month's first page sliced to 5 (REQ-2.2, 2.3).
- Page order: month switcher, hero or no-plan card, `RecentCard` (title « Aujourd'hui » with empty state and add button, or « Dernières opérations » with « Tout voir »), watch list, upcoming (link `/recurrentes`), `AnalysisLinkCard` (REQ-2.1). Card states unchanged (REQ-2.4).

### Analyse du mois (US-6)
- `analysis/data/analysis.store.ts`: cards `budget`, `summary`, `previous`, `trend`, `fixed` with the same per-card generation and freshness pattern as the dashboard store; `provideAnalysis()` reacts to `LedgerChanges` like `provideDashboard` (REQ-6.3).
- `fixed` = `EntriesApi.collect(book, { month range, type: 'expense' }, { maxPages: 20 })`, reduced by `fixedByDay()` to `{ byDay: Map<day, minor>, total, complete }` from entries with `recurringRuleId` (REQ-6.2).
- `PaceCard` gets `fixed`: when complete, it subtracts the cumulative fixed amount from each day and from the target, and says « hors loyer et factures »; else it keeps « factures fixes incluses ».
- `pace-card`, `categories-card`, `members-card`, `trend-card` and their support files move from `dashboard/` to `analysis/`. Members card title becomes « Qui a ajouté quoi ». The trend card links to `/analyse?mois=…`.

### Add and edit sheets (US-3, 4, 5)
- `EntrySheetService.openNew({ mode?: 'once' | 'recurring' })`, `openEdit(entry)`. Both open `EntrySheet`.
- `EntrySheet` add mode: `ui-segmented-control` « Une seule fois | Récurrente » (radio semantics, REQ-15.4); amount through `AmountPad` (big `output` with live grouping + currency code, `ui-amount-keypad` when `matchMedia(mediaQueryDown('medium'))` matches, else the `uiInput`, REQ-3.1, 3.2, 3.9); category chips: suggested (badge « suggérée », `aria-describedby`), other recents, « Autre catégorie… » (REQ-3.3, 3.4); templates row (REQ-3.5); once mode: chips « Aujourd'hui », « Hier », « Autre date » (reveals the native date field), « Note » (reveals the comment); recurring mode: unit segmented control, interval select, start and optional end dates and the past-start warning (REQ-3.7, 4.1). Mode switch keeps the controls; `date` ↔ `startsOn` are copied (REQ-4.2). Save label: `operations.sheet.saveAmount` / `recurring.sheet.saveAmount` with the formatted amount and frequency (REQ-3.8, 4.1). Recurring save calls `RecurringStore.create` and reuses `ruleReaction` / `ruleFieldMessages` (REQ-4.3).
- `EntryHistory` (`operations/data/entry-history.ts`, root): `forBook(accountId, book)` returns a cached `Promise<readonly Entry[]>` of the account's last 30 entries (`EntriesApi.collect` with `author`, `from = 2000-01-01`, `to = today + 1 year`, `maxItems: 30`, quiet reads); `invalidate()` after a save. Pure `suggestCategory(entries, now, timezone, offerable)` and `templatesFrom(entries, offerable)` in `operations/support/suggestion.ts` (REQ-3.3, 3.5). The sheet applies the answer only if no category was chosen yet (REQ-3.6).
- Edit mode: meta line « Ajoutée par … · modifiée par … » (REQ-5.1); « Supprimer l'opération… » moves into the body as a ghost danger button (REQ-5.2).

### Opérations (US-7)
- Month header: `ui-month-switcher` with caption « −X · +Y » from `SummaryApi.get(book, { month })` (quiet, hidden on failure).
- Search: `ui-search-field`; while non-empty, `OperationsStore.loadAll(20)` follows pages; `matchesSearch(entry, query, labels, currency)` filters (accent-insensitive on comment, other name, category label; amount text without spaces). Cap → note (REQ-7.2).
- Chips: Tout / Dépenses / Revenus (`aria-pressed`), Catégorie ▾ (picker filter mode, or the chosen category with ×), Membre ▾ menu (household only) (REQ-7.1).
- `dayGroups` gets totals: `+income · expense` of the shown rows; the last group's total is left out while `nextCursor !== null` (REQ-7.3). `EntryRow`: title = other name or comment or category, subtitle = category · author.

### Budget (US-9)
- `month-strip.ts`: `stripMonths(today, selected)` = current − 12 … current + 12, plus `selected` first when older; status by position, future from `BudgetStore.plans` (`Record<month, boolean>`).
- `BudgetPlans` service: after each successful load, a quiet `get` of each of the 12 future months not yet known; `save` and `copy` update the map. The page loads the rules quietly when the month is in the future (REQ-9.2, 9.7). See the deviations in tasks.md.
- Page: `ui-month-strip`, `BudgetSummaryCard` (Prévu / Dépensé / Reste, meter, copy button), income and saving rows, line rows (name, `spent / planned`, meter, last month), off-plan list, « Ajouter une ligne ». Tapping a row opens `AmountSheet` (`AmountPad`, « Retirer la ligne » for lines) whose result goes into the draft (REQ-9.3, 9.4). `ui-save-bar` while `draft.dirty()`, text from `draft.changeCount()` (REQ-9.5). No plan and not started: empty state with copy and « Partir de zéro » (REQ-9.6). Future month: `KnownRulesCard` from `dueDatesIn(rule, month)` (`recurring/support/due-dates.ts`, contract month-end rule) (REQ-9.7).

### Récurrentes (US-10)
- Page `/recurrentes`: `MonthlyAverageCard` (`monthlyAverage(rules)` in `recurring/support/monthly-average.ts`), « Nouvelle opération récurrente » → `openNew({ mode: 'recurring' })`; sections by type for live rules; « Terminées (n) » toggle; rows are buttons that open `RuleSheet` (REQ-10.1–10.3).
- `RuleSheet` is edit-only: no create path; « Prochaine : … » note; « Arrêter cette récurrence… » in the body (confirm, `RecurringStore.remove`) (REQ-10.4). `RuleSheetService.openNew` is removed.

### Foyer and invitations (US-11)
- `household.page` re-laid out: household card with rename icon (owner), members with an options menu (`ui-menu`: remove), « Inviter quelqu'un » button (owner), pending invitations, sensitive actions at the bottom (REQ-11.1).
- `InviteSheet` (UiDialog sheet): `role=tablist` with two tabs. E-mail tab = `InviteForm` + `HouseholdStore.invite`. QR tab: `QrInvitationsApi.create` → `QrCode` part (`qrcode.toString(link, { type: 'svg' })`, `role=img`), countdown from `expires_at` (1 s interval, `DestroyRef`), dimmed and « expiré » at zero, « Nouveau code ». The token lives only in the component (REQ-11.2, 11.3).
- `JoinPage` (`/rejoindre`): reads the fragment, `preview`, then « Rejoindre » (`accept` → `HouseholdStore.applyAccepted`, `BooksStore.load({ force })`, select the household book, navigate `/`) or « Refuser » (navigate `/`). Errors mapped to `households.join.errors.*` (REQ-11.4).

### Compte, identity, first run (US-12, 13)
- `IDENTITY_PREFERENCES` (optional token): `{ languages: { value, label }[], language: Signal<string>, useLanguage(value) }`, provided by the app from `LanguageService`. `AccountPage` shows profile rows, Langue and Thème segmented controls (`UiThemeService`), two-step, Google state (`googleLinked` if the account has it, else hidden), sign out (REQ-12.1).
- `identity-code-step` part shared by the e-mail code and two-step pages (REQ-13.3). `ForgotPasswordPage` holds both steps; `ResetPasswordPage` is removed and its route redirects (REQ-13.4). Layouts already stack phone first (REQ-13.1).
- `BookNewPage` in first run (no book yet): submit label « Créer et noter une première dépense », then navigate `/` and `EntrySheetService.openNew()` (REQ-13.5).

## Models & API

```ts
// operations/data/entries-api.ts
collect(bookId, filters, limits: { maxPages: number; maxItems?: number }, context?): Observable<{ items: Entry[]; complete: boolean }>
// households/data/qr-invitations-api.ts
create(householdId): Observable<{ token: string; expiresAt: Date }>
preview(token): Observable<{ household: { id; name }; invitedBy: { name }; expiresAt: Date }>
accept(token): Observable<Household>
```
| Method | Endpoint | Errors handled |
|---|---|---|
| POST | `households/{id}/qr-invitations` | `request.throttled`, `household.forbidden`, `household.not_found`, `household.member_limit`, `http.offline` |
| POST | `qr-invitations/preview` | `invitation.not_found`, `request.throttled`, `validation.failed`, `http.offline` |
| POST | `qr-invitations/accept` | the above + `household.already_joined`, `household.member_limit` |

No other endpoint is added. Extra reads: drawer hints, budget statuses (≤ 12), month entries for search and the pace chart (≤ 20 pages), the author history (≤ 30 entries), the month summary on Opérations.

## State and error flow

Stores keep the async-method style of specs 006–008 (each method returns a result; generations drop stale answers; no `rxMethod` is added, so there is no stream to keep alive). Every new read without its own message uses `quietReads()` and degrades to "hidden". Writes keep their spec 007/008 handling.

## i18n keys (fr, en, ar; Arabic a draft)
`shell.menu`, `shell.drawer.*` (sections, hints, theme, language), `shell.analysis`, `shell.recurring`, `analysis.*`, `dashboard.today.*`, `dashboard.analysisLink.*`, `operations.search.*`, `operations.chips.*`, `operations.sheet.{once,recurring,mode,suggested,templates,otherCategory,otherDate,note,saveAmount}`, `recurring.sheet.saveAmount`, `recurring.average.*`, `recurring.sections.*`, `recurring.sheet.{next,stop}`, `budget.strip.*`, `budget.summary.*`, `budget.saveBar.*`, `budget.empty.*`, `budget.known.*`, `budget.amountSheet.*`, `households.invite.*`, `households.qr.*`, `households.join.*`, `ui.keypad*`; identity `identity.account.{theme,themes,languageChoice}`, `identity.forgotPassword.{step,neutral,changeEmail}`.

## Requirement coverage

| REQ | Covered by |
|---|---|
| 1.1–1.9 | Shell, `NavDrawer`, `DrawerHints`, `UiDrawer`, routes |
| 2.1–2.4 | Dashboard page and store |
| 3.1–3.9 | `EntrySheet` add mode, `AmountPad`, `EntryHistory`, `suggestion.ts` |
| 4.1–4.3 | `EntrySheet` recurring mode |
| 5.1–5.2 | `EntrySheet` edit mode |
| 6.1–6.3 | Analysis page, store, `fixedByDay` |
| 7.1–7.4 | Operations page, `loadAll`, `matchesSearch`, `dayGroups` totals |
| 8.1 | Category picker, unchanged |
| 9.1–9.7 | Budget page, `ui-month-strip`, `AmountSheet`, `ui-save-bar`, `dueDatesIn` |
| 10.1–10.4 | Recurring page, `monthlyAverage`, `RuleSheet` |
| 11.1–11.4 | Household page, `InviteSheet`, `QrCode`, `JoinPage` |
| 12.1 | `AccountPage`, `IDENTITY_PREFERENCES` |
| 13.1–13.5 | Identity pages, code step, forgot password, `BookNewPage` |
| 14.1–14.5 | Toolbox pieces; `uiTabAction` (spec 004) |
| 15.1–15.7 | i18n files, logical CSS, `<bdi>`, reduced motion, quiet reads, routes kept |

## Risks / alternatives considered
- **Drawer history entry:** an extra entry with the same URL is ignored by the router (`onSameUrlNavigation: 'ignore'`); navigation waits for the pop so the two never race.
- **Search over ≤ 20 pages:** above 500 entries a month the search says it is partial (accepted, open question B).
- **Keypad by media query at open time:** rotating a tablet across 820 px while the sheet is open keeps the first choice.
- **Analysis cards moved, not copied:** the dashboard stops loading three summaries it no longer shows.
