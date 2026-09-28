# 12. DB v2 Cutover Checklist

**Status:** DB V2 APPLIED / PRODUCTION E2E PENDING  
**Updated:** 2026-09-28

이 문서는 DB v2를 실제 Supabase 환경에 적용할 때의 순서를 고정한다.

## 0. Preconditions

Before deployment:

- current production database backup or point-in-time recovery confirmed
- Supabase CLI logged in to the correct project
- staging/dev project preferred for first application
- current Edge Function environment secrets verified
- no pending destructive migration

## 1. Apply additive migrations

**Completed on MyChapter Supabase.**

Applied in this order:

```text
009_db_v2_foundation.sql
010_record_analysis.sql
011_chapter_records.sql
012_publication_versions.sql
013_rls_v2.sql
```

These migrations are intentionally transitional:

- legacy project fields remain
- `chapters.record_ids` remains
- `records.chapter_id` remains
- `published_books` remains
- `daily_questions` remains

Do not drop legacy structures yet.

## 2. Verify backfill

Check:

- every existing Project has readiness snapshot fields
- `chapter_records` contains expected legacy chapter relationships
- every existing `published_books` row has `publications.version = 1`
- publication title/cover/TOC snapshots are populated
- RLS still permits normal owner reads/writes

## 3. Deploy Edge Functions

**Completed for current v2 functions.**

Deployed after migrations:

```text
analyze-record
generate-chapter
regenerate-chapter
generate-pdf
delete-account
```

Important:

- new `generate-chapter` requires `chapter_records`
- `analyze-record` requires `record_analysis`
- do not deploy those two before migrations 010/011

## 4. Smoke-test semantic chapter creation

Use a test Book that satisfies Story Readiness.

Verify:

1. no chapter is generated when a record is merely saved
2. chapter creation only begins from the Book workflow
3. selected records are semantically related rather than fixed first-10 buckets
4. `chapters.record_ids` and `chapter_records` both receive transitional data
5. source records remain unchanged
6. Free first Book is not blocked at chapter 4

## 5. Wire record analysis

After `analyze-record` is deployed:

- invoke analysis after successful record creation/update
- analysis failure must not fail the user's record save
- re-analysis may upsert by `record_id`
- generated questions/chapter clustering may then consume analysis data

## 6. Cut publication API to `publications`

**Implemented in source and Edge Function; Production E2E pending.**

Application publication reads/writes now use versioned `publications`.

Required behavior:

```text
first publish -> version 1
republish -> version 2
next republish -> version 3
```

Free entitlement:

- allow first published version
- later publication requires Pro

Published book viewer must open a specific publication ID/version.

Current PDF version path:

```text
published-pdfs/{user_id}/{project_id}/v{version}.pdf
```

## 7. Storage verification

Verify:

- record deletion removes its photo object
- account deletion removes record photos
- account deletion removes published PDFs
- future publication versions use unique paths, e.g.

```text
published-pdfs/{user_id}/{project_id}/v{version}.pdf
```

## 8. E2E regression

**Pending until the latest Production build is available without DEV mock data.**

Test these flows:

```text
new user
→ first Book
→ record
→ readiness
→ semantic chapter
→ manuscript
→ cover
→ final review
→ PDF publication
→ publication viewer
```

Also test:

- refresh with active Book
- logout/login with another user
- direct Book URLs
- API failure
- AI quota fallback
- Free second Book paywall
- Free republish paywall
- record/photo deletion
- account deletion

## 9. Legacy cleanup only after cutover

Create a later destructive migration only after all application code uses DB v2.

Candidates:

- `projects.record_mode`
- `projects.target_count`
- `projects.frequency`
- `projects.target_date`
- project-level `notification_time`
- `projects.is_completed`
- `chapters.record_ids`
- `records.chapter_id`
- `daily_questions`
- `published_books`

Do not remove these during the first DB v2 deployment.

## Rollback principle

Because 009–013 are additive/transitional, the old application model remains readable during first deployment.

If the new Edge Functions fail:

1. roll back Edge Function deployment
2. leave additive DB tables/columns in place
3. continue using legacy application paths
4. fix and redeploy
