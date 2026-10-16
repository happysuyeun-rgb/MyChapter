# 13. Development Specification

**Status:** CURRENT  
**Version:** 2.0  
**Updated:** 2026-10-16  
**Basis:** current `main` code + Supabase production schema/function state + Product Decisions + Final Screen Spec v1.1

> 이 문서는 MY CHAPTER를 **어떻게 구현하고 연결하는지**를 정의하는 통합 개발명세서다.  
> 제품 정책을 새로 정의하지 않는다. 정책 충돌 시 `02_PRODUCT_DECISIONS.md`가 우선한다.

---

## 0. Source of Truth / 문서 관계

개발 판단 우선순위:

1. `02_PRODUCT_DECISIONS.md` — 제품 정책
2. `01_PRODUCT_SPEC.md` — 현재 기능 정의
3. `05_SCREEN_SPEC.md` — 화면/UX 동작
4. `06_FREE_PRO_POLICY.md` — Free/Pro 권한
5. `07_ARCHITECTURE.md` — 상위 기술 구조
6. 실제 Supabase schema + migrations — DB 실제 상태
7. 본 문서 — 구현 연결 규칙
8. 향후 `14_API_SPEC.md` — API/Edge Function 상세 계약
9. 향후 `15_DATA_DICTIONARY.md` — 실제 필드/관계 상세
10. 향후 `16_QA_E2E.md` — QA/E2E 실행 기준

Legacy 문서(`docs/08-development-specification.md`, `02-database-schema.md`, `03-edge-functions-api.md`, `04-business-rules.md` 등 초기 소문자 문서군)는 신규 개발 판단에 사용하지 않는다.

---

## 1. Product / Runtime Definition

### 1.1 제품 정의

MY CHAPTER는 사용자가 자신의 이야기를 **책(Project)** 단위로 기록하고, AI가 기록을 분석해 챕터와 원고로 발전시킨 뒤 최종적으로 전자책(PDF)으로 발행하게 만드는 서비스다.

사용자-facing 핵심 개념:

- Project = Book
- Record = 원본 기록
- Story Readiness = 책 만들기 unlock 기준
- Chapter = 여러 원본 기록을 의미 기반으로 묶은 편집 결과
- Manuscript = 챕터들을 전체 책 관점에서 검수하는 workflow stage
- Publication = 발행 당시 상태를 보존한 immutable version snapshot

### 1.2 구현 핵심 불변식

- 원본 Record는 AI가 임의로 변경하지 않는다.
- `chapter_records`가 Chapter↔Record 관계의 source of truth다.
- `publications`가 발행 이력의 source of truth다.
- 발행본은 v1, v2, v3처럼 버전이 증가하며 이전 발행본을 덮어쓰지 않는다.
- Free 사용자는 첫 책의 첫 PDF 발행까지 완료할 수 있다.
- 개발용 mock bypass는 production에서 항상 비활성이다.

---

## 2. Current Implementation Snapshot

### 2.1 Repository

- Repository: `happysuyeun-rgb/MyChapter`
- Main branch: `main`
- Current frontend deploy: Vercel
- Production URL: `https://my-chapter.vercel.app`

### 2.2 Supabase

Project:

- name: `MyChapter`
- ref: `rdrafwfdwfzgcfiqkgug`
- region: `ap-southeast-1`
- status at 2026-10-16 verification: `ACTIVE_HEALTHY`
- PostgreSQL: 17.6

Applied migration lineage:

- 001 initial_schema
- 002 rls_policies
- 003 triggers
- 004 notifications_insert
- 005 cron_daily_reminder
- 006 published_pdfs_storage
- project type expansion
- publication entitlement
- DB v2 foundation
- record_analysis
- chapter_records
- publication_versions
- rls_v2
- security_performance_hardening

Current verification data count was 0 for auth users, projects, records, analyses, chapters, relations, and publications. This is an environment snapshot, not a product rule.

### 2.3 Active Edge Functions

| Function | Current deployed version | JWT |
|---|---:|---|
| generate-question | 6 | required |
| generate-freewriting-hint | 6 | required |
| analyze-record | 1 | required |
| generate-chapter | 7 | required |
| regenerate-chapter | 8 | required |
| generate-pdf | 6 | required |
| verify-subscription | 4 | required |
| delete-account | 5 | required |
| send-daily-reminder | 4 | deployed |

Security advisor at the latest verification returned no security warnings. Performance advisor still contains legacy/performance notices that are not launch-blocking correctness issues.

---

## 3. Technology Stack

### 3.1 Client

| Layer | Technology |
|---|---|
| UI | React 19.1 |
| Language | TypeScript 5.8 |
| Build | Vite 6.3 |
| Routing | React Router 7.6 |
| State | Zustand 5 |
| Styling | Tailwind CSS 3.4 |
| Drag reorder | dnd-kit |
| Animation asset runtime | lottie-react |
| Backend SDK | @supabase/supabase-js 2.49 |
| Native shell | Capacitor 7 |

### 3.2 Backend

- Supabase Auth
- PostgreSQL
- RLS
- Supabase Storage
- Supabase Edge Functions
- Gemini text generation through shared Edge Function helper
- FCM reminder integration
- Google Play subscription verification path

### 3.3 AI runtime

Current shared AI helper:

- model: `gemini-2.5-flash`
- secret key env: `GOOGLE_AI_API_KEY`
- AI requests originate from Edge Functions, not from the browser client

Legacy Anthropic/Claude descriptions in old documentation are obsolete.

---

## 4. Repository Structure

```text
MyChapter/
├─ docs/
├─ public/
│  └─ legal/
├─ src/
│  ├─ components/
│  │  ├─ common/
│  │  ├─ features/
│  │  └─ layout/
│  ├─ pages/
│  │  ├─ auth/
│  │  ├─ onboarding/
│  │  ├─ home/
│  │  ├─ project/
│  │  ├─ record/
│  │  ├─ book/
│  │  ├─ notifications/
│  │  └─ mypage/
│  ├─ router/
│  ├─ stores/
│  ├─ hooks/
│  ├─ lib/
│  │  └─ api/
│  ├─ constants/
│  ├─ utils/
│  ├─ types/
│  └─ mocks/
├─ supabase/
│  ├─ migrations/
│  └─ functions/
└─ android/
```

---

## 5. Application Shell / Routing

### 5.1 Root

`RootLayout` responsibilities:

- Auth store initialize
- Native bridge mount
- child route render
- global Paywall
- global Toast

### 5.2 AppLayout

Bottom navigation shell:

- Home
- Library
- My

`/records` and `/book` may render within AppLayout while focused edit/detail routes render outside bottom navigation when appropriate.

### 5.3 Auth Guards

#### AuthGuard

Required for all authenticated application routes.

Behavior:

- auth state not initialized → loading
- no session → `/login`
- valid session → render child route

#### GuestGuard

Used by Login routes.

- no session → login UI
- session exists → `/splash`

#### OnboardingGuard

Current product routes are wrapped after GAP-001 correction.

Rules:

- no nickname → `/onboarding/nickname`
- nickname exists but onboarding incomplete → `/onboarding/notification`
- onboarding complete → render child route

### 5.4 Public routes

Public without AuthGuard:

- `/` → `/splash`
- `/splash`
- `/login`
- `/login/email`
- `/mypage/privacy-policy`
- `/mypage/terms-of-service`

Legal documents must remain viewable before authentication.

### 5.5 Route-specific prerequisite target

Broad onboarding protection is implemented. Resource/stage-specific protection still requires full regression and some explicit guards.

Target:

- `/record/*`: active Book
- `/records/:id*`: active Book + Record ownership
- `/book`: active Book + Ready
- `/book/chapter/:id*`: Ready + Chapter ownership
- `/book/manuscript`: Ready + at least 1 Chapter
- `/book/cover`: Ready + at least 1 Chapter
- `/book/review`: Ready + Chapter + persisted Cover
- `/book/publish/complete`: valid transient publishResult
- `/publication/:id`: publication ownership

Detailed UX mapping is defined in `05_SCREEN_SPEC.md`.

---

## 6. Authentication / Onboarding

### 6.1 Providers

Client exposes:

- Kakao OAuth
- Google OAuth
- Email Magic Link

Web redirect target:

`/splash`

Native OAuth currently uses:

`com.mychapter.app://home`

Native callback semantics still need confirmation so onboarding routing cannot be bypassed.

### 6.2 Splash as post-auth checkpoint

Splash must remain the single web checkpoint for post-auth routing.

Decision tree:

```text
no session
→ /login

session + nickname missing
→ /onboarding/nickname

session + nickname exists + onboarding incomplete
→ /onboarding/notification

session + onboarding complete
→ /home
```

### 6.3 Profile bootstrap

Auth initialization:

1. `supabase.auth.getSession()`
2. set session/user
3. if user exists, read `public.users`
4. subscribe to `onAuthStateChange`
5. keep profile in `authStore`

### 6.4 New auth user DB bootstrap

Database trigger creates:

- `public.users`
- default Free `subscriptions` row

This trigger must be verified in real-account E2E.

---

## 7. Development Bypass / Mock Rule

`isDevBypass()`:

- production: **always false**
- development: enabled only when `VITE_DEV_BYPASS` is truthy (`true`, `1`, `yes`)

Production must never render mock book/user data even if a stale environment variable remains.

Mock paths are for local UI development only and cannot be used as real-data acceptance evidence.

---

## 8. Client State Management

### 8.1 authStore

Persistent responsibility:

- session
- user
- profile
- initialized state

On sign-out:

- reset subscription
- clear active project
- clear auth state

### 8.2 projectStore

State:

- project list
- active Project object
- activeProjectId
- created Project
- firstQuestion
- new Book draft

Only `activeProjectId` is persisted to local storage.

On app load the persisted ID must be revalidated against the authenticated user's actual project list.

### 8.3 recordStore

Transient state:

- editingRecord
- lastSave
- lastProject

`lastSave` drives Record Complete and should not be treated as persistent domain state.

### 8.4 bookStore

Transient state:

- selectedCoverId
- publishStage
- publishError
- publishResult

`publishResult` is required for `/book/publish/complete`; direct page entry without it redirects away.

Persistent cover selection belongs in `projects.selected_cover_id`.

### 8.5 subscriptionStore

State:

- `free | pro`
- loading

Actual entitlement source is Supabase `subscriptions`, not Zustand.

### 8.6 paywallStore

State:

- modal visibility
- optional pendingAction

Purchase completion may execute pendingAction after plan verification.

---

## 9. Book / Project Domain

### 9.1 Project = Book

`projects` remains the root aggregate.

Current DB retains compatibility fields:

- `target_count`
- `frequency`
- `notification_time`
- `record_mode`
- `target_date`
- `is_completed`
- `cover_template_id`

These are not current product source-of-truth where they conflict with newer v2 policy.

### 9.2 Current creation implementation

`createProject()` still writes legacy routine-compatible fields using `calculateRoutine()`.

This is transitional.

User-facing creation UI must only communicate:

- Book type
- title
- Story Readiness minimum guidance

Legacy period/frequency/target_count must not appear as competing completion logic.

### 9.3 Project type

Current types:

- growth
- life_story
- career
- parenting
- relationships
- travel
- hobby
- learning
- custom

Legacy readable types:

- emotion
- yearly

Changing Project type:

- preserves Records
- preserves existing Chapters/Manuscript
- updates future guidance
- updates readiness snapshot thresholds
- must not relock a Book that already has `ready_at`

---

## 10. Story Readiness

### 10.1 Rule source

Primary runtime implementation:

`src/utils/bookReadiness.ts`

Weights:

- elapsed time: 35%
- Record volume: 65%

Unlock:

- minimum days AND minimum records
- OR existing `projects.ready_at`

The score itself does not unlock a Book.

### 10.2 Rules

| Type | Minimum | Target |
|---|---:|---:|
| growth | 60d + 30 | 90d + 40 |
| life_story | 90d + 40 | 180d + 60 |
| career | 60d + 30 | 90d + 40 |
| parenting | 30d + 30 | 90d + 45 |
| relationships | 30d + 25 | 90d + 40 |
| travel | 7d + 10 | 15d + 15 |
| hobby | 30d + 20 | 60d + 30 |
| learning | 30d + 20 | 90d + 35 |
| custom | 30d + 20 | 60d + 30 |
| legacy emotion | 30d + 20 | 60d + 30 |
| legacy yearly | 60d + 30 | 100d + 40 |

### 10.3 Project snapshot

Projects store readiness threshold snapshots:

- readiness_min_days
- readiness_min_records
- readiness_target_days
- readiness_target_records
- readiness_policy_version

This prevents future global policy changes from silently changing existing Books.

### 10.4 Known persistence gap

If the date threshold becomes satisfied solely because time passes, with no subsequent mutation, frontend can calculate Ready while `ready_at` remains null.

Required follow-up:

- persist first Ready transition safely
- once Ready, never regress to locked state

---

## 11. Record Domain

### 11.1 Modes

Each Record chooses mode independently:

- question
- free
- photo

Project-level `record_mode` is legacy compatibility only.

### 11.2 Input validation

Current UI rules:

- question: 10–2000 chars
- free: 10–5000 chars
- photo: photo required + caption 1–100 chars

Open before launch:

- free Record title max length
- photo max bytes / dimensions
- Chapter title/body max lengths

### 11.3 Record numbering

Current implementation:

1. query latest `record_number`
2. calculate max + 1
3. insert

Risk:

- concurrent writes can race

Target:

- atomic DB-side sequence/transaction/RPC or retry on uniqueness violation

### 11.4 Drafts

One draft per:

`user_id + project_id + mode`

API:

- saveDraft → upsert
- loadDraft
- deleteDraft

Question draft preserves questionText so re-entry does not silently replace the prompt.

### 11.5 Photo Storage

Bucket:

`record-photos`

Current object path:

`{user_id}/{project_id}/{uuid}.{ext}`

Delete Record flow:

1. read photo path
2. delete DB Record
3. remove Storage object when path exists

Photo replacement/orphan behavior requires E2E verification.

---

## 12. Record Analysis

### 12.1 Trigger model

After create/update Record:

- Record save is completed first
- client invokes `analyze-record` asynchronously
- failure is swallowed intentionally
- Record save must never be rolled back because analysis failed

### 12.2 Stored analysis

`record_analysis` stores:

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

One analysis per Record via upsert on `record_id`.

### 12.3 AI policy

Analysis may only derive information grounded in the original Record.

If uncertain:

- empty arrays
- null

No invented people, places, events, causes, or emotions.

### 12.4 Known operational gap

No first-class analysis job status/retry queue currently exists.

Target later:

- pending / success / failed
- retry/reprocess
- observability for repeated failure

---

## 13. AI Question / Freewriting Hint

### 13.1 generate-question

Current server behavior:

- JWT required
- validates Project ownership
- reads subscription
- Free monthly shared quota with freewriting_hint
- quota threshold currently 10
- reads up to 5 recent Records/questions
- Gemini-generated question
- fallback supported
- writes `ai_usage(feature=question)`

There is no daily-question cache in the current flow.

### 13.2 generate-freewriting-hint

- JWT required
- validates Project ownership
- shares Free monthly AI quota with question
- reads recent emotion context
- returns Gemini-generated or fallback hint
- writes `ai_usage(feature=freewriting_hint)`

### 13.3 Quota caution

The exact long-term AI edit/fair-use policy remains open in Product Decisions.

Do not generalize the current 10-request question/hint implementation into all future AI features.

---

## 14. Chapter Domain

### 14.1 Source relation

Primary relation:

`chapter_records(chapter_id, record_id, position, relevance_score)`

Legacy fields:

- `records.chapter_id`
- `chapters.record_ids[]`

are transitional compatibility only.

### 14.2 Chapter generation

`generate-chapter`:

- authenticated user
- Project ownership validation
- considers all non-draft Records
- removes Records already assigned through `chapter_records`
- minimum unassigned material: 3 Records
- semantic clustering, not fixed 10-record buckets
- when many Records exist, uses analysis metadata to select a coherent cluster
- typical target cluster: 5–12 Records
- generates chapter title/content
- inserts Chapter
- inserts `chapter_records`
- then updates legacy `records.chapter_id` for compatibility
- inserts chapter_complete notification
- writes `ai_usage(feature=chapter)`

If relation insert fails after Chapter insert, the function deletes the newly created Chapter.

### 14.3 Chapter regeneration

`regenerate-chapter`:

- validates Chapter ownership
- reads source Record IDs from `chapter_records` ordered by position
- regenerates from original Record content
- updates `ai_content`
- clears `user_content`
- may update title
- writes `ai_usage(feature=chapter_regenerate)`

Original Records remain unchanged.

### 14.4 Chapter edit

User edit writes:

- title
- user_content

Display rule:

`user_content ?? ai_content`

### 14.5 Reorder

Current client reorder performs sequential updates:

1. temporary chapter_number offset
2. final sort_order / chapter_number updates

Risk:

- non-atomic partial update if network failure occurs midway

Target:

- server transaction/RPC for reorder

---

## 15. Manuscript Workflow

Manuscript is not a duplicate content table.

It is a workflow over Chapter content.

Source:

- Chapter order
- display content per Chapter

Current gap:

- Workspace infers “manuscript complete” when all Chapter display content exists
- this does not prove user review action

Target GAP-005:

Add persistent workflow milestones to `projects`:

- `manuscript_reviewed_at timestamptz null`
- `final_review_completed_at timestamptz null`

Rules:

- Manuscript screen explicit completion action sets `manuscript_reviewed_at`
- Final Review completion sets `final_review_completed_at`
- editing relevant upstream content may require explicit policy on whether milestone resets
- Workspace stage status reads persisted milestone rather than content existence

This target requires the next DB migration after current applied set.

---

## 16. Cover

Persistent selection:

`projects.selected_cover_id`

Fallback legacy field:

`cover_template_id`

Flow:

1. load persisted selection if present
2. preview selected template
3. Free/Pro entitlement check
4. update `selected_cover_id`
5. Final Review requires persisted cover

Pro templates exist.

AI-generated custom cover remains post-MVP.

---

## 17. Publication v2

### 17.1 Source of truth

`publications`

Legacy:

`published_books`

must not drive new UI state.

### 17.2 Immutable version model

Each publish creates a versioned publication:

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
- error fields
- created_at
- published_at

Status:

- processing
- published
- failed

### 17.3 Free / Pro enforcement

Server `generate-pdf` rechecks subscription.

Free:

- if published publication count = 0 → first publish allowed
- if count >= 1 → `PUBLICATION_LIMIT`

Pro:

- repeated publication allowed

Client checks are UX only; server is authoritative.

### 17.4 Version allocation

Version:

`latest published version + 1`

If the same next version exists in `failed` state, retry reuses that failed publication row instead of consuming a new version number.

### 17.5 Snapshot

Before PDF creation, publication stores:

- title
- subtitle
- author
- cover template
- TOC

Final cover snapshot may also persist generated tagline.

### 17.6 PDF Storage

Bucket:

`published-pdfs`

Path:

`{user_id}/{project_id}/v{version}.pdf`

This path must remain version-specific.

### 17.7 Viewer

Publication Viewer:

- fetch by publication ID
- filter by current user
- require `status=published`
- create one-hour signed URL
- render/download PDF externally

### 17.8 Transitional Project flags

`generate-pdf` currently also updates:

- `cover_template_id`
- `selected_cover_id`
- `is_completed=true`

These remain compatibility updates until all UI reads are migrated to `publications`.

Library and Workspace have already been moved toward publication-derived state. Home Published state remains a planned code gap.

---

## 18. Free / Pro Entitlement

Primary policy document:

`06_FREE_PRO_POLICY.md`

Current core rules:

### Free

- 1 Book
- recording
- question/hint with quota + fallback
- Story Readiness
- first Book chapter/manuscript
- default cover
- Final Review
- first PDF publication once
- Library / published book access

### Pro

- multiple Books
- repeated publications
- expanded AI
- Pro cover templates
- future AI cover

### Project limit

Client hook:

`useProjectLimit()`

Current:

- Pro → create allowed
- Free + project count < 1 → create allowed
- otherwise Paywall

Server-side project creation entitlement should eventually be enforced independently from client UI.

### Current displayed price

`월 5,900원`

Product ID:

`mychapter_pro_monthly`

Price must remain synchronized with actual store configuration.

---

## 19. Billing

### 19.1 Client bridge

Native billing expects:

`window.MyChapterBilling.purchase(productId)`

Web production:

- billing unavailable
- UI should instruct user to pay in mobile app

Development can use dev purchase token only in dev / explicit billing dev mode.

### 19.2 Verification

Client calls `verify-subscription` with:

- purchase_token
- product_id
- optional order_id

Server response updates entitlement; client then refreshes subscription state.

Detailed server contract belongs in `14_API_SPEC.md`.

---

## 20. Notifications

### 20.1 In-app notifications

Types:

- daily_question
- badge
- chapter_complete

Client:

- list newest first
- unread count
- mark one read
- mark all read
- follow optional link

### 20.2 Badge notifications

Current client checks streak/Record count milestones after Record save.

Duplicate prevention currently checks existing notification title.

This is operationally simple but title-based deduplication is weaker than a dedicated badge key.

### 20.3 Reminder

`send-daily-reminder` is deployed for reminder delivery.

Push/FCM end-to-end still requires device and environment verification.

---

## 21. Account Deletion

Client requires exact confirmation phrase:

`계정 삭제`

Then calls `delete-account`.

Server cleanup currently:

1. authenticate user
2. verify `confirm`
3. collect Record photo paths
4. remove `record-photos`
5. collect v2 publication PDF paths
6. also collect legacy `published_books.pdf_url`
7. remove `published-pdfs`
8. `auth.admin.deleteUser(user.id)`
9. public rows cascade

Acceptance requires real E2E proving Auth + DB + both Storage buckets are cleaned.

---

## 22. Database Domains

Current relevant public tables:

- users
- projects
- records
- record_drafts
- record_analysis
- chapters
- chapter_records
- publications
- subscriptions
- ai_usage
- notifications
- device_tokens

Transitional/legacy:

- daily_questions
- published_books
- records.chapter_id
- chapters.record_ids
- project routine/completion compatibility fields

Legacy removal must wait until real production E2E passes.

---

## 23. RLS / Security

### 23.1 Principle

All user-owned data tables keep RLS enabled.

Client must never rely on hidden UI as authorization.

Ownership must be checked:

- directly by `user_id`, or
- through Project ownership where appropriate

### 23.2 Edge Function pattern

Protected Edge Functions:

1. require Authorization header
2. create user-scoped Supabase client
3. call `auth.getUser()`
4. resolve authenticated user
5. validate Project/Record/Chapter ownership
6. use service role only after ownership is established
7. recheck entitlement for paid/protected operations

### 23.3 Current security state

Latest Supabase security advisor check: no security warnings.

Performance advisories remain, especially older RLS initplan patterns / unused indexes. Treat as optimization debt unless correctness is affected.

---

## 24. Storage

### 24.1 Buckets

`record-photos`

- user Record images

`published-pdfs`

- immutable versioned PDFs

### 24.2 Signed URLs

Both private media types are expected to be served using signed URLs.

Current PDF signed URL lifetime:

- 3600 seconds

### 24.3 Cleanup rule

Deletion must remove Storage object in addition to DB row where relevant.

Do not assume database cascade deletes Storage.

---

## 25. Client API Layer

Current `src/lib/api/` modules:

| Module | Responsibility |
|---|---|
| projects.ts | list/create/update Book, cover selection |
| records.ts | CRUD, photo storage, post-save badge/analyze trigger |
| drafts.ts | mode-specific draft persistence |
| chapters.ts | list/get/count/generate/edit/reorder/regenerate |
| questions.ts | AI question + fallback |
| hints.ts | freewriting hint + fallback |
| books.ts | publication query, permission, PDF function call, signed URL |
| subscriptions.ts | plan read / purchase verification |
| notifications.ts | list/read/badge creation |
| users.ts | nickname/profile/notification settings |
| account.ts | account delete Edge Function |

Rule:

- pages should not duplicate raw Supabase domain queries when an API module already owns the operation
- entitlement-sensitive actions require server enforcement
- repeated multi-step domain updates should move to RPC/Edge Function when atomicity matters

---

## 26. Error Handling Standard

UI target state matrix is defined in `05_SCREEN_SPEC.md`.

All API-backed flows should distinguish:

- loading
- empty
- recoverable error + retry
- ownership/permission failure
- entitlement failure
- success

Known error codes used today:

- `AI_LIMIT`
- `NOT_ENOUGH_MATERIAL`
- `PUBLICATION_LIMIT`
- `PDF_PRO_ONLY` compatibility handling
- generic generate/update failures

Requirements:

- AI helper failure must not block original Record creation
- publication failure must preserve retryable failed version
- ownership failure must not expose existence/content of another user's resource
- error UI should not silently swallow user-action failures except intentionally non-blocking derived work such as record analysis

---

## 27. Environment / Secrets

### 27.1 Client-exposed variables

Typical client variables include:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- legal document URLs
- optional billing dev-mode flag
- optional local dev bypass flag

Rules:

- only public/anon-safe values may use `VITE_*`
- service role / AI secrets must never be exposed to client bundles

### 27.2 Edge Function secrets

Current AI helper expects:

- `GOOGLE_AI_API_KEY`

Protected functions also use Supabase runtime values/service role.

Exact secret inventory should be maintained in deployment documentation without recording secret values.

---

## 28. Deployment

### 28.1 Frontend

`npm run build`:

1. TypeScript build
2. Vite production build

Vercel deploy verifies frontend build only.

### 28.2 Supabase

Git commit does **not** deploy Edge Functions automatically.

Any Edge Function change requires explicit Supabase deploy.

DB DDL must be applied via numbered migration.

### 28.3 Migration rule

For schema changes:

1. add migration file
2. apply migration to Supabase
3. verify schema
4. update `src/types/database.ts`
5. rerun security advisor
6. inspect performance advisor
7. update DB/cutover docs
8. run affected flow E2E

Next planned schema work for GAP-005:

- `manuscript_reviewed_at`
- `final_review_completed_at`

---

## 29. Android / Native

Current shell:

- Capacitor Android
- app ID: `com.mychapter.app`
- Push Notifications
- Camera/Share dependencies available

Open production integration checks:

- native OAuth callback routing
- actual billing native bridge
- FCM device token / real notification delivery
- Android back behavior on modal/editor flows
- Play Console release flow

Do not treat web success as proof of native success.

---

## 30. Build / Validation Commands

Current npm scripts:

```bash
npm run dev
npm run build
npm run preview
npm run cap:sync
npm run cap:android
npm run cap:run:android
```

Minimum change acceptance:

- TypeScript build passes
- Vite build passes
- affected route renders
- no production DEV bypass
- migration/function deploy verified where applicable

---

## 31. Current Implementation Gaps

Source:

`SCREEN_IMPLEMENTATION_GAP.md`

### P0

Resolved:

- broad onboarding guard
- onboarding notification persistence failure
- public Legal routes
- Library/Workspace publication source migration

Open:

- GAP-005 workflow milestone persistence

### P1

Open:

- Published Home
- native OAuth callback semantic alignment
- Notifications error/retry
- general API loading/error consistency
- Legal loading/error fallback
- unresolved input limits
- full direct URL ownership/stage guard regression

### P2

- accessibility verification
- defer planned/non-MVP scope

Operational:

- Supabase is currently active again, so real E2E can proceed after required code/schema work.

---

## 32. Technical Debt / Risk Register

| Risk | Current behavior | Target |
|---|---|---|
| workflow milestone | inferred/local | DB persisted timestamps |
| ready_at | may remain null if only time passes | persist first-ready transition |
| record_number | client max+1 | atomic server allocation |
| Chapter reorder | multiple sequential updates | DB transaction/RPC |
| Record analysis | fire-and-forget | status + retry |
| API errors | uneven catch/retry UI | common state standard |
| project creation entitlement | client-oriented check | server recheck |
| legacy DB fields | still written/read for compatibility | remove after E2E |
| DB TS types | hand-maintained | generated/reconciled later |
| Native OAuth | different callback | same routing semantics |
| legal content | iframe-only | load/error fallback |
| image constraints | open | explicit launch limits |

---

## 33. Required Development Order

Current recommended execution:

1. GAP-005 workflow milestone migration + UI persistence
2. GAP-006 Published Home
3. error-state standardization
4. input limits + direct URL/resource guards
5. accessibility/mobile QA
6. real Email Auth E2E
7. Record + analysis E2E
8. controlled Readiness E2E
9. Chapter / chapter_records E2E
10. Manuscript → Cover → Final Review E2E
11. Free publication v1
12. Pro publication v2 / retry
13. deletion + multi-account RLS E2E
14. OAuth provider finalization
15. Android/FCM/Billing final verification
16. legacy cleanup only after all above pass

---

## 34. Definition of Done — MVP Development

MY CHAPTER MVP development is complete only when all of the following pass with real Supabase data:

- real user signup/login
- trigger-created profile + Free subscription
- onboarding persistence
- Book creation
- all 3 Record modes
- draft restore
- asynchronous record analysis
- Readiness before/after state
- semantic Chapter generation
- chapter_records integrity
- Chapter edit/regenerate/reorder recovery
- persisted Manuscript review completion
- persisted Final Review completion
- Cover persistence
- Free publication v1
- immutable Publication Viewer
- Pro v2 republish
- failed publish retry without version skip
- Free second Book / republish paywall
- photo/PDF cleanup
- account deletion
- cross-account ownership isolation
- direct URL guards
- 320/375/414/768 responsive QA
- production build/deploy
- OAuth / Native final checks for launch target

---

## 35. Non-MVP / Do Not Build Yet

Until current P0/P1 and E2E complete:

- AI Record Edit Result screen
- exact AI edit fair-use expansion
- AI-generated cover
- EPUB
- POD / external bookstore
- broad new product modules

Do not expand scope to hide incomplete core workflow verification.

---

## 36. References

- `00_PRODUCT_OVERVIEW.md`
- `01_PRODUCT_SPEC.md`
- `02_PRODUCT_DECISIONS.md`
- `03_IA.md`
- `04_USER_FLOWS.md`
- `05_SCREEN_SPEC.md`
- `06_FREE_PRO_POLICY.md`
- `07_ARCHITECTURE.md`
- `08_DB_V2_DESIGN.md`
- `09_AI_POLICY.md`
- `10_DESIGN_SYSTEM.md`
- `11_MVP_SCOPE.md`
- `12_DB_V2_CUTOVER_CHECKLIST.md`
- `SCREEN_IMPLEMENTATION_GAP.md`

---

## 37. Change Log

| Version | Date | Summary |
|---|---|---|
| 2.0 | 2026-10-16 | Current code/Supabase-based development spec rebuilt; replaces deprecated 2026-06 development specification |
