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

## 003 — Atoms and catalog (in review)

- `@shared/ui-atoms`: one library, one entry point, one folder per atom (16 Olivier atoms), Lucide starter icons (ISC licence), directional icons mirrored in RTL.
- Raw sizes only as component tokens (`--ui-<component>-*`) declared in each atom's stylesheet; `color-mix()` takes `var(--ui-*)` colours only; Bootstrap radius mapped to `--ui-radius-sm`.
- `UI_TEXT` token for built-in strings ("Chargement", "(facultatif)"); no translation keys in toolbox UI.
- `apps/ui-catalog`: every atom in every state with theme, accent and direction switches.
- Tests: Angular Testing Library and user-event, one lean spec file per atom, jsdom only.
- Non-goals: molecules, organisms and templates (spec 004), screens in `expenses-management`, multi-currency amounts.
- Files: `003-atoms-catalog/` (requirements 17 KB, design 17 KB, tasks 7 KB).

## Next

004 Molecules, organisms and templates (CDK overlays, app shell). See [docs/ROADMAP.md](../docs/ROADMAP.md).
