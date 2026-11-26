# Specs index

One page per finished spec. Read this instead of the full `requirements.md`, `design.md` and `tasks.md` (about 150 KB together). Open a full file only when you must change that spec or trace a specific `REQ`.

Workflow and format: [docs/WORKFLOW.md](../docs/WORKFLOW.md). Templates: `_templates/`.

## 001 — Foundations (implemented 2026-11-22)

Gave the workspace a safety net without changing what the app does.

- Vitest for apps and libraries; the Playwright smoke test was later deleted with the old app (spec 002).
- Every project tagged (`scope:*`, `type:*`, `layer:*` for UI); ARCHITECTURE §3 enforced by ESLint `depConstraints`, deep imports refused.
- Lint at 0 errors; the 33 components switched to `OnPush`.
- Removed `launcher`, `uncensored`, `profile-section` and the unused `module-federation` dependency.
- Production build fixed; one API base URL per app (production value is still a placeholder).
- GitHub Actions CI (lint, test, build for affected projects) plus the local `npm run ci`; Node 24.
- Files: `001-foundations/` (requirements 12 KB, design 24 KB, tasks 23 KB).

## 002 — Tokens and themes (implemented)

Made the toolbox brand-free and themeable.

- `@shared/ui-tokens`: token contract (`contract.json`, "must provide" and "may override"), cascade layers, trimmed Bootstrap (Reboot, grid, utilities in the `vendor` layer) mapped to `--bs-*`, `provideUi`, `UiThemeService` (light, dark, system in localStorage key `ui.theme`; accent chosen once).
- `@shared/theme-olivier`: `tokens.json` is the source of truth; generated CSS/TS. Fonts Inter and IBM Plex Sans Arabic from Google Fonts.
- Theme compiler plus `check-tokens` (format, required tokens, contrast, stale output).
- `@shared/util-format`: money in integer millimes (`fr-TN`, TND), local `YYYY-MM-DD` dates, pipes.
- Stylelint refuses raw colours, sizes and fonts everywhere, no ignore list.
- Deleted the old apps, `auth` and `ui-components`; kept `shared/stores`; new minimal `apps/expenses-management` shell.
- Files: `002-tokens-themes/` (requirements 22 KB, design 14 KB, tasks 9 KB).

## 003 — Atoms and catalog (implemented)

- `@shared/ui-atoms`: one library, one entry point, one folder per atom (16 Olivier atoms), Lucide starter icons (ISC licence), directional icons mirrored in RTL.
- Raw sizes only as component tokens (`--ui-<component>-*`) declared in each atom's stylesheet; `color-mix()` takes `var(--ui-*)` colours only; Bootstrap radius mapped to `--ui-radius-sm`.
- `UI_TEXT` token for built-in strings ("Chargement", "(facultatif)"); no translation keys in toolbox UI.
- `apps/ui-catalog`: every atom in every state with theme, accent and direction switches.
- Tests: Angular Testing Library and user-event, one lean spec file per atom, jsdom only.
- Non-goals: molecules, organisms and templates (spec 004), screens in `expenses-management`, multi-currency amounts.
- Files: `003-atoms-catalog/` (requirements 17 KB, design 17 KB, tasks 7 KB).

## 004 — Molecules, organisms and templates (in review)

- `@shared/ui-molecules`: 15 molecules (form field, alert, segmented control, chip group, option cards and code input as form controls, stat, list, section header, month switcher, search field, empty state, CDK menu, stepper, avatar group).
- `@shared/ui-organisms`: top bar, side rail, bottom tabs, `UiDialog` (dialog and sheet), `UiConfirm`, `UiToast`, filter bar, grouped list, table; `styles/overlays.scss`.
- `@shared/ui-templates`: app shell, page layout, auth layout, flow layout.
- Breakpoints (`@use 'breakpoints' as bp;`), shared focus-ring mixin, more `UI_TEXT` keys, `isRtl`; `ui-catalog` routes per level.
- Files: `004-molecules-organisms-templates/`.

## 005 — Identity (in review)

First spec that ships a toolbox part and a working app screen together.

- `@shared/http-data-access`: `provideApi`, interceptor (credentials, request id, XSRF header, one retry on 419), `ApiError` kinds, `ErrorBus`, `handling(...codes)`, `SESSION_EXPIRY`.
- `@shared/http-feature-errors`: `<shared-error-presenter />` (session expiry, offline, status toasts, server-error dialog), fr/en/ar.
- `@shared/identity-data-access`: `SessionStore` (async methods returning `AuthResult`), `AuthApi`, cookie strategy and token stub, `authGuard` / `guestGuard`, `provideIdentity`, `safeReturnUrl`.
- `@shared/identity-feature-auth`: sign-in, sign-up, email code, two-factor, forgot and reset password, unavailable and account pages; Google button (hidden while `googleClientId` is empty); fr/en/ar.
- `@expenses/shell` and the app: signed-in shell, `AuthFrame` with brand panel and FR / EN / ع switch, `LanguageService` (RTL for Arabic), merged translation loader, `UI_TEXT` from translations.
- Arabic texts are a draft for a native reader. Files: `005-identity/`.

## 006 — Households and books (in review)

First spec whose domain code lives in the app only; the toolbox gets nothing new.

- App code in `apps/expenses-management/src/app/households/` (`data/`, `pages/`, `parts/`, `support/`); `libs/expenses/shell` moved to `src/app/shell/`. ARCHITECTURE §2–§3: app-specific code stays in the app, no `libs/<app>/`, no `@expenses/*` alias.
- Data: `HouseholdsApi`, `BooksApi`, `InvitationsApi` (paginated `fetchAll`, mappers); `BooksStore` (selection per account in `localStorage`, fallback), `HouseholdStore`, `InvitationsStore`, all async methods returning `StoreResult`; `provideHouseholds` resets them on account change.
- Guards: `workspaceGuard` (`/`), `firstRunGuard` (`/bienvenue`), `householdBookGuard` (`/carnets/nouveau`), inline `noHouseholdGuard` (`/foyer/nouveau`).
- Pages: welcome (first-run choice, received invitations), household and book creation, `/foyer` (owner and member views, members, pending invitations, invite form, rename, delete, leave); `BookHome` placeholder.
- Shell: `BookSwitcher` (`ui-menu`) in the rail and the top bar on `bookBound` routes, "Foyer" destination.
- fr/en/ar `households.*`, `shell.*`, `home.*` keys; Arabic is a draft. Files: `006-households-books/`.

## 007 — Categories and operations (in review)

- Toolbox: `@shared/util-format` `formatMinor` (any currency, options `display`/`signed`), `parseMajor` (major-unit text to minor units, with reasons), `todayIn`, `addDays`, `addYears`, `minor` pipe; millimes helpers delegate to `formatMinor`. `ui-amount` gets `currency` (default TND). No new component.
- App `categories/`: `CategoriesApi` (ETag, `304`), `localStorage` copy `expenses.categories`, `CategoriesStore` (hydrate then revalidate once per session), `CategoryLabels` (fallbacks, accent-insensitive search), recents per account and book, `CategoryPicker` (drill-down, search, entry and filter modes), `CategoryChip`.
- App `operations/`: `EntriesApi`, `OtherNamesApi`, `entry-draft` (request and PATCH diff), `OperationsStore` (pages of 25, stale answers dropped, book switch, reset on account change) with `provideOperations`; `EntrySheet` (add and edit, big-amount confirmation, client `id` kept on retry, every handled code) opened by `EntrySheetService`; `/operations` page with day groups and filters (month, type, category, author).
- Shell: add buttons enabled (rail, top bar), "Opérations" destination, `list` icon. Backend category labels merged into `public/i18n/{fr,en,ar}.json`; Arabic is a draft. Files: `007-categories-operations/`.

## 008 — Dashboard, budget and recurring operations (in review)

- Toolbox: `ui-meter` and `ui-bar-list` in `@shared/ui-molecules` (catalog states); `parseMajor` option `allowZero`.
- App `ledger/`: `LedgerChanges` (entry, rule and budget writes mark the affected months stale) and `month-context` (`?mois`, clamp to `2000-01` … current + 12).
- App `dashboard/`: `SummaryApi`, `DashboardStore` (one state and generation per card, comparison only without a plan, first-use check), `/` with hero, watch list, categories, members, upcoming, recent, no-plan and first-use cards. `BookHome` removed.
- App `budget/`: `BudgetApi` (`get`, `save`, `copy`), `BudgetStore`, `BudgetDraft` (local totals, overlap rule), `/budget` with month switcher, lines, off-plan row, totals, copy with confirmations and an unsaved-changes guard; category picker `plan` mode.
- App `recurring/`: `RecurringApi`, `rule-draft`, `RecurringStore`, `RuleSheet`, `/operations/recurrentes`; "récurrent" badge on entries; operations page reads `?mois`/`?categorie`.
- Shell: "Budget" rail destination (`wallet` icon); `dashboard.*`, `budget.*`, `recurring.*` keys in fr/en/ar (Arabic draft). Files: `008-dashboard-budget-recurring/`.
- Charts (amendment, 2026-11-25, US-9): `ui-pace-chart` and `ui-trend-bars` in `@shared/ui-molecules` (inline SVG, RTL-mirrored time axis, hidden data table, catalog states); `Summary` keeps `days` and `months`; dashboard "Rythme du mois" and "6 derniers mois" cards, clickable category bars, skeleton cards; budget "Vue d'ensemble", expandable "Hors budget" with "Ajouter au budget", "Le mois dernier" per line, income and saving meters. Tasks T25–T44.

## 009 — Mobile-first redesign (implemented, in review)

- Toolbox: `ui-amount-keypad` (+ `pressKeypadKey`), `ui-month-strip`, `ui-save-bar` in `@shared/ui-molecules`; `UiDrawer` (CDK dialog at the inline-start edge, closes on back, follows a direction change) in `@shared/ui-organisms`; `--ui-app-shell-dock-offset`; `UI_TEXT` keypad strings; catalog states. `IDENTITY_PREFERENCES` token (data-access); account page with theme and language; forgot password in two steps on one page (`/mot-de-passe/nouveau` redirects).
- App shell: top bar (menu, book name, avatar), `NavDrawer` with books, destinations, hints (`DrawerHints`, quiet reads), theme, language, sign out; tabs Accueil, Opérations, raised « + », Budget, Récurrentes; rail with the same destinations.
- Routes: `/analyse`, `/recurrentes` (old `/operations/recurrentes` redirects), `/rejoindre#<token>`.
- Accueil: hero, today's entries (or the latest five), watch list, upcoming, link to the analysis. Charts moved to `analysis/` with `AnalysisStore`; the pace line leaves out rule-made expenses when all are known.
- Add sheet: one-off / recurring switch, keypad below 820 px (`AmountPad`), suggested category and three templates from `EntryHistory` (last 30 entries of the account), date and note chips, recurring rule creation. Edit sheet: added/changed by, delete in the body.
- Opérations: month totals, in-app search over up to 20 pages, chips, day totals. Budget: month strip with statuses (`BudgetPlans`), summary card, rows edited in `AmountSheet`, save bar, empty state, « Déjà connu » from rule due dates. Récurrentes: monthly averages, sections by type, ended rules collapsed; rule sheet is edit-only with « Arrêter ».
- Foyer: options menu per member, `InviteSheet` with e-mail and QR tabs (`qrcode` dependency, 10-minute countdown); `JoinPage` previews and accepts a QR token. First run ends on « Créer et noter une première dépense ».
- fr/en/ar keys (Arabic a draft). Deviations in `009-mobile-first-redesign/tasks.md`.
- Follow-up: budget polishing (month card with planned and actual views, line table, compact month strip), branch `spec/009-budget-polishing`, no spec (owner).

## Next

010 Production readiness. See [docs/ROADMAP.md](../docs/ROADMAP.md).
