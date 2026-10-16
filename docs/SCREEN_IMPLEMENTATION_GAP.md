# Screen Implementation Gap

**Status:** Active implementation checklist  
**Updated:** 2026-10-16  
**Basis:** 05_SCREEN_SPEC.md v1.1 vs current main branch code

This document contains only gaps found by comparing the final screen specification with current implementation. Do not add new product scope here.

## P0 — correctness / access / source-of-truth

### GAP-001 · Onboarding guard does not cover all product routes

**Status: RESOLVED IN CODE** — commit 4fdf536. Vercel build passed.

**Previous state**

- OnboardingGuard wraps /home, /library, /mypage, /records, /book.
- /project/*, /record/*, /book/manuscript, /book/cover, /book/review, /publication/:id and other detailed routes sit directly under AuthGuard.

**Risk**

An authenticated user with incomplete onboarding can deep-link into product flows that should be unavailable.

**Target**

Apply completed-onboarding protection to all non-onboarding product routes, then add route-specific active Book / ownership / stage guards.

**Evidence**

- src/router/index.tsx
- src/router/guards.tsx

**Done when**

An incomplete-onboarding account is redirected to A-03/O-01 from every product deep link.

---

### GAP-002 · Notification onboarding advances even when persistence fails

**Status: RESOLVED IN CODE** — commit 5547eb5. Vercel build passed.

**Previous state**

NotificationPage calls Supabase update, but navigates to /project/new even when the update returns an error.

**Risk**

The user can enter the Book flow without onboarding_completed being persisted. Combined with GAP-001, this creates an inconsistent profile/app state.

**Target**

- show an inline error
- remain on O-01
- navigate only after successful update

**Evidence**

- src/pages/onboarding/NotificationPage.tsx

**Done when**

A forced update failure leaves the user on O-01 and retry works.

---

### GAP-003 · Login Terms/Privacy links are behind AuthGuard

**Status: RESOLVED IN CODE** — commit 4fdf536. Vercel build passed.

**Previous state**

LoginPage links to /mypage/terms-of-service and /mypage/privacy-policy, but both routes are inside AuthGuard.

**Risk**

A guest reviewing terms before sign-in is redirected back to Login instead of seeing the legal document.

**Target**

Move public Legal routes outside AuthGuard or add equivalent public routes.

**Evidence**

- src/pages/auth/LoginPage.tsx
- src/router/index.tsx

**Done when**

Logged-out users can open both legal pages directly and return to Login.

---

### GAP-004 · Publication status still depends on legacy project.is_completed in some screens

**Status: PARTIALLY RESOLVED IN CODE** — Library commit 8a77ef1, Workspace commit 0bd765e. Vercel build passed. Home H-04 remains GAP-006.

**Previous state**

- Library derives 발행완료 from project.is_completed.
- Book Workspace derives published from project.is_completed.
- Publication v2 source of truth is publications.

**Risk**

UI status can drift from immutable publication history.

**Target**

Derive published state/latest version from publications and treat project.is_completed as transitional compatibility only.

**Evidence**

- src/pages/project/ProjectsListPage.tsx
- src/pages/project/ProjectWorkspacePage.tsx
- publication v2 API/Edge Function implementation

**Done when**

Home/Library/Workspace show the same publication state/version as Completed Books and Publication Viewer.

---

### GAP-005 · Workflow completion is inferred instead of persisted

**Status: IMPLEMENTED IN CODE + DB / E2E PENDING** — 2026-10-16. Migration 015 applied; types, Project API, ManuscriptPage, FinalReviewPage, Workspace and mock fixtures patched. Refresh/login and build still unverified.

**Previous state**

- manuscript completion is inferred from all Chapter content existing
- final review completion is inferred from published state / local checkbox state
- Final Review checkboxes reset on refresh

**Risk**

Workspace can show 완료 without the user having actually completed the review step, and progress can regress after refresh.

**Target**

Persist user workflow milestones, minimum:

- manuscript_reviewed_at
- final_review_completed_at

Use those fields for Workspace completion state.

**Evidence**

- src/pages/project/ProjectWorkspacePage.tsx
- src/pages/book/FinalReviewPage.tsx

**Done when**

Review completion survives refresh and Workspace status is based on persisted user action.

---

## P1 — final UX alignment / operational robustness

### GAP-006 · Published Home final state is not implemented

**Current**

Home has recording/Ready behavior but no dedicated state driven by latest publication.

**Target**

Implement H-04:

- latest vN + published date
- latest publication snapshot
- primary: 발행본 보기
- secondary: 책 작업실 열기
- Free republish → G-01
- Pro republish → Final Review flow

**Evidence**

- src/pages/home/HomePage.tsx

---

### GAP-007 · Native OAuth callback is not aligned with web callback

**Current**

- web redirect: /splash
- native redirect: com.mychapter.app://home

**Target**

Confirm native deep-link handling. Prefer routing through the same post-auth checkpoint semantics as Splash, or prove that native /home always passes equivalent onboarding guard logic.

**Evidence**

- src/pages/auth/LoginPage.tsx

---

### GAP-008 · Notifications has no explicit error/retry state

**Current**

NotificationsPage has loading, empty, list, unread, and mark-all states. listNotifications failure is not rendered as a recoverable UI state.

**Target**

Add Error + 다시 시도.

**Evidence**

- src/pages/notifications/NotificationsPage.tsx

---

### GAP-009 · API screens have uneven error handling

**Current**

Some loads use Promise chains or async functions without a user-visible catch state. Examples include Home/Library statistics/data loads.

**Target**

For API-backed screens, standardize Loading / Empty / Error+Retry / Success.

**Evidence**

- src/pages/home/HomePage.tsx
- src/pages/project/ProjectsListPage.tsx
- other API-backed pages during regression

---

### GAP-010 · Legal iframe has no loading/error fallback

**Current**

LegalPage renders an iframe only.

**Target**

Add loading state and a visible error/fallback action if the legal document cannot load.

**Evidence**

- src/pages/mypage/LegalPage.tsx

---

### GAP-011 · Input policy gaps remain

**Open**

- Free Record title max length
- Photo file size / image resolution policy
- Chapter title/body max policy

**Target**

Fix launch limits in product policy, then enforce in UI/API consistently.

**Evidence**

- src/pages/record/RecordFreePage.tsx
- src/pages/record/RecordPhotoPage.tsx
- Chapter edit implementation

---

### GAP-012 · Direct URL ownership/stage guards need full regression

**Target**

Verify and/or implement:

- active Book guard
- Record ownership
- Chapter ownership
- publication ownership
- Ready gate
- Chapter prerequisite
- Cover prerequisite
- publishResult-only complete route

This is separate from the broad onboarding guard in GAP-001.

---

## P2 — polish / post-MVP scope boundaries

### GAP-013 · Accessibility verification is incomplete

Verify:

- visible keyboard focus
- icon-only accessible labels
- Modal/BottomSheet focus behavior
- touch target size
- non-color state communication
- prefers-reduced-motion if motion expands

---

### GAP-014 · Planned screens/policies stay out of MVP until explicitly decided

Keep Planned:

- M-03 AI Usage
- R-06 AI Record Edit Result
- R-10 AI Edit Quota exact policy
- AI-generated cover
- EPUB milestone

Do not build these before P0/P1 gaps and production E2E are complete.

---

## Operational blocker

### BLOCK-001 · Supabase MyChapter project is currently INACTIVE

Production real-data E2E is blocked until the project is active and SQL/API access succeeds.

This is not a screen-code gap, but it blocks verification of:

- auth/session
- profile/onboarding persistence
- Book/Record/analysis rows
- Readiness
- Chapter/Chapter Records
- Publication v1/v2
- Storage deletion
- multi-account RLS

---

## Implementation order

1. GAP-005
2. GAP-006
3. GAP-008 + GAP-009 + GAP-010
4. GAP-011 + GAP-012
5. GAP-013
6. only after real-data E2E: legacy cleanup and any Planned scope

## Lock rule

05_SCREEN_SPEC.md v1.1 is the screen/UX target. When code differs from it, update code or explicitly revise the product decision; do not silently change the screen document to match accidental implementation.

## Operational status recheck — 2026-10-16

**BLOCK-001 status: RESOLVED AS ENVIRONMENT AVAILABILITY BLOCKER.** Direct Supabase project listing now reports MyChapter as `ACTIVE_HEALTHY`; live schema/migration inspection succeeds. The historical `INACTIVE` wording above documents an older state, not the current one. Production **real-user E2E remains pending**; database availability is not functional validation.

## GAP-005 deployment verification — 2026-10-16

- Vercel production deployment `dpl_4aWLNz4x3xaGdsb9s6QgiCy2kXfc` is **READY**, built from main commit `6eb0b65f9326f2e2d10e9906be4e824cbf0c4f73` containing milestone code and schema migration file. This confirms build/deployment, not actual authenticated workflow.
- Supabase migration `workflow_review_milestones` successfully applied, both columns confirmed nullable timestamptz, post-change Security Advisor zero warnings.
- Direct local `git clone` build is unavailable in this execution environment (network DNS failure); independent GitHub Actions run not observed.
- **PENDING before RESOLVED:** authenticated real-user manuscript review save/refresh; final-review save/refresh; Workspace re-entry; user B blocked from modifying user A's Book; failed save feedback; stale checkboxes / content change invalidation policy.
- **Important observed edge:** FinalReview local checkbox edits after saved review reset the local `reviewSaved`, but persisted `final_review_completed_at` remains set until a fresh confirmation. Product invalidation rules should be explicitly settled and tested. Do not claim full UX regression completion yet.
