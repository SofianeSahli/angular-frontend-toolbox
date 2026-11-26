# 009 — Mobile-first redesign: Requirements

> Status: Approved (2026-11-25, open questions A–D accepted as recommended)
> Scope:
> - **Toolbox (`scope:shared`):** new presentational components: drawer (side sheet), amount keypad, month strip, save bar; a raised action option on `ui-bottom-tabs`. Phone-first layout of the identity pages in `@shared/identity-feature-auth`. Exact levels are set in the design.
> - **App (`scope:expenses`):** `shell/` (top bar, drawer, tabs, rail), `dashboard/`, new `analysis/`, `operations/`, `categories/` (picker), `budget/`, `recurring/`, `households/`, `auth-frame/`, routes and translations.
> - **No backend change.** Contracts as in specs 006–008: [`004-invitations`](../../../personal-accountings-backend/specs/004-invitations/contract.md) (QR routes), [`006-transactions`](../../../personal-accountings-backend/specs/006-transactions/contract.md), [`007-summary`](../../../personal-accountings-backend/specs/007-summary/contract.md), [`008-budget`](../../../personal-accountings-backend/specs/008-budget/contract.md).
>
> Design source: [`design-reference/README.md`](design-reference/README.md) and its `screens/` (owner-approved on 2026-11-25). Screen numbers below (« écran N ») refer to the table in that README. Wording, order and layout of each screen come from it and are not restated here.

## Context

The app is used mostly on phones, and budget and recurring operations are hard to find. This spec moves the app to a phone-first layout: a top bar, a drawer that holds every destination, theme and language, and four tabs plus a raised « + ». Adding an operation becomes a keypad-first sheet that can also create a recurring rule. Charts move to a new « Analyse du mois » page, and the budget gets a month strip and a save bar. Every feature and contract of specs 005–008 is kept; only layout, navigation and a few interactions change.

**Earlier decisions this spec replaces** (owner, 2026-11-25):
- Spec 008 REQ-6.2/6.3 (rules created only from their screen): rules are now created from the add sheet (US-4); the rule sheet only edits.
- Spec 008 REQ-8.1 (Budget not a phone tab): Budget and Récurrentes are tabs; Foyer and Compte leave the tabs.
- Spec 008 REQ-3.3, 3.4, 9.7, 9.8 (charts on the dashboard): they move to `/analyse` (US-6).
- Spec 008 `/operations/recurrentes` becomes `/recurrentes`.

## User stories

- **US-1 — Navigation.** As a member, I want a top bar, a drawer and four tabs on my phone, so that every screen, my books, the theme and the language are one or two taps away.
- **US-2 — Accueil.** As a member, I want the home page to show what is left, today's entries, what to watch and what is coming, so that I see my day at a glance.
- **US-3 — Quick add.** As a member, I want to type an amount on a keypad, get the likely category already chosen and reuse a recent entry in one tap, so that I record an expense in a few seconds.
- **US-4 — Recurring from the add sheet.** As a member, I want to switch the add sheet to « Récurrente », so that I create a rule where I already enter amounts.
- **US-5 — Edit an entry.** As a member, I want to correct or delete an entry in a sheet that shows who added and changed it.
- **US-6 — Analyse du mois.** As a member, I want the month's charts on their own page, so that the home page stays short.
- **US-7 — Operations.** As a member, I want to search and filter a month's entries with chips and see day totals.
- **US-8 — Category picker.** As a member, I want to find a category by search, recents or a one-level-at-a-time accordion.
- **US-9 — Budget.** As a member, I want to move between months on a strip that shows which months are closed, current, planned or still to do, edit lines in place, and save all my changes at once.
- **US-10 — Recurring tab.** As a member, I want to see what is already committed each month, my rules by type, and edit or stop a rule.
- **US-11 — Household and invitations.** As an owner, I want to manage my household from the drawer and invite someone by e-mail or by a QR code shown on my phone.
- **US-12 — Account.** As a user, I want my account, theme, language, two-step sign-in and sign-out on one page.
- **US-13 — Identity and first run.** As a new or returning user, I want the sign-in, sign-up, code, password and first-run pages laid out for a phone.
- **US-14 — Toolbox.** As a developer, I want the drawer, keypad, month strip, save bar and raised tab action in the toolbox, so that every app gets them the same way.
- **US-15 — Quality.** As a user, I want all of this in French, English and Arabic (RTL), usable with keyboard and screen reader, calm under reduced motion, and clear when offline or when something fails.

## Acceptance criteria (EARS)

### US-1 — Navigation (écran « Navigation », `TopBar`, `Drawer`, `TabBar`)
- **REQ-1.1** WHILE the viewport is below the medium breakpoint THE SYSTEM SHALL show on every signed-in page a top bar with: a menu button that opens the drawer; in the centre the selected book's name with ▾ on book-bound pages (opens the drawer on its « Carnets » section) or the page title elsewhere; the account avatar, which opens `/compte`.
- **REQ-1.2** THE SYSTEM SHALL show in the drawer, in this order: an account header (name, e-mail); « Carnets » (the household book, personal books, « Nouveau carnet »; tapping a book selects it as the spec 006 book switcher does and closes the drawer); Accueil, Opérations; « Prévoir »: Budgets, Récurrentes, Analyse du mois; « Foyer et compte »: Foyer, Compte; « Apparence »: Clair / Sombre / Système; « Langue »: Français / English / العربية; « Se déconnecter ». The current destination is marked.
- **REQ-1.3** THE SYSTEM SHALL show hints beside drawer destinations: Budgets « <mois abrégé> · <reste> restants » for the current month when it has a plan (whole units, spec 008 REQ-2.1), Récurrentes « n règles » (live rules), Foyer « n membres ». Hints load when the drawer opens; WHILE loading, or IF a request fails, the hint is hidden and the destination still works.
- **REQ-1.4** WHEN the user picks a theme in the drawer THE SYSTEM SHALL apply it through `UiThemeService` (spec 002) at once, without closing the drawer. WHEN the user picks a language THE SYSTEM SHALL apply it through `LanguageService` (spec 005), switching direction for Arabic, and keep the drawer open on the same side in the new direction.
- **REQ-1.5** WHEN « Se déconnecter » is chosen THE SYSTEM SHALL sign out as spec 005 does. « Nouveau carnet » follows spec 006 (`/carnets/nouveau`, household only).
- **REQ-1.6** THE SYSTEM SHALL show bottom tabs below the medium breakpoint: Accueil (`/`), Opérations (`/operations`), a raised « + » that opens the add sheet in one-off mode (REQ-3.1), Budget (`/budget`), Récurrentes (`/recurrentes`). Pages reached only from the drawer (Analyse, Foyer, Compte) show no active tab.
- **REQ-1.7** THE SYSTEM SHALL add `/analyse` (book-bound, `workspaceGuard`) and `/recurrentes` (book-bound), and redirect `/operations/recurrentes` to `/recurrentes`, keeping its query parameters.
- **REQ-1.8** WHILE the viewport is at or above the medium breakpoint THE SYSTEM SHALL keep the side rail (spec 004) and list in it the drawer's destinations in the same order, including Analyse du mois and Récurrentes; theme and language stay on `/compte`. No other desktop change.
- **REQ-1.9** The drawer SHALL open from the inline-start edge (left in LTR, right in RTL), trap focus while open, close on Escape, on the backdrop and after a navigation, return focus to the menu button, and have an accessible name. WHEN the device's back gesture or browser back is used while it is open THE SYSTEM SHALL close it rather than leave the page.

### US-2 — Accueil (`/`, écran 1)
- **REQ-2.1** THE SYSTEM SHALL show, in this order: month switcher; hero « Reste à dépenser » (spec 008 US-2 and US-4, unchanged); « Aujourd'hui »; « À surveiller » (spec 008 REQ-3.2); « À venir » (spec 008 REQ-3.5, link to `/recurrentes`); a link card « Analyse du mois » to `/analyse?mois=…`. The pace chart, « Où va l'argent », « 6 derniers mois » and « Par membre » leave this page.
- **REQ-2.2** WHEN the selected month is the current month THE SYSTEM SHALL list in « Aujourd'hui » today's entries (book timezone), newest first, each with category, amount, author (`created_by.name`) and the « récurrent » badge (spec 008 REQ-6.7); a tap opens the edit sheet (US-5). WHEN there are none it SHALL show an empty state with an add button (opens REQ-3.1).
- **REQ-2.3** WHEN the selected month is not the current month THE SYSTEM SHALL title the section « Dernières opérations » and list the month's 5 latest entries (spec 008 REQ-3.6), with « Tout voir » to `/operations?mois=…`.
- **REQ-2.4** The first-use card, skeletons, per-card states and freshness rules of spec 008 (REQ-3.7, 3.8, 4.4, 8.3, 9.10) SHALL apply to the cards that remain.

### US-3 — Quick add (écran 2, `MobAdd`)
- **REQ-3.1** WHEN the add sheet opens THE SYSTEM SHALL focus the amount, show the keypad (REQ-14.2) below the medium breakpoint, and show « Une seule fois | Récurrente » at the top. The default mode is « Récurrente » when opened from « Nouvelle opération récurrente » (US-10) and « Une seule fois » from anywhere else (tab « + », rail, empty states, first run).
- **REQ-3.2** THE SYSTEM SHALL format the typed amount live with the book's currency and allow at most the currency's exponent in decimals (3 for TND, none for an exponent of 0). IF the amount is empty or zero THEN the save button is disabled. The amount is parsed with `parseMajor` and the spec 007 big-amount confirmation still applies.
- **REQ-3.3** THE SYSTEM SHALL pre-select a **suggested** leaf category, marked « suggérée », chosen from this account's last 30 entries in this book (`GET transactions?author=<me>`, pages followed until 30): the most frequent leaf among the entries whose `created_at`, in the book's timezone, is within ±2 h of the current time of day (wrapping at midnight); else the most frequent leaf among the 30; else none. Ties go to the most recent. Retired leaves are never suggested.
- **REQ-3.4** THE SYSTEM SHALL show, after the suggested category, other recent categories (spec 007 recents, without the suggested one) and « Autre catégorie… », which opens the picker (US-8). WHEN there is no suggestion THE SYSTEM SHALL pre-select nothing, and saving requires a category.
- **REQ-3.5** THE SYSTEM SHALL show up to 3 templates: the 3 most recent distinct (category, other name, amount) entries of the same 30. A tap fills the amount, category and other name; it does not save. WHEN there are none the row is hidden.
- **REQ-3.6** IF the history request fails or is slow THEN THE SYSTEM SHALL open the sheet at once without suggestion and templates, add them when the answer arrives only if the user has not chosen a category yet, and show no error. The history is kept per account and book for the session and refreshed after each save.
- **REQ-3.7** THE SYSTEM SHALL offer date chips « Aujourd'hui » (default) and « Hier » (book timezone) plus a collapsed native date field for another date (spec 007 limits), and a « Note » chip that reveals the comment field (200 characters). The « Précisez » field and suggestions of an « Other » leaf (spec 007) appear when such a leaf is chosen.
- **REQ-3.8** The save button SHALL show the formatted amount (« Ajouter 12,500 DT »). Saving, errors, retry with the same client `id`, and freshness follow spec 007 and spec 008 REQ-8.3.
- **REQ-3.9** WHILE the viewport is at or above the medium breakpoint THE SYSTEM SHALL show a normal amount field instead of the keypad, with the same switch, chips, suggestion and templates.

### US-4 — Recurring from the add sheet (écran 3, `MobAddRecurring`)
- **REQ-4.1** WHILE the sheet is in « Récurrente » mode THE SYSTEM SHALL title it « Nouvelle opération récurrente », replace the date row by a frequency row (« Chaque mois ▾ »: every N weeks / months / years, N 1–12) and a start / end row (« Dès aujourd'hui · sans fin »: `starts_on` default today, optional `ends_on`, limits of spec 008 REQ-6.3), and end the save label with the frequency (« … chaque mois »).
- **REQ-4.2** WHEN the user switches mode THE SYSTEM SHALL keep the amount, category, other name and comment, and keep the chosen date as `starts_on` (and back).
- **REQ-4.3** WHEN the user saves in « Récurrente » mode THE SYSTEM SHALL `POST recurring-rules` and handle every case of spec 008 REQ-6.4 (warning for a start today or in the past), REQ-6.5 (codes, `recurring_rule.limit_reached`, throttle, offline) and REQ-6.9 (stale data), then close the sheet with a toast.

### US-5 — Edit an entry (écran 4, `EditEntry`)
- **REQ-5.1** WHEN an entry is opened THE SYSTEM SHALL show a form sheet with its fields filled, « Ajoutée par <created_by> » and, when different or later, « · modifiée par <updated_by> », and the « récurrent » badge when it has a rule.
- **REQ-5.2** THE SYSTEM SHALL place « Supprimer l'opération… » in the body of the sheet, apart from « Enregistrer », and delete only after a `UiConfirm`. Saving (PATCH diff), deletion and every error follow spec 007.

### US-6 — Analyse du mois (`/analyse`, écran 5)
- **REQ-6.1** THE SYSTEM SHALL show on `/analyse` a month switcher (`?mois`, spec 008 REQ-1.1/1.2) and, in this order: the pace chart (spec 008 REQ-9.7), the expense categories as sorted bars (spec 008 REQ-3.3, 9.9: a tap opens `/operations?mois=…&categorie=…`), the six-month trend (spec 008 REQ-9.8, a bar opens `/analyse?mois=…`), and « Qui a ajouté quoi » per member (spec 008 REQ-3.4, hidden for a personal book).
- **REQ-6.2** THE SYSTEM SHALL draw the pace line **without fixed bills**: the cumulative expense per day minus the expense entries of that month that carry a `recurring_rule_id`, read from the month's expense entries (`type=expense`, pages followed, at most 20 pages). The target is then `expenses.planned` minus the amount of those entries. IF that list fails or passes the cap THEN THE SYSTEM SHALL draw the line with all expenses and keep the note « factures fixes incluses ». *(Open question A.)*
- **REQ-6.3** Each card SHALL keep its own loading, error and empty state, and the freshness rules of spec 008 REQ-8.3 and 9.11.

### US-7 — Operations (`/operations`, écran 6)
- **REQ-7.1** THE SYSTEM SHALL show a month switcher with the month's income and expense totals (summary of the month), a search field, and filter chips « Tout », « Dépenses », « Revenus », « Catégorie ▾ » (picker in filter mode, spec 007), « Membre ▾ » (household members; hidden for a personal book). Chips map to the spec 007 filters (`type`, `category`, `author`) and keep `?mois` / `?categorie` (spec 008 REQ-1.3).
- **REQ-7.2** WHEN the user types in the search field THE SYSTEM SHALL filter the selected month's entries in the app, matching comment, other name, category label (accent-insensitive, spec 007) and the amount text, after following all pages of the month (at most 20); an empty result shows « Aucune opération ne correspond ». IF the cap is reached THEN it says the search covers only the loaded entries. *(Open question B: no search parameter in the API.)*
- **REQ-7.3** THE SYSTEM SHALL group rows by day with the day's total of the shown rows. A day cut by a page boundary shows its total only once all its rows are loaded. Rows show category · author and the amount; a tap opens the edit sheet (US-5).
- **REQ-7.4** Loading, empty (« Aucune opération ce mois-ci » with an add button), error and offline states, paging and stale answers follow spec 007.

### US-8 — Category picker (écran 7)
- **REQ-8.1** THE SYSTEM SHALL show the picker as a sheet with a search field, recent categories as chips, and an accordion top → group → leaf where opening one item closes its siblings (as fixed after spec 007). Modes (entry, filter, plan) and their rules are unchanged (spec 007 REQ-3.3, spec 008 REQ-5.3).

### US-9 — Budget (`/budget`, écrans 8 et 9)
- **REQ-9.1** THE SYSTEM SHALL replace the month arrows by a month strip (REQ-14.3) covering the current month − 12 to + 12 (contract limit), scrolled so that the selected month is visible. Labels: past months « Clos », the current month « En cours », future months with a plan « Prévu », future months without one « À faire » (dashed). WHEN `?mois` is older than the strip THE SYSTEM SHALL add that month at its start.
- **REQ-9.2** THE SYSTEM SHALL learn whether a future month has a plan from `GET budgets/{month}` for the future months of the strip, loaded after the selected month, at most 12 reads. WHILE unknown, or IF a read fails, the month is shown with no status label. *(Open question C.)*
- **REQ-9.3** THE SYSTEM SHALL show for a month with a plan: an overview (Prévu / Dépensé / Reste, a meter, and « Copier le budget de <mois précédent> », spec 008 REQ-5.9 and 9.12), « Revenus attendus », the lines « dépensé / prévu » with a meter and « Le mois dernier » (spec 008 REQ-9.14), and « Hors budget » with « Ajouter » (spec 008 REQ-9.13).
- **REQ-9.4** WHEN the user taps a line THE SYSTEM SHALL let them edit its planned amount (keypad below the medium breakpoint) or remove it; changes stay in the local draft (spec 008 REQ-5.5).
- **REQ-9.5** WHILE the draft differs from the last answer THE SYSTEM SHALL show a save bar (REQ-14.4) above the tabs with « n modification(s) », « Annuler » (restores the last answer) and « Enregistrer » (spec 008 REQ-5.6, 5.7). WHEN there is no change the bar is hidden. The unsaved-changes guard of spec 008 REQ-5.8 still applies, also when moving on the strip.
- **REQ-9.6** WHEN a month has no plan THE SYSTEM SHALL show an empty state with « Copier <mois précédent> » (copy, spec 008 REQ-5.9, `budget.nothing_to_copy` handled) and « Partir de zéro » (shows the empty plan form).
- **REQ-9.7** WHEN the selected month is in the future THE SYSTEM SHALL show « Déjà connu pour <mois> »: the live rules with at least one due date in that month, each with its date(s) and amount, and the total of their expenses. Due dates are computed in the app from `starts_on`, `frequency`, `interval`, `ends_on` and the month-end rule of the contract. It is display only (no pre-filled lines). WHEN no rule is due, or IF the rules request fails, the card is hidden.

### US-10 — Recurring tab (`/recurrentes`, écrans 10 et 11)
- **REQ-10.1** THE SYSTEM SHALL show a card « En moyenne chaque mois, déjà prévu » with the monthly average of live rules, expenses and income apart: monthly `amount ÷ interval`, weekly `amount × 52 ÷ 12 ÷ interval`, yearly `amount ÷ 12 ÷ interval`, rounded down to whole units; and a « Nouvelle opération récurrente » button that opens the add sheet in « Récurrente » mode (REQ-3.1).
- **REQ-10.2** THE SYSTEM SHALL list live rules under « Dépenses » and « Revenus » (and « Épargne » only when such rules exist), each with name (comment, else category label), « Tous les 2 mois · prochaine le … » and amount; ended rules (`next_date` `null`) under « Terminées (n) », collapsed. A tap opens the rule sheet.
- **REQ-10.3** WHEN the book has no rule THE SYSTEM SHALL show an empty state explaining recurring operations, with « Nouvelle opération récurrente ». Loading, error and offline follow spec 008 REQ-3.7 and 8.5.
- **REQ-10.4** The rule sheet SHALL only edit: amount, category, every N × semaine / mois / an (segmented control), start, optional end, the info « Prochaine : … », and « Arrêter cette récurrence… » (delete with confirmation, spec 008 REQ-6.6). Editing rules and errors follow spec 008 REQ-6.4, 6.5, 6.8, 6.9.

### US-11 — Household and invitations (écrans 12 et 13)
- **REQ-11.1** THE SYSTEM SHALL lay out `/foyer` as in écran 12: household card (rename for the owner), members with an options menu, « Inviter quelqu'un », pending invitations with « Annuler », and the sensitive actions (« Supprimer le foyer » / « Quitter le foyer ») at the bottom. Behaviour, confirmations and errors are those of spec 006. There is no « Historique » block.
- **REQ-11.2** WHEN the owner taps « Inviter quelqu'un » THE SYSTEM SHALL open a sheet with tabs « Par e-mail » (the spec 006 invite form) and « QR code, sur place ».
- **REQ-11.3** WHEN the owner opens the QR tab THE SYSTEM SHALL `POST households/{household}/qr-invitations` and draw a QR code of the link `<app origin>/rejoindre#<token>`, with a countdown to `expires_at` (10 min) and « Nouveau code » (a new POST, which cancels the previous code). WHEN the countdown reaches zero THE SYSTEM SHALL dim the code and say it expired. The token is kept only in memory and dropped when the sheet closes. Errors: `request.throttled` (with the wait), `household.forbidden`, `household.not_found`, offline. *(Open question D.)*
- **REQ-11.4** WHEN a signed-in user opens `/rejoindre#<token>` THE SYSTEM SHALL `POST qr-invitations/preview` and show the household it invites to with « Rejoindre » and « Refuser »; « Rejoindre » sends `accept` and opens `/`. IF the answer is `invitation.not_found` THEN it says the code is no longer valid; `household.already_joined` (leave first), `household.member_limit`, `request.throttled` and offline get their own messages. A signed-out user is sent to sign in and back (spec 005 `returnUrl`, fragment kept). *(Open question D.)*

### US-12 — Account (`/compte`, écran 14)
- **REQ-12.1** THE SYSTEM SHALL show the profile (name, e-mail, phone, account language) read-only, then Langue and Thème (same choices as REQ-1.4), the two-step switch, the Google link state, and « Se déconnecter ». Behaviours are those of spec 005. Editing the profile, the password and the `ar` account locale are not offered.

### US-13 — Identity and first run (écrans 15–21)
- **REQ-13.1** THE SYSTEM SHALL lay out sign-in, sign-up, code and forgot-password pages phone first as in écrans 15–18, with the FR / EN / ع switch on sign-in. Behaviours, routes and errors stay those of spec 005.
- **REQ-13.2** WHEN an account is created THE SYSTEM SHALL send as `locale` the current UI language when it is `fr` or `en`, and `fr` when it is `ar` (the backend accepts `fr` and `en` only).
- **REQ-13.3** THE SYSTEM SHALL use one code layout for e-mail confirmation and two-step sign-in (both routes kept).
- **REQ-13.4** THE SYSTEM SHALL do « Mot de passe oublié » in two steps on one page: e-mail, then code and new password (`auth/password/forgot`, `auth/password/reset`), with a neutral message after step 1 that does not tell whether the address exists. The old reset route redirects to it.
- **REQ-13.5** THE SYSTEM SHALL lay out the first-run pages (welcome, create household, create book) as in écrans 19–21 with a step indicator 1/2, 2/2. The last step ends on « Créer et noter une première dépense », which creates the book, opens `/` and then the add sheet in one-off mode. Behaviours and errors stay those of spec 006.

### US-14 — Toolbox (presentational, signal inputs/outputs, `var(--ui-*)` only, in `apps/ui-catalog` in every state)
- **REQ-14.1** **Drawer:** a side sheet on the CDK dialog that opens from the inline-start edge, with a title, a content slot and the behaviour of REQ-1.9; it slides in, and appears without motion under `prefers-reduced-motion: reduce`.
- **REQ-14.2** **Amount keypad:** keys 1–9, the decimal separator, 0 and ⌫, as buttons with accessible names; inputs `decimals` (0 hides or disables the separator key), `separator` and `maxDigits`; it emits the edited text and never formats currency itself. It also accepts digits, `,` / `.` and Backspace from a physical keyboard while focused. Keys are at least 44 × 44 px and keep their order in RTL.
- **REQ-14.3** **Month strip:** a horizontal, scrollable list of months; inputs: the months with their label and an optional status (`closed | current | planned | todo`, `todo` drawn dashed), the selected month; output: the chosen month. Keyboard: arrows move between months (mirrored in RTL), Enter or Space selects; the selected month has `aria-current`; status is never colour alone.
- **REQ-14.4** **Save bar:** a sticky bar with a text, a secondary and a primary action, placed above the bottom tabs and the device safe area; it announces itself politely when it appears (`aria-live`), and never covers focused content.
- **REQ-14.5** **Raised tab action:** `ui-bottom-tabs` accepts one raised action in the middle that emits an event instead of navigating, with its own accessible name.

### US-15 — Quality
- **REQ-15.1** THE SYSTEM SHALL provide every new text as ngx-translate keys in `public/i18n/{fr,en,ar}.json` (Arabic a draft); the toolbox components take their texts as inputs or through `UI_TEXT`.
- **REQ-15.2** THE SYSTEM SHALL mirror every new layout in RTL (drawer side, strip direction, chevrons), keep numbers in `<bdi>` with `tabular-nums`, and keep the keypad digits in 1–9 order.
- **REQ-15.3** WHEN `prefers-reduced-motion: reduce` is set THE SYSTEM SHALL open the drawer and sheets and show the save bar without animation.
- **REQ-15.4** THE SYSTEM SHALL keep every page usable with keyboard and screen reader: the switch « Une seule fois | Récurrente » is a segmented control with radio semantics, the suggested category says « suggérée » to assistive technology, sheets trap and restore focus, and touch targets are at least 44 × 44 px.
- **REQ-15.5** WHILE offline THE SYSTEM SHALL keep the spec 005–008 behaviour: per-card `http.offline` messages with « Réessayer », and forms that keep what was typed.
- **REQ-15.6** THE SYSTEM SHALL keep money in integer minor units through `@shared/util-format` and dates in the book's timezone (`todayIn`), never the browser's.
- **REQ-15.7** Every existing route, deep link and query parameter SHALL keep working; no backend call is added beyond the reads named above.

Checklist — covered?
- [x] Loading state (REQ-1.3, 2.4, 3.6, 6.3, 9.2)
- [x] Empty state (REQ-2.2, 3.5, 7.2, 7.4, 9.6, 9.7, 10.3)
- [x] HTTP / network errors (REQ-3.8, 4.3, 11.3, 11.4, 15.5)
- [x] Validation errors (REQ-3.2, 4.3; specs 007–008 codes)
- [x] Unauthenticated / expired session (spec 005; REQ-11.4 `returnUrl`)
- [x] Date & timezone edge cases (REQ-3.3, 3.7, 9.7, 15.6)
- [x] i18n (REQ-15.1, 15.2)

## Non-goals
- Editing the profile or the password while signed in; the `ar` account locale (backend gaps).
- The « Historique » block of the household (no endpoint).
- A desktop redesign beyond the rail's destinations (REQ-1.8).
- Scanning a QR code inside the app (camera), Capacitor, widgets, haptics: spec 011.
- Pre-filling budget lines from recurring rules (REQ-9.7 is display only).
- Any backend change, new endpoint or search parameter.

## Open questions
Answered by the owner on 2026-11-25 (every recommendation accepted): routes `/analyse` and `/recurrentes` with a redirect; the suggestion rule (REQ-3.3); rules created from the add sheet; « Déjà connu » display only; templates = 3 most recent distinct; keypad below 820 px only; the new toolbox components.

Found while reading the contracts. Each has a recommendation already written into the requirements; please confirm or correct:
- [x] **A. Pace chart without fixed bills (REQ-6.2).** The summary does not say which entries came from a rule. *Recommended:* subtract the month's rule-made expense entries, read from the entries list (≤ 20 pages); fall back to « factures fixes incluses ». Alternative: keep spec 008's line with fixed bills included.
- [x] **B. Search in Opérations (REQ-7.2).** The API has no text search. *Recommended:* search in the app over the selected month's entries (≤ 20 pages).
- [x] **C. Month strip statuses (REQ-9.2).** « Prévu » / « À faire » need one budget read per future month. *Recommended:* up to 12 reads after the selected month loads (reads are not throttled); no label until known.
- [x] **D. QR invitation (REQ-11.3, 11.4).** The contract leaves the encoded link to the frontend, and drawing a QR code needs an encoder. *Recommended:* encode `<origin>/rejoindre#<token>` (fragment, so the token never reaches server logs); the person joining scans it with the phone's camera app and lands on a new `/rejoindre` page (preview, then accept); the QR is drawn with the small MIT library `qrcode` (one new dependency), wrapped in the app. In-app scanning stays in spec 011.
