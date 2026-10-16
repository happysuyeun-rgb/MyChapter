# 16. QA / E2E Verification

**Version:** 0.1  
**Status:** ACTIVE / EVIDENCE LOG  
**Updated:** 2026-10-16  
**Target:** MY CHAPTER first Free Book → first real PDF → revisit; do not conflate deployment readiness with successful E2E.

## Evidence labels

- **PASS — LIVE:** observed authenticated user action against Supabase and production-like app.
- **PASS — STATIC / BUILD:** source or deployment checks only. This does not satisfy functional E2E.
- **PENDING:** no evidence yet.
- **FAIL:** reproduced, with link to issue/commit.

## 1. Environment baseline

| ID | Test | Result | Evidence |
|---|---|---|---|
| ENV-01 | MyChapter Supabase reachable | PASS — LIVE admin inspection | ACTIVE_HEALTHY, PostgreSQL 17 |
| ENV-02 | Schema migration 015 applied | PASS — LIVE admin inspection | `20261016025534 workflow_review_milestones` |
| ENV-03 | Review columns exist / nullable timestamptz | PASS — LIVE admin inspection | information_schema checked |
| ENV-04 | Security Advisor | PASS — LIVE admin inspection | Zero security lints |
| ENV-05 | GAP-005 code before reopen fix | PASS — BUILD | Vercel production READY at `6eb0b65f` |
| ENV-06 | Final review reopen fix | PENDING BUILD | `5326e758`, Vercel build pending at first check |
| ENV-07 | Test users/data | PENDING | Public tables currently contain no user data; no authenticated E2E exercised |

## 2. GAP-005 manuscript / final review scenarios

| ID | Scenario | Expected | Status |
|---|---|---|---|
| MS-01 | Owned ready Book, all Chapters have content: press manuscript confirmation | Writes `manuscript_reviewed_at`, navigates to Cover only after successful save | PENDING |
| MS-02 | Reload / log out / log back in | Workspace shows Manuscript done based on stored timestamp | PENDING |
| MS-03 | Force API error on manuscript save | Stay on Manuscript, user-facing retry/error; DB milestone unchanged | PENDING |
| FR-01 | Confirm three checks and save | Writes `final_review_completed_at` for owned Book with manuscript reviewed | PENDING |
| FR-02 | Reload / re-login | Checkboxes restored as saved, publication button enabled if entitled | PENDING |
| FR-03 | Saved state: attempt direct checkbox edit | Cannot create local/DB divergence; checkboxes locked | PENDING |
| FR-04 | Explicit '검수 다시 하기' | Clears DB final-review milestone first, then resets checkboxes; Workspace shows pending | PENDING |
| FR-05 | Reopen API fails | Keep prior saved state, show retry/error | PENDING |
| FR-06 | User B attempts update on User A's project | No milestone changed; RLS/ownership enforced | PENDING |
| FR-07 | Direct final-review request before manuscript reviewed | Owned update returns no match/fails; no false completion | PENDING |
| FR-08 | After review, edit Chapter/TOC/Cover | Invalidation and re-approval policy must be defined and enforced consistently | OPEN POLICY |

## 3. Additional MVP acceptance suites

- **AUTH-01:** email auth, onboarding persistence, guest routes, logout/login, Google/Kakao and native callbacks before relevant store release.
- **BOOK-01:** create Book, select type, switch active Book, sticky Ready after time passes.
- **RECORD-01:** question/free/photo records, save/edit/delete, drafts, signed photos and storage cleanup.
- **AI-01:** record analysis with safe failure, semantic source selection, no original Record mutation.
- **PUB-01:** Free v1 PDF succeeds, versioned snapshot/Viewer works on reload.
- **PUB-02:** Free v2 prohibited; Pro v2 allowed; failed retry preserves intended version; concurrent call behavior checked.
- **SEC-01:** cross-user Record/Chapter/Publication/Storage access rejected.
- **DELETE-01:** Auth/DB/Storage files deleted under account deletion.
- **UI-01:** 320/375/414/768px layouts, Loading/Empty/Error+Retry, focus and screen-reader controls.
- **WEB-01:** production build and deployment match tested Git commit.
- **ANDROID-01:** native OAuth/deep-link/FCM/Google Play billing tested before Android launch.

## 4. Test procedure and stop conditions

1. Use **authorized, disposable test accounts** and non-sensitive fixture Records; do not modify genuine user books to test.
2. Use real login and a ready test Book. Story Readiness duration/record count cannot be bypassed in a real-user PASS without clearly labeling a dedicated test fixture.
3. Confirm DB timestamps by authenticated owner, then refresh page and re-enter Workspace/Final Review.
4. Repeat with second test account and attempts to access the first account's resource. Never use service-role result to claim RLS has been tested.
5. Confirm that successful Vercel deployment of a commit is not proof of real user operation.
6. After all GAP-005 cases pass, update `SCREEN_IMPLEMENTATION_GAP.md` to RESOLVED with exact evidence; do not do so before.

## 5. Known risks for follow-up

- `completeFinalReview` requires the manuscript timestamp, but no database-level check yet enforces cover/TOC/Chapter completeness for a direct API call; server-side validations must be evaluated before production release.
- Chapter edits or cover changes after saved review may make milestone semantics stale. Decide and implement a clear invalidation policy before calling final-review workflow fully complete.
- `useActiveProject` refreshes project records through its hook, but effective persistence across re-login has not been observed with real user data.
- No GitHub Actions job result was observed in previous checks; Vercel build is separate verification.

**GAP-005 is implemented but remains E2E PENDING.**

## 6. Review invalidation — migration 016 (2026-10-16)

**Implemented and applied:** `supabase/migrations/016_review_invalidation.sql`, Supabase migration `review_invalidation`.

- Project title, subtitle, author, or cover changes clear `final_review_completed_at` only.
- Chapter INSERT/DELETE or meaningful content/title/order/record_ids UPDATE clears both `manuscript_reviewed_at` and `final_review_completed_at`.
- No-op Chapter updates do not reset milestones.
- Database triggers make source writes and milestone invalidation transactional; existing versioned publications are not modified.
- Live information_schema confirms `chapters_invalidate_book_review` (INSERT/UPDATE/DELETE) and `projects_invalidate_final_review` (UPDATE). Live post-migration Security Advisor reports zero lints.
- **PENDING:** authenticated tests that edit a reviewed Book, refresh Workspace, then reapprove manuscript/final review. Trigger existence alone is not behavioral E2E. DB security / RLS correctness for the trigger caller also needs cross-user test.

## 7. Story Readiness sticky persistence — 2026-10-16

- Source: `src/lib/api/projects.ts`; `getProjects` now checks eligible unmarked Books and persists `ready_at` using a conditional owned Supabase update. On change of Book type, `updateProjectSettings` first persists Ready earned under the old policy.
- Existing record-insert trigger still handles records that qualify immediately; this client load path handles the previously missing **time-only transition**.
- **PENDING E2E:** ready book with elapsed days + record count but NULL `ready_at`; reload Home and check DB updated; switch type to stricter rule and confirm Ready remains true; non-owner update rejected; concurrent client reads; failure handling.
- **Risk:** time calculations use device-local day boundaries and real DB date rules may differ around timezone midnight; test in Asia/Seoul with rollover cases.
- Do not mark this resolved until actual authenticated test and production build evidence are recorded.

## 8. GAP-012 direct URL hardening — 2026-10-16

**Code implemented / authenticated E2E pending:**
- `getRecord(id,userId?)` and `getChapter(id,userId?)` support owner-filtered reads, and Record Detail/Edit, Chapter Preview/Edit pass the authenticated user ID.
- `BookStageGuard` protects direct access to Manuscript, Cover and Final Review. It requires an active owned Book and readiness; Cover/Review require Chapters and saved manuscript confirmation; Review additionally requires selected Cover.
- The `/publication/:id` viewer already uses `getPublishedBookById(user.id,id)`, which filters by user ID and published status. The publish-complete route already needs an in-memory publishResult, but does not yet validate this as a server-backed permission.
- An authenticated user can still access Chapter Preview/Edit via direct URL when they own that Chapter even if their Book is not Ready; intended exception must be confirmed or a stricter chapter-stage rule added.
- This is client navigation hardening, **not** a substitute for Supabase RLS or server-side Edge Function authorization.
- **PENDING:** Vercel build status for new BookStageGuard commit; two-account deep-link tests, access before readiness, before manuscript confirmation, before cover selection, and direct publication URLs.

## 9. GAP-006 Published Home implementation — 2026-10-16

- `HomePage` now retrieves latest published `publications` snapshot for the active Book via `getPublishedBook` and displays its immutable `title_snapshot`, version and published date.
- Primary CTA for published Book opens `/publication/:id`; secondary CTA goes to Workspace. Before publication, the primary CTA remains Record entry.
- A recoverable loading failure / retry state is now present on Home.
- **PENDING real-account E2E:** publish v1, return Home, confirm snapshot version/date and CTA; modify live Book title without republishing and confirm Home still displays latest publication snapshot; republish v2 Pro and recheck, compare Library/Workspace/Completed Books.
- The publication-specific Free republish CTA policy is not yet implemented; treat GAP-006 as partially implemented until full H-04 alignment is checked.
