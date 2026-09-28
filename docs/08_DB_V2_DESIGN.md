# 08. DB v2 Design

**Status:** STRUCTURE CONFIRMED — migrations prepared, NOT deployed  
**Updated:** 2026-09-28

> Migrations `009`–`013` are prepared in GitHub but have not been applied to Supabase. Apply them before deploying the new `analyze-record` and semantic `generate-chapter` Edge Functions.

## Why v2 is needed

Current schema still contains assumptions from an earlier routine/journal product.

Major issues:

1. `projects.target_count` progress conflicts with Story Readiness.
2. `projects.record_mode` conflicts with per-record mode selection.
3. `daily_questions UNIQUE(project_id, question_date)` assumes one question per day.
4. chapter relationship is duplicated by `records.chapter_id` and `chapters.record_ids[]`.
5. chapters are currently generated in fixed 10-record buckets.
6. `published_books.project_id UNIQUE` cannot preserve publication history/version.
7. no persisted structured record analysis.
8. `is_completed` is too coarse for book workflow/publication semantics.

## Proposed domain model

```text
users
  │
  ├── projects
  │    ├── records
  │    │    ├── record_analysis
  │    │    └── record_drafts
  │    │
  │    ├── chapters
  │    │    └── chapter_records ── records
  │    │
  │    ├── cover_assets
  │    └── publications
  │
  ├── subscriptions
  ├── ai_usage
  ├── notifications
  └── device_tokens
```

## 1. users

Keep core fields:

- id
- nickname
- profile avatar/emoji
- notification_enabled
- notification_time
- onboarding_completed
- created_at
- updated_at

## 2. projects

Proposed:

```text
id uuid pk
user_id uuid fk
type project_type
title text
subtitle text nullable
author_name text nullable

started_at date
ready_at timestamptz nullable
archived_at timestamptz nullable

readiness_min_days int
readiness_min_records int
readiness_target_days int
readiness_target_records int
readiness_policy_version int

selected_cover_id text nullable

created_at
updated_at
```

### Remove / reconsider

- `record_mode` → REMOVE
- `is_completed` → REMOVE; derive from publications or explicit workflow fields
- `target_count` → REMOVE after compatibility cutover
- `frequency` → REMOVE after compatibility cutover
- `target_date` → REMOVE after compatibility cutover
- per-project `notification_time` → REMOVE after compatibility cutover; user-level notification setting remains

### Why snapshot readiness rules

Store readiness thresholds on Project creation so future policy changes do not silently move an existing user’s unlock target.

## 3. records

Proposed:

```text
id
project_id
user_id
record_number
mode
question_text
title
content
photo_url
emotion_tags[]
is_draft
occurred_at nullable
created_at
updated_at
```

Original record remains immutable in meaning even if editable by user.

## 4. record_analysis

New.

```text
id
record_id unique
project_id
user_id

summary
themes jsonb
people jsonb
places jsonb
emotions jsonb
events jsonb
conflict text nullable
change text nullable
insight text nullable
goals jsonb

model text
schema_version int
analyzed_at
updated_at
```

Rationale:

- personalized questions
- semantic chapter clustering
- future Story Graph
- readiness-quality signals later

## 5. record_drafts

Keep.

One draft per:

```text
user + project + mode
```

Review photo-draft behavior because local File objects cannot be persisted directly in JSON.

## 6. chapters

Proposed:

```text
id
project_id
user_id
chapter_number
sort_order
title
ai_content
user_content
is_complete
generation_version
created_at
updated_at
```

Remove:

- `record_ids uuid[]`

## 7. chapter_records

New many-to-many relation.

```text
chapter_id
record_id
position
relevance_score nullable
created_at

PK (chapter_id, record_id)
UNIQUE (chapter_id, position)
```

This supports semantic regrouping and prevents duplicated relationship state.

Confirmed relation policy:

- DB allows one record to relate to multiple chapters through the relation table.
- Current AI composition should avoid unnecessary duplication.
- Legacy one-record-one-chapter fields remain only during migration.

## 8. cover_assets

Proposed optional table.

```text
id
project_id
user_id
kind          -- template | ai | upload
template_id
storage_path
prompt nullable
metadata jsonb
created_at
```

MVP can continue with template IDs without requiring this table immediately. Add only if AI/custom covers enter scope.

## 9. publications

Replace `published_books`.

```text
id
project_id
user_id
version int
status publication_status

title_snapshot
subtitle_snapshot nullable
author_snapshot
cover_snapshot jsonb
toc_snapshot jsonb

pdf_path nullable
epub_path nullable
page_count nullable

error_code nullable
error_message nullable

created_at
published_at nullable
```

Constraint:

```text
UNIQUE(project_id, version)
```

Do **not** use `UNIQUE(project_id)`.

Publication should preserve the book as it existed when published.

## 10. subscriptions

Keep current direction.

Future optional fields:

- provider
- product_id
- purchase status
- last_verified_at

## 11. ai_usage

Keep but consider richer accounting:

```text
feature
project_id
record_id nullable
chapter_id nullable
model nullable
input_tokens nullable
output_tokens nullable
estimated_cost nullable
created_at
```

This supports fair-use rather than arbitrary client-side counters.

## 12. notifications / device_tokens

Keep.

Notification link should ideally include enough context to restore the correct Project.

## Tables proposed for removal

- `daily_questions`

Reason: question is per record/session, not strictly per calendar day.

Generated question can live in draft while writing and `records.question_text` after save.

## Migration strategy

Do not rewrite old migrations.

Prepared:

```text
009_db_v2_foundation.sql
010_record_analysis.sql
011_chapter_records.sql
012_publication_versions.sql
013_rls_v2.sql
```

Backfill for chapter relationships and existing published books is included in `011` and `012`. A later cleanup migration will remove legacy columns/tables only after application code has fully cut over.

## Backfill concerns

Prepared backfill covers:

- readiness policy snapshots on existing projects
- existing `chapters.record_ids[]` → `chapter_records`
- existing `records.chapter_id` relationships missing from arrays
- existing `published_books` → `publications version=1`
- existing cover template IDs inside publication snapshots

Legacy `is_completed` remains until publication-query cutover.

## RLS v2 principle

For child tables, verify ownership through project/book relation.

Do not trust a user-supplied `user_id` alone.

## Indexes

Minimum candidates:

- projects(user_id, created_at desc)
- records(project_id, created_at desc)
- record_analysis(project_id)
- chapters(project_id, sort_order)
- chapter_records(chapter_id, position)
- chapter_records(record_id)
- publications(user_id, published_at desc)
- publications(project_id, version desc)
- ai_usage(user_id, created_at)
