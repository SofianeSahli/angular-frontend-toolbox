# Coding conventions (detail)

Moved from `CLAUDE.md`. Read it before writing or reviewing code; the checklist in `CLAUDE.md` is the short version.

## Self-explanatory code

- Make the code explain itself: precise names for variables, functions, types and files; small functions that do one thing; named constants instead of magic values.
- Avoid comments. Do not write comments that restate what the code does, narrate steps, or reference specs and REQ IDs (traceability lives in specs and commit messages).
- If code seems to need a comment, rename or extract until it doesn't. The only exception is a short note on a *why* the code cannot express (a workaround for a tool bug, an external constraint), with a link when there is one.

## Angular

- Standalone components only; no NgModules. Use `inject()`, not constructor injection.
- Signals first: `input()`, `output()`, `model()`, `computed()`, `linkedSignal()`. Do not use `@Input`/`@Output` decorators in new code.
- `computed()` must only read signals. Form values are not signals — use `toSignal(control.valueChanges, …)`.
- Never read a signal once into a plain field (`loading = store.isLoading()`) — keep the signal.
- Built-in control flow (`@if`, `@for` with `track`, `@switch`); no `*ngIf`/`*ngFor`.
- Every component uses `ChangeDetectionStrategy.OnPush` (the v22 default; lint enforces it). Template-visible state that changes outside a template event, an input or a signal (HTTP callbacks, timers, `writeValue`, native listeners) must be a signal, or call `markForCheck()`. Form controls that display an `AbstractControl`'s state must redraw on its events.
- No `any` in new code; no `@ts-expect-error` / `@ts-ignore` to silence real type mismatches. No index signatures (`[key: string]: any`) on components.
- Prefer `viewChild()` over global DOM IDs/`document` access; clean up third-party instances with `DestroyRef`.

## State (NgRx Signals)

- Feature stores compose features from `@shared/stores`.
- Every `rxMethod` inner observable **must** have `catchError` — an uncaught error permanently kills the method.
- Use `switchMap` for queries/loads, `exhaustMap` for submits, `concatMap` for ordered writes.
- Type `signalStoreFeature` inputs instead of `store: any`.

## Libraries and boundaries

- Which library may import which is defined by tags and `depConstraints`: see [ARCHITECTURE.md](ARCHITECTURE.md) §2–3.
- Import shared code only through its `@shared/...` alias, and app libraries through their `@expenses/...` alias (one prefix per app), never through deep paths like `shared/stores/src/lib/...` or `apps/<app>/src/...`.
- Libraries never import from apps. App config reaches libraries through injection tokens and `provideX({...})` (see `provideUi` in `@shared/ui-tokens`).

## i18n, dates, HTTP

- All user-visible text goes through ngx-translate keys; add keys to `public/i18n/fr.json`.
- No ngx-translate in toolbox UI (`ui-*` libraries): pages pass translated text in, built-in strings come from `UI_TEXT`. Shared `feature` libraries (for example `identity/feature-auth`) may use ngx-translate and ship their own fr/en/ar files under their namespace, which the app merges.
- Dates sent to the API as local `YYYY-MM-DD` — never `toISOString().split('T')[0]` (shifts the day in UTC+1/+2).
- URLs come from environment/config; no hard-coded `localhost`.

## Style

Prettier (`.prettierrc`, single quotes), SCSS. Use Bootstrap grid and utility classes for layout; components read only `var(--ui-*)` tokens (Stylelint refuses raw colours, fonts and lengths; a raw length is allowed only in a component's own `--ui-<component>-*` tokens; `color-mix()` takes tokens only); logical properties only, so layouts mirror in RTL; breakpoints from `@use 'breakpoints' as bp;` only; `::ng-deep` only in the two forms ARCHITECTURE §5 allows; overrides go in the `app` cascade layer, never with `!important`. Never edit `*.generated.*` files: change `tokens.json` or `contract.json` and run `compile-tokens`. Money is integer millimes, formatted with `@shared/util-format`.
