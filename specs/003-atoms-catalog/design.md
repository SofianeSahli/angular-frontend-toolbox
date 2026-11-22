# <NNN> — <Feature name>: Design

> Status: Draft | Approved (<date>)
> Requirements: [requirements.md](./requirements.md)

## Overview
Short description of the approach.

## Placement
| Piece | Location | Reason |
|---|---|---|
| … | `apps/…` / `shared/…` | … |

## Reuse
Existing `@shared/*` pieces reused: …
New shared pieces (justify each): …

## Models & API
```ts
// request / response / entity types
```
| Method | Endpoint | Request | Response | Errors |
|---|---|---|---|---|

## State (store)
- State shape:
- Methods (operator used: switchMap / exhaustMap / concatMap):
- Error handling (where `catchError` lives, what the user sees):

## Components
| Component | Inputs | Outputs | Notes |
|---|---|---|---|

## Routing
…

## i18n keys
- `labels.…`

## Requirement coverage
| REQ | Covered by |
|---|---|
| REQ-1.1 | … |

## Risks / alternatives considered
…
