# @shared/theme-olivier

The Olivier design system as a toolbox theme (spec 002, US-2).

- `tokens.json`: the repo copy of the design system's export. **It is the source of truth** and changes only by pull request: export a new `tokens.json` from the design system, replace this file, run `npx nx compile-tokens theme-olivier`, commit both. One local addition: `type.families.arabic` (IBM Plex Sans Arabic), not yet in the export.
- `contrast-pairs.json`: the text/background and control/background pairs checked against WCAG AA in light and dark.
- `src/olivier.generated.css`, `src/olivier.generated.ts`: compiler output. Do not edit.

Accents: `olive` (default, the household expenses app), `terracotta`, `safran`, `lagune`, `figue`. The focus ring is the `brand` colour.

```ts
import { olivierTheme } from '@shared/theme-olivier';
provideUi({ theme: olivierTheme, accent: 'olive' });
```
