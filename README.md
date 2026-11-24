# angular-frontend-toolbox

An Nx monorepo that holds a **frontend toolbox** and the apps built on it. The toolbox (`shared/`) is brand-free and contains everything every app reuses: UI components, themes, session and sign-in, HTTP error handling and signal stores. Each app adds only its own pages and domain code. The first app is `expenses-management`, a French-first household budget app (amounts in TND, Laravel + Sanctum backend).

The target structure is defined in **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**, which is binding. The code is being moved there step by step (see [Roadmap](#roadmap)).

## Projects

| Project | Path | Today |
|---|---|---|
| `expenses-management` | `apps/expenses-management` | New app shell (spec 002): one placeholder page on the Olivier theme. Screens are rebuilt in later specs. |
| `stores` | `shared/stores` | Generic signal-store features (`@shared/stores`) |
| `ui-tokens` | `shared/ui/tokens` | Token contract, cascade layers, trimmed Bootstrap, theme compiler, `provideUi` and the light/dark service (`@shared/ui-tokens`) |
| `theme-olivier` | `shared/themes/olivier` | The Olivier theme: `tokens.json` compiled to CSS (`@shared/theme-olivier`) |
| `util-format` | `shared/util/format` | Money in millimes (`fr-TN`, TND) and local dates, with pipes (`@shared/util-format`) |
| `ui-atoms` | `shared/ui/atoms` | The 16 Olivier atoms: button, chip, keyboard hint, input, select, checkbox, radio, switch, label, field message, icon, badge, avatar, amount, progress, spinner and skeleton (`@shared/ui-atoms`) |
| `ui-molecules` | `shared/ui/molecules` | 15 molecules: form field, alert, segmented control, chip group, stat, list, month switcher, search field, empty state, menu, option cards, code input, … (`@shared/ui-molecules`) |
| `ui-organisms` | `shared/ui/organisms` | Navigation (top bar, side rail, bottom tabs), dialog and sheet, confirmation, toasts, filter bar, grouped list, table (`@shared/ui-organisms`) |
| `ui-templates` | `shared/ui/templates` | App shell, page, auth and flow layouts (`@shared/ui-templates`) |
| `ui-catalog` | `apps/ui-catalog` | Every component in every state, one route per level, full-screen templates, with theme, accent and direction switches |

The old app, its e2e test and the `auth` and `ui-components` libraries were deleted in spec 002; their replacements are listed in [ARCHITECTURE §7](docs/ARCHITECTURE.md#7-migration-of-existing-code). Full target library map: [ARCHITECTURE §2](docs/ARCHITECTURE.md#2-library-map).

## Prerequisites

- **Node.js 24**, pinned in `.nvmrc` and `package.json` `engines` (developed with v24.13.0), and npm 11.
- `npm ci` to install.

## Commands

```bash
npx nx serve expenses-management                        # dev server on http://localhost:4200
npx nx build expenses-management --configuration=development
npx nx lint <project>                                   # ESLint + Stylelint
npx nx affected -t lint build                           # only projects changed vs main
npx nx test <project>                                   # unit tests (Vitest)
npx nx compile-tokens theme-olivier                     # regenerate the theme CSS after editing tokens.json
npx nx check-tokens theme-olivier                       # validate a theme: format, required tokens, contrast, stale output
npm run ci                                              # lint + test + build + check-tokens for projects changed vs main
npm run ci:all                                          # the same for every project
```

CI (`.github/workflows/ci.yml`) runs lint, test, build and check-tokens for the affected projects on every pull request and every push to `main`. There is no e2e test until the first real screen returns.

## How work is done

All non-trivial work follows **spec-driven development** (rules in [CLAUDE.md](CLAUDE.md)):

1. Each change gets a spec folder `specs/<NNN>-<slug>/` with `requirements.md`, `design.md` and `tasks.md` (templates in `specs/_templates/`).
2. Each document is approved before the next one is written, and code is written only after the tasks are approved.
3. Commits reference the spec and requirement IDs, for example `feat(expenses): add category filter [spec 001, REQ-2.1]`.

## Roadmap

1. **001 Foundations** (done): tests, project tags and boundaries, CI, OnPush everywhere, build fixes, removal of unused projects
2. **002 Tokens and themes** (done): token contract, Olivier theme, compiler, Stylelint and contrast checks, `util-format`; old apps and libraries deleted, new app shell
3. **003 Atoms and catalog** (done): the 16 atoms, `UI_TEXT`, Stylelint component-token rules, `ui-catalog`
4. **004 Molecules, organisms and templates** (in review): 27 components on `@angular/cdk`, breakpoints, catalog routes
5. **005 Shared logic** (`http/*`, `identity/*`)

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): the approved architecture (binding)
- [CLAUDE.md](CLAUDE.md): workflow, conventions and known issues
