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
8. **008 Dashboard, budget and recurring operations** ← done (in review): dashboard cards, monthly budget with copy, recurring rules, `ui-meter` and `ui-bar-list` (backend specs 006 recurring rules, 007, 008).
9. **009 Production readiness.**
10. **010 Capacitor.**
11. **011 Public launch.**

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

## Local dev / LAN

Serve the app to a phone on the home Wi-Fi at `http://<PC-LAN-IP>:4200`. **Development only, never for production** (no TLS, host-only cookies without `Secure`, an open dev server).

1. Command: `npm run serve:lan` (`nx serve expenses-management --configuration=lan`). It builds with `environment.lan.ts` (`apiBaseUrl` is the page's own origin plus `/api/v1`), listens on `0.0.0.0:4200` and proxies `/api` and `/sanctum` to `http://localhost:8001` (`apps/expenses-management/proxy.lan.json`, `changeOrigin: false` so Sanctum sees the real `Origin`). The browser sees one origin: no CORS, and the Sanctum cookies are host-only on the LAN IP. The API container stays bound to `127.0.0.1`.
2. Backend `.env`: `SANCTUM_STATEFUL_DOMAINS=localhost:4200,<LAN-IP>:4200` and `SESSION_SECURE_COOKIE=false`, then `php artisan config:clear` in the container.
3. Windows firewall: allow inbound TCP 4200 on the **Private** profile only, for example in an administrator PowerShell: `New-NetFirewallRule -DisplayName "Angular dev LAN" -Direction Inbound -Protocol TCP -LocalPort 4200 -Profile Private -Action Allow`. Remove it when done.
4. The dev server accepts requests by IP address without an `allowedHosts` entry; only a host name would need one.

## Windows

If every app test fails with "Vitest failed to find the runner", the environment variable `NX_WORKSPACE_ROOT_PATH` is set with a lowercase drive letter (`c:\...`, often by an editor's Nx integration). Unset it or set it to `C:\...` (angular/angular-cli#33559). The same error appears when the shell's current directory has a lowercase drive letter (some Git Bash sessions); run the app's tests from a shell opened in `C:\...` (for example PowerShell).
