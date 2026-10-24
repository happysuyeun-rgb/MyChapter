# 16. QA / E2E Verification

**Version:** 0.2  
**Status:** ACTIVE / EVIDENCE LOG  
**Updated:** 2026-10-24  
**Target:** MY CHAPTER first Free Book → first real PDF → revisit; do not conflate deployment readiness with successful E2E.  
**Companion status board:** `22-e2e-status.md`

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
| ENV-07 | Test users/data | PARTIAL — LIVE | Auth E2E exercised 2026-10-24; Book/Record rows still PENDING Work verification |
| ENV-08 | Vercel production @ `7ab565a6` | PASS — LIVE | https://my-chapter.vercel.app — login suite 7/7 |
| ENV-09 | Save-integrity unit suite | PASS — BUILD | vitest 18/18 on conflict/idempotency policy (`7ab565a`) |

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

## 17. Draft restore and owned record edit review — 2026-10-16

- Verified that Free Record edit UI checks `editingRecord.user_id` and `editingRecord.project_id`, but the update API originally filtered only `id` and `user_id`. Added `project_id` predicate server-request-side to `updateRecord`; commit `cb7dd410`.
- Draft-save exit action formerly navigated only on success but offered no catch/error. Added failure feedback while keeping editor content visible; commit `6ab1989a`.
- **Still open:** Free draft is fetched only after AI hint request resolves: slow AI delays restoration, and draft read errors are not handled in that initialization path. An additional fix is needed.
- **E2E pending:** authenticate, save draft, refresh, restore, edit and save, switch Book, verify no other Book record is updated, simulate draft API failure.

## 18. Free-writing draft restore order — 2026-10-16

- Changed `RecordFreePage` initialization to load the persisted draft **before** awaiting the AI hint. If draft retrieval fails, an inline recovery message appears; AI hint still uses its existing fallback and quota behavior.
- GitHub commit: `93fa6628`.
- **Static/code completion only. E2E pending:** draft save → leave → return → content/title/emotions restored; AI hint timeout; draft read failure; edit existing record must not apply another draft; fast typing before draft load; cross-project switch; error/retry behavior.

## 19. Late draft hydration protection — 2026-10-16

- `RecordFreePage` now marks local title/content/emotions interactions as touched and skips late draft hydration if edits began. Tracks initialization generation to ignore async responses after effect cleanup or project switch. Commit `305e978d`.
- **Remaining limitations:** authenticated E2E is pending; concurrent data edits across tabs are not merged; synchronous `saving` state is not a DB idempotency key; a draft and live record should be verified with real sessions. Test slow draft response, typing first, project switching, leave/reenter, and edit an existing record.

## 20. Atomic record numbering — 2026-10-16

- Verified `records_project_id_record_number_key` UNIQUE constraint exists; formerly the client queried max record number then inserted, which races across devices/tabs.
- Applied `supabase/migrations/024_atomic_record_number.sql` to live DB: BEFORE INSERT trigger `records_assign_record_number` serializes each project's numbering through transaction-scoped advisory lock and assigns MAX+1 on the server. It checks the authorized user owns the book; client-submitted number is replaced. Commit `0c89cab7`.
- Post-migration Security Advisor: zero lints. Existing UI may display a provisional count before saving; persisted `record_number` is authoritative.
- **Pending E2E:** concurrent authenticated INSERTs to one project, editing and deletion gaps, cross-user insert, retry after failed network requests, and DB constraint behavior.

## 21. Record create retry reconciliation — 2026-10-16

- Each new record editor (free, question, photo) now retains one UUID for its current create attempt. The create API inserts that UUID as the record primary key and, if its insert response fails, reads back the exact ID under the same user/project; only a complete match of mode, body, question, title, photo and emotion tags counts as a recovered success.
- The DB already enforces unique primary-key IDs and atomic per-project record numbering via migration 024. Reusing the UUID prevents a timed-out insert followed by an immediate retry from creating a second record with a new ID.
- Photo editor caches the successfully uploaded Storage path for the same selected file, preventing path mismatch and duplicate upload on retry. Selecting another file resets that cache.
- Relevant commits: `2069df57`, `23976540`, `98853368`, `3b2a0b37`, `cbffea57`.
- **Pending:** authorized account E2E with injected network timeouts; retries after full page refresh are not guaranteed idempotent (the UUID is component-local). Edits and badge events need separate idempotency policy. Do not claim E2E PASS from a ready build.

## 22. Reload-stable create request identity — 2026-10-16

- Added `src/lib/recordRequestId.ts`: scoped sessionStorage UUID for user + Book + record mode (24h TTL), no manuscript content stored. Editors reuse UUID on retry even after refresh, clear on confirmed save. Commits `52dc3308`, `27f1b4ab`, `de0850e9`, `16ca2350`.
- The DB primary key rejects a second insert of the same UUID; createRecord reconciles matching existing rows. This improves idempotency across same-tab refresh, not cross-browser/device or sessionStorage loss.
- **Known blocker for photo refresh:** selected File and upload path are component-local; if refreshed after an ambiguous photo submission, re-uploading creates a different photo path and the existing-row matching check safely rejects it. Needs durable photo attempt metadata + uploaded file recovery workflow, without persisting the image insecurely.
- **Other limitations:** changed content with an outstanding ambiguous request is intentionally rejected to avoid silently treating different content as a retry; no authoritative real-user timeout/retry E2E executed.

## 23. Photo uploaded-path restoration after refresh — 2026-10-16

- Added `src/lib/photoAttempt.ts` (commit `ea81e895`), storing only the user's/project's pending upload path and matching record request UUID in sessionStorage with 24h TTL; no original image bytes or record content are stored.
- Photo editor (commit `c9ef4d3f`) restores matching upload path and requests a fresh signed preview after reload; creation can retry using the same previously uploaded Storage object. Successful save clears pending photo metadata and record request ID.
- **Not an E2E PASS:** live upload, access control, signed URL and ambiguous response handling still require authenticated exercise. Changing the photo after an ambiguous committed attempt may produce safe payload mismatch; no automatic merge. Upload or DB failures can leave orphaned files, needing cleanup policy. Client-level sessionStorage may be unavailable.

## 24. Production email auth E2E — 2026-10-24 (PASS — LIVE)

**Environment:** https://my-chapter.vercel.app · commit `7ab565a6` · Work-operated real login.

| ID | Scenario | Result |
|---|---|---|
| AUTH-LIVE-01 | Production deploy healthy | PASS — LIVE |
| AUTH-LIVE-02 | Supabase anon/public key wired | PASS — LIVE |
| AUTH-LIVE-03 | Magic Link email delivered | PASS — LIVE |
| AUTH-LIVE-04 | Email login succeeds | PASS — LIVE |
| AUTH-LIVE-05 | Post-login My Page | PASS — LIVE |
| AUTH-LIVE-06 | Session survives refresh | PASS — LIVE |
| AUTH-LIVE-07 | Logout + protected route blocked | PASS — LIVE |

Supabase request sample: 29 calls, **no 4xx/5xx**. Prior production auth/401 issues are recorded as **resolved** for the email Magic Link path.

**Still not PASS:** Google/Kakao OAuth; custom SMTP for general users; Book create; free/question/photo save; reload persistence; PAGE number integrity; AI chapter; PDF publish.

## 25. Explicit create-conflict UX — BUILD (`7ab565a`)

- Auto-mint of a new request UUID on `RecordRequestConflictError` removed. Same ID + same payload → return existing; same ID + different payload → modal (open existing / save as new). Lookup failure → recoverable error, no auto-insert.
- vitest **18/18** PASS — BUILD. **Not** a substitute for Work Book/Record LIVE E2E.
