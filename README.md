# angular-frontend-toolbox

An Nx monorepo that holds a **frontend toolbox** and the apps built on it. The toolbox (`shared/`) is brand-free and contains everything every app reuses: UI components, themes, session and sign-in, HTTP error handling and signal stores. Each app adds only its own pages and domain code. The first app is `expenses-management`, a French-first household budget app (amounts in TND, Laravel + Sanctum backend).

The target structure is defined in **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**, which is binding. The code is being moved there step by step (see [Roadmap](#roadmap)).

## Projects

| Project | Path | Today | Target |
|---|---|---|---|
| `expenses-management` | `apps/expenses-management` | Budget app; builds and runs | Stays; domain code moves to `libs/expenses/` |
| `expenses-management-e2e` | `apps/expenses-management-e2e` | Playwright smoke test | Stays |
| `auth` | `shared/auth` | Auth pages, store, interceptors | `shared/identity/*` + `shared/http/*` (spec 005) |
| `stores` | `shared/stores` | Generic signal-store features | Stays (`type:data-access`) |
| `ui-components` | `shared/ui-components` | Widgets, form controls, validators, SCSS | `shared/ui/*` atomic levels, `util-forms`, `util-format` (specs 002–004) |

Full target library map: [ARCHITECTURE §2](docs/ARCHITECTURE.md#2-library-map); migration of each existing piece: [§7](docs/ARCHITECTURE.md#7-migration-of-existing-code).

## Prerequisites

- **Node.js 24**, pinned in `.nvmrc` and `package.json` `engines` (developed with v24.13.0), and npm 11.
- `npm ci` to install.

## Commands

```bash
npx nx serve expenses-management                        # dev server on http://localhost:4200
npx nx build expenses-management --configuration=development
npx nx lint <project>                                   # or: npx nx run-many -t lint
npx nx affected -t lint build                           # only projects changed vs main
npx nx test <project>                                   # unit tests (Vitest)
npx nx e2e expenses-management-e2e                      # Playwright smoke test (starts the dev server)
npm run ci                                              # lint + test + build for projects changed vs main
npm run ci:all                                          # lint + test + build for every project
```

CI (`.github/workflows/ci.yml`) runs lint, test and build for the affected projects on every pull request, and the e2e smoke test on `main`.

## How work is done

All non-trivial work follows **spec-driven development** (rules in [CLAUDE.md](CLAUDE.md)):

1. Each change gets a spec folder `specs/<NNN>-<slug>/` with `requirements.md`, `design.md` and `tasks.md` (templates in `specs/_templates/`).
2. Each document is approved before the next one is written, and code is written only after the tasks are approved.
3. Commits reference the spec and requirement IDs, for example `feat(expenses): add category filter [spec 001, REQ-2.1]`.

## Roadmap

1. **001 Foundations** (in review): tests, e2e, project tags and boundaries, CI, OnPush everywhere, build fixes, removal of unused projects
2. **002 Tokens and themes** (next)
3. **003 Atoms and catalog**
4. **004 Molecules, organisms and templates**
5. **005 Shared logic** (`http/*`, `identity/*`)

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): the approved architecture (binding)
- [CLAUDE.md](CLAUDE.md): workflow, conventions and known issues
