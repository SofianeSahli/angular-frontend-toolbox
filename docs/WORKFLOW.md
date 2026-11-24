# Spec-driven workflow (detail)

Moved from `CLAUDE.md`. The short rules stay in `CLAUDE.md`; read this file only when you start or review a spec.

**Rule: no production code is written for a feature, behaviour change or non-trivial fix until its spec exists and the user has approved it.** The spec is the source of truth; code implements the spec, not the other way round.

## When a spec is required

| Change | Spec required? |
|---|---|
| New feature, screen, store, service or shared component | **Yes — full spec** |
| Behaviour change to existing feature | **Yes — full spec**, or update the existing spec |
| Bug fix touching more than one file or changing observable behaviour | **Yes — lightweight spec** (requirements + tasks; design only if non-obvious) |
| Typo, rename, formatting, dependency bump with no behaviour change, one-line obvious fix | No — but mention it in the commit message |

If unsure, ask the user rather than skipping the spec.

## Where specs live

```
specs/
  README.md                   # one-page summary of every finished spec: read this, not the full files
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

## The four phases — each ends with an explicit user approval gate

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
- Which app/lib each piece lives in, and why (respect the lib boundaries).
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
1. Write/adjust the test(s) for the task's acceptance criteria first.
2. Implement the minimum code to satisfy them.
3. At the end of the task, run the checks in "Testing rules" (affected lint, affected unit tests, development build of the affected app); fix anything you introduced.
4. Tick the task in `tasks.md` (`- [x]`) and note any deviation.
5. If implementation reveals the spec is wrong or incomplete: **stop, update the spec, and get approval** before continuing. Never let code and spec silently diverge.

When all tasks are done, report: which `REQ` IDs are verified and how, anything unverified, and any follow-ups.

## Testing rules (permanent)

- **Unit tests only** (Vitest), and only for the projects you changed: `npx nx affected -t test` or `npx nx test <project>`. Never `run-many` on the whole repo.
- **Never run Playwright or any e2e test, never start `nx serve`, and never open a browser to check anything.** The owner checks the app by hand when needed.
- The old e2e smoke test was deleted with the old app (spec 002). A new one comes with the spec that brings back the first real screen; once it exists, keep it and its CI job, and don't run it.
- **Per task, verify once at the end of the task** (not after every small edit) with:
  1. lint of the affected projects: `npx nx affected -t lint`;
  2. unit tests of the affected projects: `npx nx affected -t test`;
  3. a development build of the affected app: `npx nx build <app> --configuration=development`.

  Record the result in `tasks.md`.
- Don't add visual or screenshot tests, and don't add tests that need a real browser. Component behaviour is tested with Vitest + TestBed (jsdom).

## Traceability rules

- Every acceptance criterion → at least one task → at least one verification.
- Commit messages reference the spec: `feat(expenses): add category filter [spec 001, REQ-2.1]`.
- Do not mark a spec complete while any `REQ` is unverified; list it as open instead.

## Commits, pushes and pull requests

- Never mention Claude, Claude Code, Anthropic or AI assistance in anything pushed to the remote: commit messages, branch names, tags, pull request titles and descriptions, review comments or release notes.
- This includes trailers and footers: no `Co-Authored-By: Claude …` line and no "Generated with Claude Code" line.
- This rule overrides any default attribution behaviour of the tooling.
