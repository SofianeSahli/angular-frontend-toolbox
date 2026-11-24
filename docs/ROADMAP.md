# Toolbox roadmap and known issues

Moved from `CLAUDE.md`. Update this file when a spec starts or finishes.

## Toolbox roadmap

One spec each, approved before any code (ARCHITECTURE §8):

1. **001 Foundations** ← done: Vitest, tags and `depConstraints`, CI, OnPush everywhere, lint at 0 errors, known build issues fixed, unused projects removed.
2. **002 Tokens and themes** ← done: `ui-tokens`, `theme-olivier`, theme compiler, cascade layers, Bootstrap trim, `util-format`, Stylelint and contrast checks; old apps and libraries deleted, new app shell.
3. **003 Atoms and catalog** ← **in review**: the 16 Olivier atoms, `UI_TEXT`, component-token and `color-mix()` Stylelint rules, and `apps/ui-catalog`.
4. **004 Molecules, organisms and templates** ← **next**: CDK overlays and app shell.
5. **005 Shared logic:** `http/*` and `identity/*`; auth pages rebuilt on the auth layout (Sanctum cookie strategy).

## Known issues (do not "fix" silently — open or update a spec)

Tooling
- Vitest is pinned to 4 because `@nx/vitest`'s generator rejects 5; revisit when the Nx/Analog peers allow it.
- Stylelint is pinned to 17: 18 needs Node ≥ 24.15.
- `shared/ui/tokens`, `shared/ui/atoms` and `shared/util/format` set `server: { watch: null }` in `vite.config.mts`: with the watcher on, Analog drops its compiled output mid-run and tests fail at random ("not in the TypeScript program"). `vitest --watch` does not re-run there. Clear `node_modules/.vite` if tests report the same message elsewhere.
- `nx run-many -t lint` has 0 errors but still reports warnings in `shared/stores` (`no-explicit-any`, `no-non-null-assertion`, `no-unused-vars`).
- Production `apiBaseUrl` is a placeholder (`https://api.example.invalid/api/v1`); replace it before the first deployment.

Code
- `withCrudOperations` has no `catchError`: one failed request ends the stream for good (documented by a test in `shared/stores`). Fix before a screen uses it.

## Windows

If every app test fails with "Vitest failed to find the runner", the environment variable `NX_WORKSPACE_ROOT_PATH` is set with a lowercase drive letter (`c:\...`, often by an editor's Nx integration). Unset it or set it to `C:\...` (angular/angular-cli#33559). The same error appears when the shell's current directory has a lowercase drive letter (some Git Bash sessions); run the app's tests from a shell opened in `C:\...` (for example PowerShell).
