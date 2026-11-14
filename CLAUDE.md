# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.

## Project

Nx monorepo of Angular front-end apps sharing a common toolbox of libraries.

| Path | Kind | Purpose |
|---|---|---|
| `apps/expenses-management` | app | Personal finance dashboard (transactions, summary, charts, profile) |
| `apps/launcher` | app | Entry/launcher app (currently does not build — see Known issues) |
| `apps/uncensored` | app | Empty scaffold |
| `shared/auth` (`@shared/auth`) | lib | Login/register/reset flows, auth store, HTTP interceptors |
| `shared/stores` (`@shared/stores`) | lib | Generic NgRx Signal Store features (`withCrudOperations`, `withLoader`, `withQuery`, …) and base models |
| `shared/ui-components` (`@shared/ui-components`) | lib | UI widgets, form controls, validators, SCSS theme |
| `shared/profile-section` | lib | Placeholder (index points to a missing file) |

**Stack:** Angular 22.2 (standalone, signals, built-in control flow), Nx 24, TypeScript 6.0, `@angular/build:application` (esbuild), NgRx Signals 22, ng-bootstrap 21 + Bootstrap 5, ngx-translate (default language `fr`), Chart.js, RxJS 7.

## Commands

```bash
npx nx serve expenses-management                         # dev server
npx nx build <project> --configuration=development        # build
npx nx lint <project>                                     # lint one project
npx nx run-many -t lint                                   # lint everything
npx nx affected -t lint build                             # only what changed
npx nx show project <project>                             # list inferred targets
```

No unit-test runner is configured yet (`*.spec.ts` files exist but cannot run). Adding one (Vitest preferred) is a prerequisite for the "tests first" step below — until then, see "Verification without a test runner".

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
3. Run `nx lint` and `nx build` for affected projects; fix anything you introduced.
4. Tick the task in `tasks.md` (`- [x]`) and note any deviation.
5. If implementation reveals the spec is wrong or incomplete: **stop, update the spec, and get approval** before continuing. Never let code and spec silently diverge.

When all tasks are done, report: which `REQ` IDs are verified and how, anything unverified, and any follow-ups.

### Verification without a test runner

Until unit tests can run, each task must still be verified and the method recorded in `tasks.md`:
- `npx nx build <app> --configuration=development` passes (strict templates catch most binding errors).
- `npx nx lint <project>` introduces no new errors.
- Manual check steps written as concrete reproductions ("open /dashboard/lists, apply filter X, expect Y").

### Traceability rules
- Every acceptance criterion → at least one task → at least one verification.
- Commit messages reference the spec: `feat(expenses): add category filter [spec 001, REQ-2.1]`.
- Do not mark a spec complete while any `REQ` is unverified; list it as open instead.

---

## Coding conventions

**Angular**
- Standalone components only; no NgModules. Use `inject()`, not constructor injection.
- Signals first: `input()`, `output()`, `model()`, `computed()`, `linkedSignal()`. Do not use `@Input`/`@Output` decorators in new code.
- `computed()` must only read signals. Form values are not signals — use `toSignal(control.valueChanges, …)`.
- Never read a signal once into a plain field (`loading = store.isLoading()`) — keep the signal.
- Built-in control flow (`@if`, `@for` with `track`, `@switch`); no `*ngIf`/`*ngFor`.
- New components use `ChangeDetectionStrategy.OnPush` (the v22 default). Existing components are pinned to `Eager` by the migration; switch them to OnPush only when you touch them and verify the behaviour.
- No `any` in new code; no `@ts-expect-error` / `@ts-ignore` to silence real type mismatches. No index signatures (`[key: string]: any`) on components.
- Prefer `viewChild()` over global DOM IDs/`document` access; clean up third-party instances (e.g. Chart.js) with `DestroyRef`.

**State (NgRx Signals)**
- Feature stores compose features from `@shared/stores`.
- Every `rxMethod` inner observable **must** have `catchError` — an uncaught error permanently kills the method.
- Use `switchMap` for queries/loads, `exhaustMap` for submits, `concatMap` for ordered writes.
- Type `signalStoreFeature` inputs instead of `store: any`.

**Libraries & boundaries**
- Import shared code only through its alias (`@shared/auth`, `@shared/stores`, `@shared/ui-components`) — never deep paths like `shared/stores/src/lib/...` or `apps/<app>/src/...`.
- Libraries must not import from apps. App config reaches libraries through injection tokens (see `AUTH_CONFIG`).
- Anything used by more than one app belongs in `shared/`; app-specific code stays in the app.

**i18n, dates, HTTP**
- All user-visible text goes through ngx-translate keys; add keys to `public/i18n/fr.json`.
- Dates sent to the API as local `YYYY-MM-DD` — never `toISOString().split('T')[0]` (shifts the day in UTC+1/+2).
- URLs come from environment/config; no hard-coded `localhost`.

**Style:** Prettier (`.prettierrc`, single quotes), SCSS, Bootstrap utility classes before custom CSS.

## Known issues (do not "fix" silently — open a spec)
- `app-launcher` does not build: missing `@env/environments` alias, `provideAuthConfig`, `FORMLY_FORM_CONFIG`.
- `ui-components:build` target references a missing `ng-package.json`.
- `profile-section` index exports a non-existent file.
- Production `fileReplacements` in `expenses-management` point at non-existent launcher env files.
- No unit-test runner; existing specs import `@ionic/angular`, which is not a dependency.
