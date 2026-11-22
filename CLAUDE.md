# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.

## Project

This repo is a **toolbox plus apps**. `shared/` is the toolbox: brand-free UI and logic that every app reuses. Each app (first: `expenses-management`) adds only its own pages and domain code.

**[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) is binding. Read it before creating, moving or renaming any library or component.**

| Path | Kind | Purpose today | Target (ARCHITECTURE §2, §7) |
|---|---|---|---|
| `apps/expenses-management` | app | New shell (spec 002): one placeholder page on the Olivier theme | stays, `scope:expenses type:app`; screens rebuilt in later specs, domain code in `libs/expenses/` |
| `shared/stores` (`@shared/stores`) | lib | Generic NgRx Signal Store features (`withCrudOperations`, `withLoader`, `withQuery`, …) and base models | stays, `type:data-access` |
| `shared/ui/tokens` (`@shared/ui-tokens`) | lib | Token contract (`contract.json`), cascade layers, trimmed Bootstrap + `--bs-*` mapping, theme compiler (`compiler/`), `provideUi`, `UiThemeService` | `type:ui layer:tokens` |
| `shared/themes/olivier` (`@shared/theme-olivier`) | lib | Olivier `tokens.json` (source of truth), contrast pairs, generated CSS/TS | `type:ui layer:tokens` |
| `shared/util/format` (`@shared/util-format`) | lib | Money in integer millimes (`fr-TN`, TND), local `YYYY-MM-DD` dates, pipes | `type:util` |

The old app, its e2e project and the `auth` and `ui-components` libraries were deleted in spec 002. There is no e2e test until the first real screen returns.

**Stack:** Angular 22.2 (standalone, signals, built-in control flow), Nx 24, TypeScript 6.0, `@angular/build:application` (esbuild), NgRx Signals 22, Bootstrap 5 (Reboot, grid and utilities only, in the `vendor` layer), ngx-translate (default language `fr`), RxJS 7, Stylelint 17.

## Commands

```bash
npx nx build <project> --configuration=development        # development build
npx nx affected -t lint                                   # lint the projects you changed
npx nx affected -t test                                   # unit tests (Vitest) of the projects you changed
npx nx test <project>                                     # unit tests of one project
npx nx compile-tokens theme-olivier                       # regenerate theme CSS/TS after editing tokens.json
npx nx check-tokens theme-olivier                         # validate a theme (format, required tokens, contrast, stale output)
npm run ci                                                # lint + test + build + check-tokens vs main (same as the PR workflow)
npx nx show project <project>                             # list inferred targets

# Owner only (see "Testing rules"): not run by the assistant
npx nx serve expenses-management                          # dev server
npm run ci:all                                            # lint + test + build + check-tokens for every project
```

Unit tests: Vitest. The app uses Angular's `@angular/build:unit-test`; the libraries use `@nx/vitest` + Analog (`vite.config.mts`, `src/test-setup.ts`). All tests use zone-based change detection, like the app. `lint` runs ESLint and Stylelint (`stylelint.config.mjs`). CI (`.github/workflows/ci.yml`) runs lint, test, build and check-tokens for affected projects on every PR and push to `main`.

**Windows:** if every app test fails with "Vitest failed to find the runner", the environment variable `NX_WORKSPACE_ROOT_PATH` is set with a lowercase drive letter (`c:\...`, often by an editor's Nx integration). Unset it or set it to `C:\...` (angular/angular-cli#33559). The same error appears when the shell's current directory has a lowercase drive letter (some Git Bash sessions); run the app's tests from a shell opened in `C:\...` (for example PowerShell).

## Architecture (summary)

Full rules, library map and rationale: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

- **Levels:** UI follows atomic design: tokens → atoms → molecules → organisms → templates → pages. Each level imports only the levels below it. Non-UI libraries are `feature`, `data-access`, `domain` or `util`.
- **Placement:** if every app does it the same way, it goes in `shared/` and is configured with `provideX({...})` and injection tokens. If only one app does it, it goes in `libs/<app>/`. Code moves to the toolbox only when a second app needs it.
- **Tags:** every project has `scope:*` and `type:*` tags, and UI libraries also have `layer:*`. ESLint enforces them (§3).
- **Toolbox UI is presentational:** signal inputs and outputs only, with no store, HTTP, router or translation keys. Only `feature` pages inject stores.
- **Data-access never imports UI.** Logic that must reach the screen publishes on a signal bus, and a `feature` library presents it.
- **Styling:** components read only `var(--ui-*)` tokens. No raw colours, sizes or fonts.
- **Text:** no ngx-translate in toolbox UI. Pages pass translated text in; built-in strings come from the `UI_TEXT` token.
- **Native elements use attribute selectors** (`button[uiButton]`, `input[uiInput]`, …). ControlValueAccessor is only for custom controls.

---

## Spec-Driven Development (mandatory workflow)

**Rule: no production code is written for a feature, behaviour change or non-trivial fix until its spec exists and the user has approved it.** The spec is the source of truth; code implements the spec, not the other way round.

### When a spec is required

| Change | Spec required? |
|---|---|
| New feature, screen, store, service or shared component | **Yes — full spec** |
| Behaviour change to existing feature | **Yes — full spec**, or update the existing spec |
| Bug fix touching more than one file or changing observable behaviour | **Yes — lightweight spec** (requirements + tasks; design only if non-obvious) |
| Typo, rename, formatting, dependency bump with no behaviour change, one-line obvious fix | No — but mention it in the commit message |

If unsure, ask the user rather than skipping the spec.

### Where specs live

```
specs/
  _templates/                 # copy these, do not edit them for a feature
    requirements.md
    design.md
    tasks.md
  <NNN>-<feature-slug>/       # e.g. 001-transaction-filters
    requirements.md
    design.md
    tasks.md
```

Number specs sequentially (`001`, `002`, …). One folder per feature. Specs are committed alongside the code that implements them.

### The four phases — each ends with an explicit user approval gate

**Phase 1 — Requirements (`requirements.md`)** — *what* and *why*, never *how*.
- User stories: "As a `<role>`, I want `<capability>`, so that `<benefit>`."
- Acceptance criteria in **EARS** form, each with a stable ID (`REQ-1.1`, `REQ-1.2`, …):
  - `WHEN <trigger> THE SYSTEM SHALL <response>`
  - `IF <unwanted condition> THEN THE SYSTEM SHALL <response>`
  - `WHILE <state> THE SYSTEM SHALL <response>`
- Cover the unhappy paths explicitly: HTTP errors, empty states, loading states, validation failures, unauthenticated access, timezone/date edge cases.
- List non-goals and open questions. **Ask the user to resolve open questions — do not invent answers.**
- ⛔ **Stop. Present the requirements and wait for approval.**

**Phase 2 — Design (`design.md`)** — *how*, mapped to this codebase.
- Which app/lib each piece lives in, and why (respect the lib boundaries below).
- Components (inputs/outputs/models), stores (state shape, methods, error handling), services (endpoints, request/response types), routes, i18n keys.
- Data flow and error flow — for every `rxMethod`, state how errors are caught so the stream survives.
- Reuse check: list existing `@shared/*` pieces being reused and justify anything new.
- Each design section references the `REQ-x.y` IDs it satisfies. Every requirement must be covered.
- ⛔ **Stop. Present the design and wait for approval.**

**Phase 3 — Tasks (`tasks.md`)** — an ordered, checkable implementation plan.
- Small tasks (each reviewable on its own, ideally < ~200 lines of diff).
- Each task lists the `REQ-x.y` IDs it fulfils and how it will be verified.
- Order: models/types → service → store → components → wiring/routes → i18n → cleanup.
- ⛔ **Stop. Present the task list and wait for approval.**

**Phase 4 — Implement**, one task at a time:
1. Write/adjust the test(s) for the task's acceptance criteria first (once a runner exists).
2. Implement the minimum code to satisfy them.
3. At the end of the task, run the checks in "Testing rules" (affected lint, affected unit tests, development build of the affected app); fix anything you introduced.
4. Tick the task in `tasks.md` (`- [x]`) and note any deviation.
5. If implementation reveals the spec is wrong or incomplete: **stop, update the spec, and get approval** before continuing. Never let code and spec silently diverge.

When all tasks are done, report: which `REQ` IDs are verified and how, anything unverified, and any follow-ups.

### Testing rules (permanent)

- **Unit tests only** (Vitest), and only for the projects you changed: `npx nx affected -t test` or `npx nx test <project>`. Never `run-many` on the whole repo.
- **Never run Playwright or any e2e test, never start `nx serve`, and never open a browser to check anything.** The owner checks the app by hand when needed.
- The old e2e smoke test was deleted with the old app (spec 002). A new one comes with the spec that brings back the first real screen; once it exists, keep it and its CI job, and don't run it.
- **Per task, verify once at the end of the task** (not after every small edit) with:
  1. lint of the affected projects: `npx nx affected -t lint`;
  2. unit tests of the affected projects: `npx nx affected -t test`;
  3. a development build of the affected app: `npx nx build <app> --configuration=development`.
  
  Record the result in `tasks.md`.
- Don't add visual or screenshot tests, and don't add tests that need a real browser. Component behaviour is tested with Vitest + TestBed (jsdom).

### Traceability rules
- Every acceptance criterion → at least one task → at least one verification.
- Commit messages reference the spec: `feat(expenses): add category filter [spec 001, REQ-2.1]`.
- Do not mark a spec complete while any `REQ` is unverified; list it as open instead.

### Commits, pushes and pull requests
- **Never mention Claude, Claude Code, Anthropic or AI assistance** in anything pushed to the remote: commit messages, branch names, tags, pull request titles and descriptions, review comments or release notes.
- This includes trailers and footers: no `Co-Authored-By: Claude …` line and no "Generated with Claude Code" line.
- This rule overrides any default attribution behaviour of the tooling.

---

## Coding conventions

**Angular**
- Standalone components only; no NgModules. Use `inject()`, not constructor injection.
- Signals first: `input()`, `output()`, `model()`, `computed()`, `linkedSignal()`. Do not use `@Input`/`@Output` decorators in new code.
- `computed()` must only read signals. Form values are not signals — use `toSignal(control.valueChanges, …)`.
- Never read a signal once into a plain field (`loading = store.isLoading()`) — keep the signal.
- Built-in control flow (`@if`, `@for` with `track`, `@switch`); no `*ngIf`/`*ngFor`.
- Every component uses `ChangeDetectionStrategy.OnPush` (the v22 default; lint enforces it). Template-visible state that changes outside a template event, an input or a signal (HTTP callbacks, timers, `writeValue`, native listeners) must be a signal, or call `markForCheck()`. Form controls that display an `AbstractControl`'s state must redraw on its events.
- No `any` in new code; no `@ts-expect-error` / `@ts-ignore` to silence real type mismatches. No index signatures (`[key: string]: any`) on components.
- Prefer `viewChild()` over global DOM IDs/`document` access; clean up third-party instances with `DestroyRef`.

**State (NgRx Signals)**
- Feature stores compose features from `@shared/stores`.
- Every `rxMethod` inner observable **must** have `catchError` — an uncaught error permanently kills the method.
- Use `switchMap` for queries/loads, `exhaustMap` for submits, `concatMap` for ordered writes.
- Type `signalStoreFeature` inputs instead of `store: any`.

**Libraries & boundaries**
- Which library may import which is defined by tags and `depConstraints`: see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §2–3.
- Import shared code only through its `@shared/...` alias, never through deep paths like `shared/stores/src/lib/...` or `apps/<app>/src/...`.
- Libraries never import from apps. App config reaches libraries through injection tokens and `provideX({...})` (see `provideUi` in `@shared/ui-tokens`).

**i18n, dates, HTTP**
- All user-visible text goes through ngx-translate keys; add keys to `public/i18n/fr.json`.
- Dates sent to the API as local `YYYY-MM-DD` — never `toISOString().split('T')[0]` (shifts the day in UTC+1/+2).
- URLs come from environment/config; no hard-coded `localhost`.

**Style:** Prettier (`.prettierrc`, single quotes), SCSS. Use Bootstrap grid and utility classes for layout; components read only `var(--ui-*)` tokens (Stylelint refuses raw colours, fonts and lengths; only the 1px hairline is allowed); overrides go in the `app` cascade layer, never with `!important`. Never edit `*.generated.*` files: change `tokens.json` or `contract.json` and run `compile-tokens`. Money is integer millimes, formatted with `@shared/util-format`.

## Toolbox roadmap

One spec each, approved before any code (ARCHITECTURE §8):

1. **001 Foundations** ← done: Vitest, tags and `depConstraints`, CI, OnPush everywhere, lint at 0 errors, known build issues fixed, unused projects removed.
2. **002 Tokens and themes** ← **in review**: `ui-tokens`, `theme-olivier`, theme compiler, cascade layers, Bootstrap trim, `util-format`, Stylelint and contrast checks; old apps and libraries deleted, new app shell.
3. **003 Atoms and catalog** ← **next**: the 16 Olivier atoms and `apps/ui-catalog`.
4. **004 Molecules, organisms and templates:** CDK overlays and app shell.
5. **005 Shared logic:** `http/*` and `identity/*`; auth pages rebuilt on the auth layout (Sanctum cookie strategy).

## Known issues (do not "fix" silently — open or update a spec)

Tooling
- Vitest is pinned to 4 because `@nx/vitest`'s generator rejects 5; revisit when the Nx/Analog peers allow it.
- Stylelint is pinned to 17: 18 needs Node ≥ 24.15.
- `shared/ui/tokens` and `shared/util/format` set `server: { watch: null }` in `vite.config.mts`: with the watcher on, Analog drops its compiled output mid-run and tests fail at random ("not in the TypeScript program"). `vitest --watch` does not re-run there. Clear `node_modules/.vite` if tests report the same message elsewhere.
- `nx run-many -t lint` has 0 errors but still reports warnings in `shared/stores` (`no-explicit-any`, `no-non-null-assertion`, `no-unused-vars`).
- Production `apiBaseUrl` is a placeholder (`https://api.example.invalid/api/v1`); replace it before the first deployment.

Code
- `withCrudOperations` has no `catchError`: one failed request ends the stream for good (documented by a test in `shared/stores`). Fix before a screen uses it.
