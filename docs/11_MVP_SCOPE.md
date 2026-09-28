# 11. MVP Scope

**Status:** MVP boundary  
**Updated:** 2026-09-28

## MVP goal

A user can:

> create one Book → continuously record → unlock book-making → create/edit manuscript → choose cover → publish a real PDF → revisit it.

If that loop works reliably, MVP succeeds.

## P0 — must work

### Account

- auth
- onboarding
- account deletion

### Book

- create Book
- select type
- Library
- active Book

### Recording

- AI question
- free writing
- photo record
- drafts
- edit/delete record
- original preservation

### Readiness

- one consistent readiness source
- Home/Workspace/Record Complete use same model
- direct-route protection

### Book making

- semantic chapter generation
- chapter edit/reorder
- manuscript review
- cover selection
- final review

### Publication

- Free first publication
- PDF generation
- publication persistence
- publication failure/retry
- published-book viewer/download
- publication history

### Monetization

- Free first Book can finish
- second Book / republish triggers Pro
- server-side entitlement validation

### Data/Security

- DB v2 migration
- RLS review
- storage cleanup on delete
- account deletion removes private files

## P1 — after P0

- richer PAGE character
- record-level AI analysis UX
- better publication preview
- AI usage screen
- polished publication history
- project settings/type change UI
- more visual/motion polish
- improved reminders

## P2 / later

- AI custom cover
- EPUB
- external bookstores
- POD/print
- community/social
- multilingual
- advanced voice/audio
- marketplace features

## Explicit non-goals for MVP

Do not delay MVP for:

- bookstore distribution automation
- print fulfillment
- social feed
- public profile ecosystem
- complex collaboration
- advanced desktop publishing controls
