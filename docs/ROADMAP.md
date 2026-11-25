# Toolbox roadmap and known issues

Moved from `CLAUDE.md`. Update this file when a spec starts or finishes.

## Toolbox roadmap

One spec each, approved before any code (ARCHITECTURE §8). From spec 005 on, every spec delivers **both** the shared toolbox part **and** the expenses app part that uses it. A spec is done only when a real screen of `expenses-management` works against the real backend (`personal-accountings-backend`, API at `environment.apiBaseUrl`).

1. **001 Foundations** ← done: Vitest, tags and `depConstraints`, CI, OnPush everywhere, lint at 0 errors, known build issues fixed, unused projects removed.
2. **002 Tokens and themes** ← done: `ui-tokens`, `theme-olivier`, theme compiler, cascade layers, Bootstrap trim, `util-format`, Stylelint and contrast checks; old apps and libraries deleted, new app shell.
3. **003 Atoms and catalog** ← done: the 16 Olivier atoms, `UI_TEXT`, component-token and `color-mix()` Stylelint rules, and `apps/ui-catalog`.
4. **004 Molecules, organisms and templates** ← done: 15 molecules, 8 organisms, 4 templates, CDK menu and dialog, breakpoints, catalog routes.
5. **005 Identity** ← done: HTTP layer + session + sign-in screens + the signed-in app shell.
6. **006 Households and books** ← done (in review): first-run choice, create household, create book, invitations, members, book switcher (backend specs 003–004).
7. **007 Categories and operations** ← done (in review): any-currency money, category tree and picker, quick add, operations list with filters, edit and delete (backend specs 005–006).
8. **008 Dashboard and budget:** month summary, plan vs actual (backend spec 007).

## Known issues (do not "fix" silently — open or update a spec)

Tooling
- Vitest is pinned to 4 because `@nx/vitest`'s generator rejects 5; revisit when the Nx/Analog peers allow it.
- Stylelint is pinned to 17: 18 needs Node ≥ 24.15.
- Every library with Vitest (`ui-tokens`, `ui-atoms`, `ui-molecules`, `ui-organisms`, `ui-templates`, `util-format`) sets `server: { watch: null }` in `vite.config.mts`: with the watcher on, Analog drops its compiled output mid-run and tests fail at random ("not in the TypeScript program"). `vitest --watch` does not re-run there. Clear `node_modules/.vite` if tests report the same message elsewhere.
- CDK menus and dialogs read the legacy `KeyboardEvent.keyCode`, which `@testing-library/user-event` leaves at 0 in jsdom. Tests of CDK keyboard handling dispatch keys with `fireEvent.keyDown(element, { key, keyCode })`; real browsers set `keyCode`.
- Inside a template, a reference on a native element that carries an attribute component (`<input uiInput #field>`) is the component, not the element: read it with `viewChild('field', { read: ElementRef })`, or read the value from the event.
- `nx run-many -t lint` has 0 errors but still reports warnings in `shared/stores` (`no-explicit-any`, `no-non-null-assertion`, `no-unused-vars`).
- Production `apiBaseUrl` is a placeholder (`https://api.example.invalid/api/v1`); replace it before the first deployment.
- `googleClientId` is empty in both environments, so the Google button is hidden (spec 005, REQ-6.1); set it when the OAuth client exists.
- The Arabic texts (app, identity, errors and households) are a draft marked `meta.reviewStatus` for a native reader (spec 005, REQ-10.4).

Code
- `withCrudOperations` has no `catchError`: one failed request ends the stream for good (documented by a test in `shared/stores`). Fix before a screen uses it.

## Windows

If every app test fails with "Vitest failed to find the runner", the environment variable `NX_WORKSPACE_ROOT_PATH` is set with a lowercase drive letter (`c:\...`, often by an editor's Nx integration). Unset it or set it to `C:\...` (angular/angular-cli#33559). The same error appears when the shell's current directory has a lowercase drive letter (some Git Bash sessions); run the app's tests from a shell opened in `C:\...` (for example PowerShell).
