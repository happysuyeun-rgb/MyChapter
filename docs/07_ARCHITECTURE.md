# 07. Architecture

**Status:** Current architecture + v2 direction  
**Updated:** 2026-09-28

## Client

Current stack:

- React 19
- TypeScript
- Vite
- React Router
- Zustand
- Tailwind CSS
- Capacitor Android
- dnd-kit
- lottie-react

## Backend

- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Edge Functions
- RLS
- Firebase push via Edge Function integration
- Gemini-based text generation through shared Edge Function helper

## High-level runtime

```text
React App
├─ Auth / local app state
├─ Project & Record UI
├─ Book workflow
└─ Paywall/Billing
      │
      ▼
Supabase
├─ Auth
├─ Postgres
├─ Storage
└─ Edge Functions
   ├─ AI question
   ├─ freewriting hint
   ├─ chapter generation
   ├─ chapter regeneration
   ├─ PDF generation
   ├─ subscription verification
   ├─ reminder
   └─ account deletion
```

## Domain boundaries

### Project domain

Owns:

- book identity
- type
- readiness policy
- workflow state

### Record domain

Owns:

- original user record
- mode
- photo
- emotion tags
- AI question context
- draft

### Analysis domain

v2 addition.

Owns structured AI metadata derived from records.

### Chapter domain

Owns:

- chapter structure
- title
- AI draft
- user-edited content
- ordering
- record relationships

### Publication domain

Owns:

- immutable publication snapshot
- version
- PDF/EPUB paths
- status/error
- published metadata

### Billing domain

Owns:

- Free/Pro entitlement
- store verification
- feature gating

## Client state policy

Use Zustand for transient/current UX state.

Persistent domain truth belongs in Supabase.

### Active project

Current implementation persists the entire project object.

Target:

- persist `activeProjectId`
- fetch/validate actual Project from database
- reset when user changes/signs out
- never trust stale project object from another account/session

## Edge Function rule

Client must not be the only enforcement point for paid or protected operations.

Server-side functions must re-check:

- authenticated user
- resource ownership
- subscription entitlement
- operation prerequisites

## Storage

Current:

- record photos
- published PDFs

Required cleanup:

- deleting a record should remove orphaned photo objects
- deleting an account should remove record photos **and published PDFs**
- publication versioning should use unique paths rather than overwriting one `project_id.pdf`

Suggested publication path:

```text
published-pdfs/{user_id}/{project_id}/v{version}.pdf
```

## Security

RLS must remain enabled on user-owned tables.

v2 policies should validate resource ownership through project relationships, not rely solely on a redundant client-supplied `user_id`.

Example principle:

```text
record.project_id
→ project.user_id
→ auth.uid()
```

## Deployment rule

Vercel deployment validates frontend build only.

Supabase Edge Function source changes committed to GitHub are **not automatically deployed to Supabase**. Edge Functions must be deployed explicitly after DB v2/policy reconciliation.
