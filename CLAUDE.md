# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository. Keep this file short: it is sent with every turn. Detail lives in `docs/` and `specs/`; open those files only when the task needs them.

## Project

This repo is a **toolbox plus apps**. `shared/` is the toolbox: brand-free UI and logic that every app reuses. Each app adds only its own pages and domain code.

**[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) is binding. Read it before creating, moving or renaming any library or component.**

| Path | Kind | Purpose |
|---|---|---|
| `apps/expenses-management` | app | Identity pages and signed-in shell on the Olivier theme, fr/en/ar |
| `apps/ui-catalog` | app | Every atom in every state (owner review) |
| `shared/stores` (`@shared/stores`) | lib | Generic NgRx Signal Store features and base models |
| `shared/ui/tokens` (`@shared/ui-tokens`) | lib | Token contract, cascade layers, Bootstrap mapping, theme compiler, `provideUi`, `UiThemeService` |
| `shared/themes/olivier` (`@shared/theme-olivier`) | lib | Olivier `tokens.json` (source of truth) and generated CSS/TS |
| `shared/util/format` (`@shared/util-format`) | lib | Money in integer millimes (`fr-TN`, TND), local dates, pipes |
| `shared/ui/atoms` (`@shared/ui-atoms`) | lib | The 16 Olivier atoms, icon registry |
| `shared/ui/molecules`, `organisms`, `templates` (`@shared/ui-*`) | lib | Form field, segmented control, menu…; top bar, rail, tabs, dialog, toasts…; app shell, page, auth and flow layouts |
| `shared/http/data-access`, `feature-errors` (`@shared/http-*`) | lib | `provideApi`, interceptor, `ApiError`, `ErrorBus`; the error presenter |
| `shared/identity/data-access`, `feature-auth` (`@shared/identity-*`) | lib | `SessionStore`, `AuthApi`, guards, `provideIdentity`; sign-in, sign-up, code, password and account pages |

**Stack:** Angular 22.2 (standalone, signals), Nx 24, TypeScript 6.0, NgRx Signals 22, Bootstrap 5 (Reboot, grid, utilities), ngx-translate (default `fr`), RxJS 7, Vitest 4, Stylelint 17.

## Where to read more (only when needed)

| Need | File |
|---|---|
| Library map, tags, boundaries, theming | `docs/ARCHITECTURE.md` |
| Spec phases, EARS format, testing and commit rules in full | `docs/WORKFLOW.md` |
| Detailed coding conventions | `docs/CONVENTIONS.md` |
| Roadmap, known issues, Windows note | `docs/ROADMAP.md` |
| What each finished spec delivered | `specs/README.md` (read this instead of the full spec files) |

## Commands

```bash
npx nx build <project> --configuration=development
npx nx affected -t lint
npx nx affected -t test
npx nx test <project>
npx nx compile-tokens theme-olivier      # after editing tokens.json
npx nx check-tokens theme-olivier
npm run ci                               # lint + test + build + check-tokens vs main
npx nx show project <project>
```

Keep command output short: add `--output-style=static` to Nx and show only the last lines of long logs.

## Architecture rules

- UI levels: tokens → atoms → molecules → organisms → templates → pages. Each imports only the levels below.
- If every app does it the same way, it goes in `shared/`; if only one app, in that app (`apps/<app>/src/app/`, by feature folder).
- Every project has `scope:*` and `type:*` tags (UI libs also `layer:*`); ESLint enforces them.
- Toolbox UI is presentational: signal inputs/outputs, no store, HTTP, router or translation keys.
- Data-access never imports UI. Libraries never import apps.
- Import shared code only through `@shared/...` aliases. App code stays in the app: no `libs/<app>/`, no `@expenses/*` alias.
- Styling reads only `var(--ui-*)` tokens; no raw colours, sizes or fonts.
- Native elements use attribute selectors (`button[uiButton]`); ControlValueAccessor only for custom controls.

## Workflow (short form: full text in `docs/WORKFLOW.md`)

No production code for a feature, behaviour change or multi-file fix until its spec exists and the user has approved it. A typo, rename, formatting or no-behaviour dependency bump needs no spec. If unsure, ask.

Specs live in `specs/<NNN>-<slug>/` (`requirements.md`, `design.md`, `tasks.md`; copy `specs/_templates`). Four phases, each ends with a user approval gate: requirements (EARS, `REQ-x.y` IDs, open questions asked not invented) → design → tasks → implement one task at a time (tests first). If the spec turns out wrong, stop, update it, get approval.

Keep specs lean: no restating of earlier specs, link to them instead.

## Testing rules

- Every time Claude writes or changes code, it runs `npx nx affected -t lint test --base=main --output-style=static` and fixes every failure before committing or pushing.
- Windows: if component tests fail with "is not resolved" or "failed to find the runner", the drive letter is lowercase. Prefix the command with `NX_DAEMON=false NX_WORKSPACE_ROOT_PATH='C:\projects\angular-frontend-toolbox'`.
- Claude never runs builds (`nx build`, `npm run ci`), Playwright or e2e, never `nx serve`, never opens a browser. The owner and GitHub Actions cover builds.
- Write the tests a task needs (Vitest, jsdom) and run them. In `tasks.md`, record the lint and test result.
- Run `compile-tokens` and `check-tokens` after editing `tokens.json` or `contract.json`, because they generate files.

## Commits, pushes and pull requests

- Few commits: one commit per PR by default, at most one per spec task. Never commit after each small edit, never add "fix", "wip" or "address review" commits for work not yet pushed (amend instead), and push once at the end.
- Commit messages reference the spec: `feat(expenses): add category filter [spec 001, REQ-2.1]`.
- Never mention Claude, Anthropic or AI assistance in anything pushed (messages, trailers, footers, branch names, PR text), unless the owner explicitly asks for a specific title or wording.

## Code checklist (full list in `docs/CONVENTIONS.md`)

- Standalone components, `inject()`, signals, built-in control flow, `OnPush`; no `any`.
- Component templates live in a sibling `.html` file via `templateUrl`; never an inline `template:` in a component `.ts`.
- One folder per component, named after the file (`parts/hero-card/hero-card.ts`); see `docs/CONVENTIONS.md`.
- Every `rxMethod` inner observable has `catchError`.
- No comments unless a *why* the code cannot express.
- User-visible text via ngx-translate keys in `public/i18n/fr.json`.
- Dates sent as local `YYYY-MM-DD`, never `toISOString().split('T')[0]`. Money in integer millimes via `@shared/util-format`.
- Never edit `*.generated.*`: change `tokens.json` or `contract.json` and run `compile-tokens`.
- Do not "fix" the known issues in `docs/ROADMAP.md` silently: open or update a spec.
