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

## 10. Server-side publication prerequisites — 2026-10-16

**Shipped:** `generate-pdf` Edge Function **v7 ACTIVE** (JWT verification enabled). GitHub source commit `51f7819d`. Existing authenticated user/owned project and server-side Free/Pro published count checks retained. Added server rejection before PDF generation for:

- `REVIEW_REQUIRED` (409): missing `ready_at`, `manuscript_reviewed_at` or `final_review_completed_at`.
- `COVER_MISMATCH` (409): requested cover differs from persisted project cover.
- `MANUSCRIPT_INCOMPLETE` (400): chapter list empty, or any chapter title/content empty.

Client `books.ts` now maps codes to `BookApiError`; `FinalReviewPage` displays the specific rejection message. Deployment v7 fetched back from live project and confirmed to contain the guards.

**Not yet proven:** authenticated E2E with two accounts, Free v1/Pro v2 PDF generation, payment entitlements, or concurrent publication. There is a TOCTOU window between the initial review check and PDF finalization; a separate atomic server-side reservation/recheck plan is required for race-safe publication and version allocation. These checks are not sufficient to declare full publication security and versioning complete.


## 11. Atomic publication reservation — 2026-10-16

- Migrations `017_atomic_publication_reservation.sql`, `018_free_publication_slot_lock.sql`, `019_private_publication_reservation.sql` applied to MyChapter live Supabase.
- Version reservation now uses a database transaction with per-user advisory lock and project row lock. In-progress requests are rejected with `PUBLICATION_IN_PROGRESS`; failed latest version may be retried; Free users also cannot reserve a second processing Book concurrently.
- Reservation enforces authenticated owner, persisted Ready/Manuscript/Final Review, matching cover, complete chapter titles/body, and Free/Pro published entitlement.
- Privileged function lives in `private` schema, called via `public.reserve_book_publication` SECURITY INVOKER wrapper; anon EXECUTE is denied. Post-migration Security Advisor: **0 warnings**.
- Production Edge Function `generate-pdf` **v8 ACTIVE** calls the reservation RPC; client shows in-progress conflict message.
- **Pending before marking publication stable:** authenticated Free/Pro end-to-end PDF success, double-submit collision test, failed publication retry, crash/timeout orphaned processing reservation recovery, and content mutation while rendering (TOCTOU). Existing `processing` reservation has no recovery timeout; manual diagnostic is required for stuck attempts.


## 12. Phase A-1 — interrupted PDF reservation recovery (2026-10-16)

- Live migration `020_publication_timeout_recovery.sql` applied; adds `publications.processing_started_at` and extends `private.reserve_book_publication`.
- Reservations older than one hour in `processing` are marked `failed` with `PUBLICATION_TIMEOUT` **when that same user next requests a publication**; this is on-demand recovery, not a background scheduled watchdog.
- A failed latest version is reused and its `processing_started_at` resets on retry; fresh reservations stamp the start time.
- Supabase Security Advisor shows zero warnings. SQL function introspection confirms timeout handling and lease reset.
- **Risks:** a still-running function older than an hour could compete with a retry; safe finalization fencing/token and writing PDFs to attempt-scoped storage are not yet in place. Authenticated crash/retry E2E not performed.

## 13. Phase A-2 — stale worker fencing + source recheck (2026-10-16)

- Applied migrations `021_publication_attempt_fencing.sql` and `022_publication_finalize_lock_order.sql`. Each reservation is assigned a new `attempt_token` and a fingerprint of title/cover/ordered chapters; only matching tokens may finalize or fail a processing publication.
- The server writes PDFs to attempt-specific paths. Atomic finalization rejects an altered Book or missing review approval, and a stale worker cannot publish its PDF or overwrite the current version path. Source-changing editor updates invalidate approval (migration 016).
- Finalization uses project-before-publication lock order consistent with reservation. Nullable AI tagline supported.
- Supabase `generate-pdf` **v9 ACTIVE**. Finalization RPC permitted for service_role only; authenticated users cannot finalize directly. Post-migration Security Advisor shows zero warnings.
- **PENDING:** two-account authenticated E2E, generation-versus-edit race simulation, timed-out old attempt finishing after a retry, publication recovery, and real Free/Pro PDF rendering. Treat code+schema deployment as verified, not E2E completion.

## 14. Phase B onboarding → project → first free record source audit (2026-10-16)

- Reviewed EmailLoginPage, NicknamePage, NotificationPage, ProjectTypePage, ProjectSetupPage, ProjectCompletePage, RecordModePage, RecordFreePage, authStore and useActiveProject.
- Fixed free record save handler to reject duplicate in-flight saves and stale editingRecord from a different user or Book; commit 1270bdb0.
- Fixed project creation handler to guard against a second in-flight creation request; commit 52888d51.
- **Not an E2E pass:** OAuth/email callbacks, automatic users-row bootstrap, notification preferences, record persistence and two-account ownership have not been executed under a real test login.
- **Additional risk:** UI-only Free project creation limit may be bypassed by direct project insert unless database/API enforces it. A JavaScript loading guard alone is not an atomic idempotency lock.
- **Next:** live account smoke tests and server-side project entitlement validation before asserting first-run complete.

## 15. Phase B-4 real-account first-run verification (2026-10-16)

- Source-reviewed first-run routes, OAuth initiation, authStore initialization, and onboarding/profile creation schema.
- Live DB schema confirms `auth.users` AFTER INSERT trigger `on_auth_user_created` is present. Presence does **not** prove real profile bootstrapping.
- Fixed `LoginPage` to surface OAuth initiation errors and disable duplicate OAuth clicks while request is pending; commit `14acff46`.
- Browser-based authenticated E2E was **not** executed: no authorized disposable login session, verification inbox or production test credentials available through the connected developer tools. Do not invent a PASS.
- Next executable smoke run: AUTH-01 email magic link → users profile → nickname/notification persisted → project create → free record save/reload; then question/photo modes → readiness fixtures → AI chapter → review → PDF v1. Save evidence and failures by step.

## 16. Phase B first-record saved-state consistency — 2026-10-16

- Audited `createRecord`/`updateRecord` → `finalizeSave` → Free Record draft cleanup. Found false failure feedback: DB record could be persisted but subsequent badge notification or draft cleanup error was caught by the UI as if the save failed, risking duplicate resubmission.
- `finalizeSave` now treats badge notification failure as non-blocking; commit `a9fe813f`. `RecordFreePage` now treats draft cleanup failure as non-blocking after persistence; commit `d65e428e`.
- **Pending:** authenticated test with deliberately failing badge/draft APIs, record count reload after save, and verification that stale drafts never overwrite saved-record state. Do not claim E2E PASS.
