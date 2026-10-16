# 13. Development Specification

**Document Version:** 2.0  
**Status:** CURRENT / IMPLEMENTATION BASELINE  
**Updated:** 2026-10-16  
**Scope:** MY CHAPTER current MVP implementation and launch-completion target

This document defines how the current MY CHAPTER product is implemented and how the remaining MVP gaps must be closed.

This document does not redefine product policy. When a conflict exists, use the following precedence:

1. 02_PRODUCT_DECISIONS.md
2. 01_PRODUCT_SPEC.md
3. 05_SCREEN_SPEC.md
4. 06_FREE_PRO_POLICY.md
5. this document

Detailed API payload contracts and the final data dictionary will be separated into 14_API_SPEC.md and 15_DATA_DICTIONARY.md. Until those documents are created, current source code and applied Supabase schema are the implementation evidence.

---

## 1. Product implementation definition

MY CHAPTER is a recording-to-publishing product.

Core domain flow:

    Book(Project)
    → Records
    → Record Analysis
    → Story Readiness
    → Semantic Chapters
    → Manuscript Review
    → Cover
    → Final Review
    → Versioned Publication

User-facing rule:

- Project is always presented as one Book.
- Records remain the original source material.
- AI creates derived structure/content and must not silently overwrite original Records.
- Manuscript is a workflow over Chapter content, not a duplicated manuscript-body table.
- Publication is an immutable versioned snapshot.
- Free users must be able to complete and publish one real Book.

---

## 2. Current implementation status

As of 2026-10-16:

| Area | Status |
|---|---|
| Product policy | Confirmed |
| Screen/UX specification | v1.1 final baseline |
| Frontend main flow | Implemented |
| Supabase DB v2 | Applied |
| Record Analysis | Implemented, production E2E pending |
| Semantic Chapter | Implemented, production E2E pending |
| Publication v2 | Implemented, production E2E pending |
| Screen Guard broad onboarding protection | Implemented |
| Library/Workspace publication source | publications-aligned |
| Workflow milestone persistence | Not implemented |
| Published Home | Not implemented |
| Google/Kakao production OAuth | Not fully verified |
| Full real-user E2E | Pending |
| Legacy DB cleanup | Deferred until E2E passes |

Current Supabase project status verified on 2026-10-16:

- ACTIVE_HEALTHY
- PostgreSQL 17
- migrations through security_performance_hardening applied
- v2 Edge Functions active
- current test data set is empty
- latest security advisor check had no security warnings

---

## 3. Technology stack

### 3.1 Frontend

| Layer | Technology |
|---|---|
| UI runtime | React 19 |
| Language | TypeScript 5.8 |
| Build | Vite 6 |
| Router | React Router 7 |
| Client state | Zustand 5 |
| Styling | Tailwind CSS 3 |
| Drag/reorder | dnd-kit |
| Motion asset support | lottie-react |
| Backend client | @supabase/supabase-js |
| Native wrapper | Capacitor 7 |
| Android | @capacitor/android |

Primary scripts:

    npm run dev
    npm run build
    npm run preview
    npm run cap:sync
    npm run cap:android
    npm run cap:run:android

Build acceptance:

- TypeScript project build must pass.
- Vite production build must pass.
- Vercel success alone does not prove Supabase Edge Function deployment or production E2E.

### 3.2 Backend

Backend responsibilities are implemented with Supabase:

- Auth
- PostgreSQL
- Storage
- Row Level Security
- Edge Functions

External/native integrations include:

- Firebase / FCM for push
- Google Play Billing verification
- Capacitor native bridge/deep links

AI generation is executed through server-side Edge Functions. Provider/model configuration is an implementation detail and is not a client contract.

---

## 4. Repository architecture

Current implementation structure:

    src/
      components/
        common/
        features/
        layout/
      pages/
        auth/
        onboarding/
        home/
        project/
        record/
        book/
        mypage/
        notifications/
      router/
      stores/
      hooks/
      lib/
        api/
      utils/
      constants/
      types/
      mocks/

    supabase/
      migrations/
      functions/

    public/
      legal/

### Layer rules

Pages:
- compose user flows and screen state
- do not own persistent domain truth

lib/api:
- wraps Supabase tables, Storage, and Edge Function calls
- converts backend errors into app-facing errors where needed

stores:
- hold transient/current UX state
- must not become the authoritative copy of persistent domain objects

utils:
- deterministic business calculations such as Story Readiness and streaks

Supabase:
- persistent domain truth
- authorization
- protected/paid-operation enforcement
- derived AI artifacts

---

## 5. Routing and access control

Current top-level routing:

### Public

- /
- /splash
- /login
- /login/email
- /mypage/privacy-policy
- /mypage/terms-of-service

### Authenticated onboarding

- /onboarding/nickname
- /onboarding/notification

### Authenticated + onboarding-completed product routes

Project:
- /project/new
- /project/new/setup
- /project/new/complete
- /project/workspace
- /project/settings

Record:
- /record/mode
- /record/write/question
- /record/write/photo
- /record/write/free
- /record/complete
- /records
- /records/:id
- /records/:id/edit

Book:
- /book
- /book/chapter/:id
- /book/chapter/:id/edit
- /book/manuscript
- /book/cover
- /book/review
- /book/publish/complete

Publication:
- /publication/:id

My:
- /mypage
- /mypage/settings
- /mypage/subscription
- /mypage/completed-books
- /mypage/delete-account

Other:
- /notifications
- /library

### Guard responsibilities

AuthGuard:
- waits for auth initialization
- rejects unauthenticated users
- redirects to /login

GuestGuard:
- prevents authenticated users from remaining on login screens
- redirects authenticated users to /splash

OnboardingGuard:
- requires completed profile onboarding
- nickname missing → /onboarding/nickname
- nickname exists but onboarding incomplete → /onboarding/notification

### Required route-specific protection

Broad onboarding protection is implemented, but route-specific guards still require completion/regression coverage.

Target rules:

- Record routes require an active Book.
- Record detail/edit requires Record ownership.
- /book requires Story Readiness.
- Chapter detail/edit requires Chapter ownership.
- Manuscript requires at least one Chapter.
- Cover requires Ready + Chapter.
- Final Review requires Ready + Chapter + persisted Cover.
- Publish Complete requires valid current publishResult.
- Publication viewer requires publication ownership.

These remaining checks are tracked under SCREEN_IMPLEMENTATION_GAP GAP-012.

---

## 6. Authentication and onboarding

### Auth initialization

authStore is the single client auth store.

It owns:

- session
- user
- profile
- initialized state

RootLayout performs auth initialization.

Post-auth web routing goes through /splash.

Target routing:

    no session
    → /login

    session + no nickname
    → /onboarding/nickname

    session + nickname + onboarding incomplete
    → /onboarding/notification

    session + onboarding complete
    → /home

### Email login

Email uses Supabase OTP / magic link.

Web redirect target:

    {origin}/splash

### OAuth

Web OAuth callback must use the same splash checkpoint semantics.

Current native callback remains:

    com.mychapter.app://home

Native callback equivalence must be verified before launch. This is GAP-007.

### Onboarding persistence

Nickname:
- 2–10 characters
- Korean / English / numbers
- persisted to public.users.nickname

Notification onboarding:
- persists notification_enabled
- persists onboarding_completed = true
- must not navigate on failed persistence

---

## 7. Client state management

### authStore

Persistent truth source:
- Supabase Auth + public.users

Client state:
- session
- user
- profile
- initialized

Sign-out must:
- clear auth state
- reset subscription state
- clear active Project state

### projectStore

State:
- projects
- activeProject
- activeProjectId
- createdProject
- firstQuestion
- New Book draft

Persistence:
- only activeProjectId is persisted locally

Rule:
- activeProject object itself is not authoritative
- activeProjectId must be resolved/validated against the authenticated user's Supabase Projects

### recordStore

Transient workflow state:
- lastSave
- lastProject
- editingRecord

Used for:
- Record Complete
- Record edit handoff

### bookStore

Transient workflow state:
- selectedCoverId
- publishResult
- publishStage
- publishError

PublishComplete is intentionally protected by publishResult; direct route entry without it returns to the Book flow.

### subscriptionStore

State:
- free / pro
- loading

Persistent truth:
- public.subscriptions

### paywallStore

Global entitlement UI state:
- isOpen
- pendingAction

Purchase completion can resume an action through pendingAction.

---

## 8. Book / Project domain

Project is the persistent Book root.

Current important fields include:

- id
- user_id
- type
- title
- subtitle
- author_name
- started_at
- ready_at
- archived_at
- readiness_min_days
- readiness_min_records
- readiness_target_days
- readiness_target_records
- readiness_policy_version
- selected_cover_id
- created_at
- updated_at

Legacy transitional fields still exist:

- target_count
- frequency
- notification_time
- record_mode
- cover_template_id
- is_completed
- target_date

### Current creation caveat

createProject still populates several legacy routine fields through calculateRoutine for compatibility.

User-facing completion logic must not use those fields as a competing progress model.

The final user-facing source is Story Readiness.

### Project type change

Changing Book type:

- preserves original Records
- preserves Chapters/manuscript
- changes future AI direction
- updates readiness snapshot values
- must not re-lock a Book that already reached Ready

ready_at is sticky once achieved.

---

## 9. Story Readiness

Story Readiness is the single Book-making gate.

Current scoring:

- elapsed time: 35%
- Record volume: 65%

Unlock is not score >= 100.

Unlock requires both:
- minimum elapsed days reached
- minimum Record count reached

Or:
- ready_at is already persisted

### Rules

| Project Type | Min Days | Min Records | Target Days | Target Records |
|---|---:|---:|---:|---:|
| growth | 60 | 30 | 90 | 40 |
| life_story | 90 | 40 | 180 | 60 |
| career | 60 | 30 | 90 | 40 |
| parenting | 30 | 30 | 90 | 45 |
| relationships | 30 | 25 | 90 | 40 |
| travel | 7 | 10 | 15 | 15 |
| hobby | 30 | 20 | 60 | 30 |
| learning | 30 | 20 | 90 | 35 |
| custom | 30 | 20 | 60 | 30 |
| legacy emotion | 30 | 20 | 60 | 30 |
| legacy yearly | 60 | 30 | 100 | 40 |

### Required follow-up

There is a known edge case:

- time threshold may pass without any Project mutation
- frontend can calculate Ready
- ready_at may remain null

Before legacy cleanup, Ready persistence must be made durable so future type changes cannot accidentally re-lock a Book.

---

## 10. Record domain

Record modes:

- question
- free
- photo

The mode is selected per Record.

### Validation

AI Question Record:
- content 10–2000 chars

Free Record:
- content 10–5000 chars
- title optional
- blank title uses date-based fallback

Photo Record:
- photo required
- caption 1–100 chars
- photo size/resolution launch policy still open

### Drafts

record_drafts is one draft per:

    user + project + mode

Exit flow supports:

- continue writing
- save draft and leave
- discard

### Record numbering

Current client API calculates:

    max(record_number) + 1

Known risk:
- concurrent writes can race

This is technical debt and should eventually move to an atomic server-side mechanism.

### Derived analysis

After successful Record create/update:

- analyze-record is invoked asynchronously
- Record save is considered successful even if analysis fails
- analysis failure must not roll back user content

record_analysis stores structured derived metadata.

Required follow-up:
- analysis status/retry/reprocessing strategy is still missing

---

## 11. Record Analysis domain

record_analysis is derived data associated 1:1 with a Record.

Current fields include:

- record_id
- project_id
- user_id
- summary
- themes
- people
- places
- emotions
- events
- conflict
- change
- insight
- goals
- model
- schema_version
- analyzed_at
- updated_at

Purpose:

- future personalized questions
- semantic Chapter selection
- Story Graph / long-term personalization
- future quality signal

Readiness v1 does not depend on Record Analysis.

---

## 12. Chapter domain

Final Chapter design is semantic, not fixed batching.

Flow:

    Ready Book
    → user opens Chapter Desk
    → unassigned Records inspected
    → AI selects related source Records
    → Chapter created
    → user reviews/edits/reorders

### Source of truth

chapter_records is the primary Chapter↔Record relation.

Current transitional redundancy remains:

- records.chapter_id
- chapters.record_ids

Do not build new logic that treats those legacy fields as the authoritative relationship.

### Generation

generate-chapter:
- starts only from Book-making workflow
- does not run automatically after every N Records
- current client permits generation when at least 3 unassigned Records are available
- Edge Function selects source Records semantically

### Regeneration

regenerate-chapter:
- reads source Records from normalized Chapter relationships
- regenerates derived Chapter content
- must never mutate original Records

### Content precedence

Chapter display content:

    user_content
    fallback to ai_content

### Reordering

Current reorder implementation performs multiple updates in sequence.

Known risk:
- not atomic
- partial failure may create temporary ordering inconsistency

Current client attempts reload/recovery after failure.

Future hardening:
- server-side transaction/RPC or equivalent atomic reorder

---

## 13. Manuscript workflow

Manuscript is not a separate content table.

It is a review workflow across ordered Chapter content.

Current state:
- /book/manuscript exists
- Chapter content is shown as the manuscript
- editing returns to Chapter edit
- Workspace currently infers manuscript completion from Chapter content existence

Target:
- explicit user review milestone

Minimum new persistent field:

    projects.manuscript_reviewed_at timestamptz nullable

Required behavior:

- user explicitly completes manuscript review
- timestamp persists
- refresh preserves completed state
- Workspace reads the milestone rather than inferring from content

This is GAP-005 and is the next implementation task.

---

## 14. Cover domain

Current cover flow:

- default/free templates
- Pro templates
- persisted selected_cover_id
- BookCover initializes from persisted Project selection
- Final Review requires persisted Cover

Free user:
- can use default/free Cover for first Book

Pro:
- can access Pro template Covers

Post-MVP:
- AI-generated custom Cover

Do not implement AI Cover before P0/P1 launch gaps are complete.

---

## 15. Final Review workflow

Final Review currently verifies:

- Cover
- TOC
- Manuscript

Current checkboxes are local UI state and reset on refresh.

Target persistent milestone:

    projects.final_review_completed_at timestamptz nullable

Implementation target for GAP-005:

1. user confirms required review items
2. milestone is persisted
3. refresh restores completion state
4. Workspace uses persisted state
5. publication remains a separate event; review completion is not inferred from publication existence

Publishing progress remains embedded in Final Review:

- cover
- TOC
- body
- PDF

Do not create a standalone Publishing route.

---

## 16. Publication v2

publications is the publication source of truth.

Legacy published_books remains transitional only.

### Model

Every publication is an immutable snapshot.

Important fields:

- id
- project_id
- user_id
- version
- status
- title_snapshot
- subtitle_snapshot
- author_snapshot
- cover_snapshot
- toc_snapshot
- pdf_path
- epub_path
- page_count
- error_code
- error_message
- created_at
- published_at

Status:

- processing
- published
- failed

### Versioning

Expected behavior:

    first publish → v1
    republish → v2
    next republish → v3

A republish does not overwrite an older Publication.

### Retry

A failed Publication retry should preserve the intended version rather than creating accidental version gaps.

### Storage path

Current versioned PDF path:

    published-pdfs/{user_id}/{project_id}/v{version}.pdf

### Viewer

/publication/:id:
- loads one specific publication
- verifies user ownership
- creates a signed URL for the PDF
- renders snapshot metadata, not mutable Project metadata

### Publication status in app

Library and Workspace have been moved toward publications-derived status.

Home still needs H-04 Published Home implementation.

Do not introduce new dependency on projects.is_completed.

---

## 17. Free / Pro entitlement

Product rule:

Free users can complete one real Book, including one PDF publication.

### Free includes

- one Book
- recording
- AI question with fallback
- free writing
- photo recording
- Story Readiness
- semantic Chapters for first Book
- manuscript workflow
- default Cover
- Final Review
- first PDF Publication
- Library
- published Book access

### Pro includes

- multiple Books
- republishing / additional Publication versions
- expanded AI
- Pro Covers
- future AI Cover

### Enforcement

Client-only gating is insufficient.

Protected actions must be re-checked server-side, especially:

- publication entitlement
- subscription-sensitive generation
- resource ownership

Current displayed monthly Pro label:

    월 5,900원

This is an implementation constant and must remain synchronized with store configuration before release.

---

## 18. Supabase data model

Current important public tables:

- users
- projects
- records
- record_drafts
- record_analysis
- chapters
- chapter_records
- publications
- subscriptions
- notifications
- ai_usage
- device_tokens

Legacy transitional tables still present:

- daily_questions
- published_books

### Ownership model

Primary rule:
- resources belong to the authenticated user
- Project relationship should be used to validate nested resources where appropriate

Preferred authorization chain:

    nested resource
    → project_id
    → projects.user_id
    → auth.uid()

RLS remains mandatory on user-owned tables.

### Migrations

Current applied migration history includes:

- 001 initial_schema
- 002 rls_policies
- 003 triggers
- 004 notifications_insert
- 005 cron_daily_reminder
- 006 published_pdfs_storage
- expand_project_types
- publication_entitlement
- db_v2_foundation
- record_analysis
- chapter_records
- publication_versions
- rls_v2
- security_performance_hardening

DB v2 is applied.

Legacy removal is forbidden until real production E2E passes.

---

## 19. Storage

Current buckets/use cases:

### record photos

Purpose:
- original photo attached to Photo Record

Requirements:
- owner-only access
- signed read where private
- Record delete removes object
- Account delete removes all owned objects

### published-pdfs

Purpose:
- immutable versioned Publication output

Path rule:

    {user_id}/{project_id}/v{version}.pdf

Requirements:
- no overwrite across versions
- owner-only access
- signed viewer URL
- Account delete removes all versions

Storage deletion behavior requires production E2E verification.

---

## 20. Edge Functions

Currently deployed/active:

- generate-question
- generate-freewriting-hint
- analyze-record
- generate-chapter
- regenerate-chapter
- generate-pdf
- verify-subscription
- send-daily-reminder
- delete-account

### Server responsibilities

Every protected function must independently validate as relevant:

- JWT/authenticated user
- resource ownership
- operation prerequisites
- subscription entitlement
- input validity

### generate-question

Purpose:
- produce a fresh contextual prompt for a new Record

Current product rule:
- no daily-question cache requirement for normal new Record flow
- generation failure should fall back to a local/type-based question
- writing remains available

### generate-freewriting-hint

Purpose:
- optional writing assistance

Failure:
- must not block Free Record writing

### analyze-record

Purpose:
- persist structured derived metadata

Failure:
- must not fail the user's Record save

### generate-chapter

Purpose:
- semantic source selection + Chapter generation

Rules:
- only Book-making flow
- normalized chapter_records relation
- original Record preservation

### regenerate-chapter

Purpose:
- regenerate derived Chapter from its source Records

### generate-pdf

Purpose:
- enforce Publication entitlement
- create versioned Publication state
- generate/upload PDF
- persist immutable snapshot
- mark success/failure

### verify-subscription

Purpose:
- validate store purchase and persist entitlement

### delete-account

Purpose:
- remove Storage artifacts and authenticated account data safely

### send-daily-reminder

Purpose:
- scheduled notification flow

---

## 21. Error handling standard

Every API-backed screen must implement the relevant states:

- Loading
- Empty
- Error
- Retry
- Permission/ownership failure
- Paywall
- Success

### Non-blocking derived-data failures

These must not invalidate primary user content:

- Record analysis failure
- AI question generation failure when fallback exists
- freewriting hint failure

### Blocking failures

These must block navigation to false-success states:

- Record database save failure
- Project creation failure
- onboarding persistence failure
- Cover persistence failure before Final Review
- Publication failure before Publish Complete

### Current gaps

- Notifications explicit error/retry
- Home/Library and other API loads have uneven error handling
- Legal iframe loading/error fallback missing

Tracked as GAP-008, GAP-009, GAP-010.

---

## 22. Security

### Required

- RLS enabled on user-owned tables
- no service role key in client
- Edge Functions verify authenticated ownership
- paid operations are server-enforced
- signed URLs for private published PDFs
- production DEV bypass impossible

### Development bypass

DEV bypass exists for local/mock UX work.

Production rule:
- if Vite PROD is true, bypass must return false
- production must never expose mock Book/user state

### Current security state

Latest verified Supabase security advisor result:
- 0 security warnings

Performance advisor warnings are optimization work, not current security blockers.

---

## 23. Development vs production testing

### Mock/dev testing

Use only for:
- UI iteration
- navigation checks
- visual states
- component development

Mock mode cannot prove:

- RLS
- Auth triggers
- real Storage
- Edge Functions
- Publication versioning
- account deletion
- multi-user isolation

### Real-data E2E

Production-like E2E is required before release.

Required baseline:

    new user
    → login
    → nickname
    → notification onboarding
    → first Book
    → first Record
    → Record Analysis
    → Story Readiness
    → semantic Chapter
    → manuscript review
    → Cover
    → Final Review
    → PDF v1
    → Publication Viewer

Then verify:
- Free second Book blocked
- Free republish blocked
- Pro v2 allowed
- failed publication retry
- logout/login
- second user isolation
- Record/photo deletion
- account deletion
- direct URL guards

---

## 24. Deployment model

### Web

Source:
- GitHub main

Build:
- npm run build

Deployment:
- Vercel

Vercel success confirms:
- frontend build/deploy success

It does not confirm:
- DB migration
- Edge Function deployment
- secrets
- Auth provider setup
- RLS E2E

### Supabase

DB changes:
- migration files
- apply through migration workflow
- DDL changes must not be performed as undocumented ad-hoc production changes

Edge Functions:
- deployed explicitly
- source commit alone does not deploy Function runtime

After DB/Function changes:
- re-run Security Advisor
- perform focused E2E

### Android

Capacitor remains the native packaging layer.

Before store release verify:
- OAuth/deep links
- push permission/FCM
- Play Billing
- app links
- account deletion flow
- production API configuration

---

## 25. Environment configuration

Client-visible environment configuration may include:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_PRIVACY_POLICY_URL
- VITE_TERMS_URL

Development-only configuration may include DEV bypass controls.

Server secrets belong only in secure platform configuration.

Never commit or document secret values such as:
- service role keys
- OAuth client secrets
- API keys
- service-account JSON
- purchase tokens

---

## 26. Current implementation gaps

Authoritative checklist:
- SCREEN_IMPLEMENTATION_GAP.md

Current order:

### P0

GAP-005:
- persist manuscript_reviewed_at
- persist final_review_completed_at
- use milestones in Workspace

GAP-004 remainder:
- Home H-04 still needs publications alignment

### P1

GAP-006:
- implement Published Home

GAP-007:
- native OAuth callback equivalence

GAP-008:
- Notifications error/retry

GAP-009:
- normalize API error states

GAP-010:
- Legal loading/error fallback

GAP-011:
- close remaining input policies

GAP-012:
- route ownership/stage guard regression

### P2

GAP-013:
- accessibility verification

### Explicitly out of current MVP completion

- M-03 AI Usage screen
- R-06 AI Record Edit Result
- R-10 exact AI Edit quota policy
- AI-generated Cover
- EPUB milestone

Do not expand scope into these before P0/P1 and production E2E are complete.

---

## 27. Next migration target

The next planned additive migration is for workflow milestones.

Target columns:

    projects.manuscript_reviewed_at timestamptz null
    projects.final_review_completed_at timestamptz null

Migration requirements:

- additive only
- no destructive legacy cleanup
- update TypeScript database type
- update Project API helpers
- update ManuscriptPage
- update FinalReviewPage
- update ProjectWorkspacePage
- build
- run Supabase Security Advisor
- verify persistence with real user E2E

Do not mark GAP-005 resolved until refresh persistence is actually verified.

---

## 28. Technical debt register

### High priority

1. Workflow milestones are inferred, not persisted.
2. Published Home is missing.
3. Ready timestamp persistence can lag when only elapsed time changes.
4. Direct nested-route guard behavior needs full regression.
5. Record number max+1 is race-prone.
6. Chapter reorder is not atomic.
7. Record Analysis has no explicit retry/status model.
8. Production OAuth E2E is incomplete.

### Medium priority

1. API error UX is uneven.
2. Photo upload size/resolution policy is open.
3. Free Record title max length is open.
4. Chapter title/body max policy is open.
5. remaining legacy RLS performance warnings should be optimized.

### Deferred

1. Legacy field/table removal.
2. generated Supabase TypeScript types replacing hand-sync.
3. AI Cover.
4. EPUB.
5. advanced AI usage UI.

---

## 29. Definition of MVP technical completion

MY CHAPTER MVP is technically complete only when all of the following are true:

### Auth

- Email login E2E passes.
- OAuth launch providers pass.
- onboarding state is durable.
- direct URL access respects guards.

### Records

- all three Record modes create/edit/delete correctly.
- drafts restore.
- photos upload/delete.
- analysis is created or fails safely.

### Readiness

- minimum days + Records gate correctly.
- ready_at cannot regress.
- type changes do not re-lock Ready Books.

### Book making

- semantic Chapter generation works on real data.
- chapter_records is authoritative.
- reordering/edit/regenerate works.
- originals remain unchanged.
- manuscript completion is persisted.

### Publication

- Cover persists.
- Final Review completion persists.
- Free v1 succeeds.
- Free v2 is blocked.
- Pro v2 succeeds.
- snapshots remain immutable.
- PDF viewer works by publication ID.
- failed retry does not corrupt versioning.

### Security / deletion

- second account cannot access first account resources.
- RLS works for Records/Chapters/Publications.
- account deletion removes Auth, DB rows, Record photos, and Publication PDFs.

### UI / device

- 320 / 375 / 414 / 768 layouts pass.
- Loading / Empty / Error / Retry states pass.
- major accessibility checks pass.
- Android native auth/push/billing integrations pass before store release.

---

## 30. Change control

When implementation changes:

- Product behavior change → update 02_PRODUCT_DECISIONS if policy changed.
- Screen behavior change → update 05_SCREEN_SPEC.
- Architecture change → update 07_ARCHITECTURE.
- DB migration → update 12_DB_V2_CUTOVER_CHECKLIST and future 15_DATA_DICTIONARY.
- Edge/API contract change → update future 14_API_SPEC.
- Implementation gap resolved → update SCREEN_IMPLEMENTATION_GAP.
- Release verification → record in future 16_QA_E2E / 17_RELEASE_RUNBOOK.

Do not silently rewrite a product rule in this document merely to match accidental code behavior.

---

## 31. Version history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-06-12 | Initial legacy MVP development specification |
| 2.0 | 2026-10-16 | Rebuilt against current Product Decisions, Screen Spec v1.1, DB v2, publication versioning, semantic Chapters, current router/state/API structure and Supabase runtime status |
