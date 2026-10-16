# 14. API Specification

**Document Version:** 0.1
**Status:** WORKING / SOURCE-AUDITED PARTIAL BASELINE
**Updated:** 2026-10-16
**Scope:** MY CHAPTER client data API, Supabase Edge Functions, authorization and response contracts

> This is a source-audited initial contract inventory, not a claim of completed production E2E verification. It is subordinate to `02_PRODUCT_DECISIONS.md`, `01_PRODUCT_SPEC.md`, `05_SCREEN_SPEC.md`, `06_FREE_PRO_POLICY.md`, and `13_DEVELOPMENT_SPEC.md`. Do not infer a public REST endpoint from a client function name. Do not treat old lower-case June API documents as current.

## 1. Transport and ownership

- Client persistence uses `@supabase/supabase-js`: Supabase Auth, PostgREST tables, Storage, and `supabase.functions.invoke`.
- Edge Functions run privileged operations server-side, authenticate Bearer users, verify ownership independently, and use a service-role client only after authentication/authorization.
- Database RLS is a mandatory second boundary for ordinary client queries; caller-supplied `userId` is not proof of authorization.
- `isDevBypass()` paths invoke mocks and are **not** production verification.
- Failed derived AI analysis must not undo a successfully saved original Record.
- Error JSON currently varies by function, typically `{ error: string, code?: string }`; a unified envelope is a **target**, not current fact.
- Tables and columns are documented in `15_DATA_DICTIONARY.md` after schema reconciliation.

## 2. Client API inventory (verified exported names)

| Module | Exported operations | Persistence / contract |
|---|---|---|
| `projects.ts` | `getProjects`, `getProjectCount`, `createProject`, `getProjectById`, `updateProjectSettings`, `updateProjectCoverSelection` | `projects` |
| `records.ts` | `getNextRecordNumber`, `listRecords`, `getRecord`, `getRecordCount`, `createRecord`, `updateRecord`, `deleteRecord`, `uploadRecordPhoto`, `getPhotoSignedUrl` | `records`, `record-photos`; `analyze-record` invoked after save |
| `chapters.ts` | `listChapters`, `getChapter`, `getChapterRecordCountMap`, `getUnassignedRecordCount`, `updateChapterContent`, `generateChapter`, `reorderChapters`, `regenerateChapter` | `chapters`, `chapter_records`, generate/regenerate functions |
| `books.ts` | `getPublishedBook`, `listPublishedBooks`, `getPublishedBookById`, `getPublishedBookSignedUrl`, `canPublishBook`, `prepareBookExport`, `buildBookHtml`, `downloadBookHtml`, `generateBookPdf`, `downloadPdfFromUrl` | `publications`, `published-pdfs`, `generate-pdf` |
| `questions.ts` | `getFallbackQuestion`, `generateQuestion` | `generate-question`, fallback |
| `drafts.ts` | `saveDraft`, `loadDraft`, `deleteDraft` | `record_drafts` |
| `subscriptions.ts` | `getSubscriptionPlan`, `getSubscription`, `verifyPurchase` | `subscriptions`, `verify-subscription` |
| `users.ts` | `updateNickname`, `updateProfileEmoji`, `updateNotificationSettings` | `users` |
| `account.ts` | `deleteAccount` | `delete-account` |
| `hints.ts` | `getFallbackHint`, `generateFreewritingHint` | `generate-freewriting-hint`, fallback |
| `notifications.ts` | `listNotifications`, `getUnreadCount`, `markAsRead`, `markAllRead`, `createBadgeNotifications` | `notifications` |
| `deviceTokens.ts` | `upsertDeviceToken`, `removeDeviceToken` | device token persistence |

Export names and primary integrations checked against `src/lib/api/*.ts` on `main`. Exact argument/return schemas for unexpanded modules remain **AUDIT PENDING**. An exported client function is not necessarily a wire-level network endpoint.

## 3. Verified client contracts

### 3.1 Projects

- `getProjects(userId: string): Promise<Project[]>`: fetch own `projects` newest-first.
- `getProjectCount(userId: string): Promise<number>`: exact count.
- `createProject(userId, draft): Promise<Project>`: requires `draft.type` and nonblank `draft.title`; currently writes compatibility routine columns including target count/frequency. Those legacy columns **must not** drive Story Readiness.
- `getProjectById(projectId): Promise<Project | null>`.
- `updateProjectSettings(projectId, userId, { title, type }): Promise<Project>`: updates Story Readiness policy snapshot; do not reset an existing `ready_at`.
- `updateProjectCoverSelection(projectId, userId, coverId): Promise<Project>`: writes `selected_cover_id`.
- **TARGET GAP-005 (not implemented):** explicit manuscript/final-review milestone update operations with ownership verification, persisted timestamps, refresh restoration and Workspace consumption.

### 3.2 Records

`CreateRecordInput`:
```ts
{
  projectId: string; userId: string; mode: RecordModeInstance;
  content: string; questionText?: string; title?: string;
  photoUrl?: string; emotionTags: string[];
}
```
`UpdateRecordInput`:
```ts
{
  content?: string; title?: string; photoUrl?: string;
  emotionTags?: string[]; questionText?: string;
}
```
`SaveRecordResult`:
```ts
{ record: JournalRecord; recordCount: number; streak: number; badgeTitles: string[] }
```

- `createRecord`: inserts original record, then asynchronously invokes `analyze-record` with `{record_id}`; analysis errors do not roll back original save.
- `updateRecord`: updates original record, then schedules same analysis.
- `getNextRecordNumber`: currently `max(record_number) + 1`; **concurrent race risk, not atomic**.
- `deleteRecord`: removes matching user record and attempts corresponding `record-photos` object removal.
- `uploadRecordPhoto`: Storage path `{userId}/{projectId}/{uuid}.{extension}`.
- `getPhotoSignedUrl`: signed read URL TTL **3600 seconds**.
- Record field limits and photo launch policy follow `13_DEVELOPMENT_SPEC.md`; client validation does not replace DB/RLS enforcement.

### 3.3 Chapters

- `listChapters(projectId)`: ascending `sort_order`.
- `getChapter(id)`: nullable.
- `getChapterRecordCountMap(projectId)`: counts relations using `chapter_records`.
- `getUnassignedRecordCount(projectId)`: excludes assigned records using `chapter_records`.
- `updateChapterContent(chapterId, title, userContent)`: writes `title` and `user_content`; original Records unchanged.
- `generateChapter(projectId)`: invokes `generate-chapter` with `{project_id: projectId}`, expects `chapter_id`, refetches created Chapter.
- `regenerateChapter(chapterId)`: invokes `regenerate-chapter` with `{chapter_id: chapterId}`, then refetches.
- `reorderChapters(projectId, orderedChapterIds)`: two loops of separate updates; **non-atomic**.
- `ChapterApiError.code`: special handling `NOT_ENOUGH_MATERIAL`, default `CHAPTER_GENERATE_FAILED`.
- Chapter formation is **semantic**; there is **no** fixed N-record automatic creation.

### 3.4 Publications / PDF

- `getPublishedBook(projectId)`: highest published version.
- `listPublishedBooks(userId)`: all own `published` versions newest-first.
- `getPublishedBookById(userId, publicationId)`: single owned published version.
- `generateBookPdf(projectId, coverTemplateId)` invokes `generate-pdf`:
```json
{"project_id":"<project UUID>","cover_template_id":"cover_01"}
```
Successful Edge Function JSON:
```json
{"publication_id":"<UUID>","version":1,"pdf_url":"<short-lived signed URL>","storage_path":"<user>/<project>/v1.pdf","page_count":12}
```
Client maps this to:
```ts
{ publicationId: string; version: number; pdfUrl: string; storagePath: string; pageCount: number }
```
- `generate-pdf` authenticates user, checks owned Project, ensures Chapters exist and enforces server-side Free publication allowance. A non-Pro user with at least one successfully published PDF receives **HTTP 402**, `code: "PUBLICATION_LIMIT"`.
- First Free PDF is allowed; republishing and additional books are Pro-gated per current product policy.
- `publications` rows transition `processing → published | failed`, versioned by Project. Failed intended versions can be retried. Published snapshots are immutable logical outputs; **do not** treat mutable Project data as publication history.
- PDF Storage bucket: `published-pdfs`, key `{user_id}/{project_id}/v{version}.pdf`. Signed URL TTL **3600 seconds** in the current generator.
- `pdf_url` is ephemeral. Persist `pdf_path` / publication ID, **not** a signed URL.
- Transitional `projects.is_completed` write remains in the Edge Function but is **not** the publication SoT.
- Known consideration: latest-published+1 and retry lookup are separate steps; verify concurrent publish idempotency in QA.

## 4. Edge Function contract inventory

The repository contains these functions:

| Edge Function | Current client invocation / trigger | Payload audit |
|---|---|---|
| `analyze-record` | async after original Record create/update | **VERIFIED** |
| `generate-chapter` | `generateChapter` | **PARTIALLY VERIFIED** |
| `regenerate-chapter` | `regenerateChapter` | client verified; response audit pending |
| `generate-pdf` | `generateBookPdf` | **VERIFIED** |
| `generate-question` | `generateQuestion` | full request/response audit pending |
| `generate-freewriting-hint` | `generateFreewritingHint` | full request/response audit pending |
| `verify-subscription` | `verifyPurchase` | billing validation audit pending |
| `delete-account` | `deleteAccount` | deletion contract audit pending |
| `send-daily-reminder` | server/push workflow | schedule and authorization audit pending |

**Verified `analyze-record`**:
- Request `{ "record_id": "<UUID>" }`, authenticated Bearer user required.
- Returns 401 unauthenticated, 400 missing `record_id`, 404 record/project inaccessible.
- Successful `{ "success": true, "analysis": { ... } }`; analysis contains `summary`, `themes`, `people`, `places`, `emotions`, `events`, `conflict`, `change`, `insight`, `goals`, `model`, `schema_version`, timestamps and ownership IDs.
- Uses `record_analysis` upsert on conflict `record_id`; preserves original Records.

**Verified `generate-chapter` client response**:
- Request `{ "project_id": "<UUID>" }`.
- Response includes `chapter_id` on success; an `NOT_ENOUGH_MATERIAL` code maps to recoverable UX. Server also returns chapter metadata and selected source count.
- Normalized source-record membership belongs in `chapter_records`.

## 5. Authorization and error behavior

1. Every user-visible row must be scoped to the authenticated principal through RLS and/or explicit ownership validation.
2. Every privileged Edge Function must authenticate the token **before** privileged table reads/writes; reject cross-user project/record/publication IDs.
3. Free/Pro restrictions must be validated server-side where the operation uses service-role privileges.
4. Failure to generate AI-derived content must not remove the source Record.
5. Never print access tokens, service-role keys, signed URLs or user diary contents to logs.
6. Validate unauthorized, nonexistent, cross-owner, free-limit, empty-input and retry cases in `16_QA_E2E.md`.

## 6. GAP-005 proposed API contract (TARGET; **NOT IMPLEMENTED**)

Prefer one owned Project update transaction or two narrowly scoped mutations rather than client-only checkboxes:

```ts
completeManuscriptReview(projectId: string): Promise<Project>
completeFinalReview(projectId: string): Promise<Project>
```

Persist `projects.manuscript_reviewed_at` and `projects.final_review_completed_at` as `timestamptz nullable`; server/database authorization must guarantee current user owns Project. Workspace must read actual timestamps after reload. Manuscript and Final Review completion must **not** imply Publication success. If upstream content changes after review, define invalidation semantics in Product Decisions before implementing automatic clearing.

## 7. Remaining source audit before CURRENT

- Read the full request/response branches of `generate-question`, `generate-freewriting-hint`, `regenerate-chapter`, `verify-subscription`, `delete-account`, and `send-daily-reminder`; document exact HTTP status/error codes, success DTO, fallback, rate/usage control, idempotency.
- Capture exported TypeScript signatures for unexpanded `users`, `drafts`, `questions`, `hints`, `deviceTokens`, `subscriptions`, `notifications`, `account`.
- Compare `src/types/database.ts` with **actually applied** Supabase migrations / schema; don't declare a target field CURRENT merely because it appears in a design.
- Verify RLS/storage policies and Production Free/Pro E2E.
- Reconcile any discovered gaps into `13_DEVELOPMENT_SPEC.md`, `SCREEN_IMPLEMENTATION_GAP.md`, and later `16_QA_E2E.md`.

**Status rule:** promote this document from WORKING to CURRENT only after the outstanding code/schema audit. No source code, migration, or production database change was made while creating this document.
