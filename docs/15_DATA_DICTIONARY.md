# 15. Data Dictionary

**Document Version:** 0.1  
**Status:** WORKING / REPOSITORY-SCHEMA BASELINE  
**Updated:** 2026-10-16  
**Schema evidence:** `src/types/database.ts` and `supabase/migrations/001–014` (especially 009–014).  
**Limit:** Supabase remote introspection was not performed in this documentation pass; migrations and TS types are repository evidence, not independently verified live catalog state.

## 1. Domain model and sources of truth

```text
auth.users 1 ── 1 public.users
public.users 1 ── n projects (each Project is one Book)
projects 1 ── n records (original user-written material)
records 1 ── 0..1 record_analysis (derived AI metadata)
projects 1 ── n chapters (derived/editable book structure)
chapters n ── n records via chapter_records (normalized authoritative relation)
projects 1 ── n publications (versioned output snapshots)
users 1 ── n notifications, device_tokens, ai_usage
users 1 ── 0..1 subscriptions (application expectation; verify actual uniqueness)
projects 1 ── n record_drafts by per-mode unique key
```

**Authoritative model:** `projects` is the Book root; `records` preserve originals; `chapter_records` is Chapter↔Record relationship; `chapters.user_content ?? chapters.ai_content` is manuscript display; `publications` is versioned publication truth. `published_books`, `records.chapter_id`, `chapters.record_ids`, `projects.is_completed` and daily question cache are transitional/legacy and must not drive new workflows.

## 2. Field dictionary (current TypeScript Row types)

Types below use PostgreSQL-equivalent shorthand based on migrations and TS types: UUID, TEXT, INT, BOOLEAN, DATE, TIMESTAMPTZ, JSONB, TEXT[] and ENUM. Unless marked `?`, the TS Row type expects a value (which can still be nullable using `| null`).

### public.users

| Field | Type | Meaning |
|---|---|---|
| id | UUID PK | Auth user identity |
| nickname | TEXT nullable | onboarding nickname (2–10 characters per UX) |
| profile_emoji | TEXT | profile |
| notification_enabled | BOOLEAN | opt-in |
| notification_time | TIME / string | reminder preference; check base migration for exact SQL type |
| onboarding_completed | BOOLEAN | onboarding milestone |
| created_at, updated_at | TIMESTAMPTZ | lifecycle |

### public.projects — Book root

| Field | Type | Meaning |
|---|---|---|
| id | UUID PK | Book/Project ID |
| user_id | UUID FK users | Owner |
| type | project type enum | Book type and question direction |
| title | TEXT | mutable working title |
| subtitle, author_name | TEXT nullable | Book metadata |
| started_at | DATE | readiness elapsed-days anchor |
| ready_at | TIMESTAMPTZ nullable | **sticky** Story Readiness completion |
| archived_at | TIMESTAMPTZ nullable | Archive marker |
| readiness_min_days, readiness_min_records | INT nullable | minimum unlock gates, **both** required |
| readiness_target_days, readiness_target_records | INT nullable | scoring/progress targets |
| readiness_policy_version | INT | policy snapshot version |
| selected_cover_id | TEXT nullable | persisted Cover choice |
| manuscript_reviewed_at | TIMESTAMPTZ nullable **TARGET / ABSENT** | GAP-005 milestone; do not read until Migration 015 |
| final_review_completed_at | TIMESTAMPTZ nullable **TARGET / ABSENT** | GAP-005 milestone; do not read until Migration 015 |
| target_count, frequency, notification_time, record_mode, target_date | mixed | **LEGACY** routine setup |
| cover_template_id, is_completed | TEXT nullable / BOOLEAN | **LEGACY** Cover/published flags |
| created_at, updated_at | TIMESTAMPTZ | lifecycle |

**Constraint (Migration 009):** `projects_readiness_positive` requires positive minimums and targets at least minimums when minimum-days set. `set_project_readiness_defaults` fills initial snapshot columns. `records_mark_project_ready` stamps `ready_at` on record insertion or draft-state update when both gates hold. Known gap: elapsed-days-only transition without record write may leave `ready_at` null.

### public.records — original input

| Field | Type | Meaning |
|---|---|---|
| id | UUID PK | Record ID |
| project_id, user_id | UUID FK | parent Book and owner |
| record_number | INT | per-Book sequence; **current max+1 race risk** |
| mode | enum (`question`, `photo`, `free`) | per-Record mode |
| question_text, title | TEXT nullable | prompt/title |
| content | TEXT | user-authored original |
| photo_url | TEXT nullable | Storage object key, not permanent signed URL |
| emotion_tags | TEXT[] | selected tags |
| chapter_id | UUID nullable | **LEGACY** relationship |
| is_draft | BOOLEAN | legacy record flag; new per-mode drafts in `record_drafts` |
| created_at, updated_at | TIMESTAMPTZ | lifecycle |

### public.record_analysis — derived AI facts

| Field | Type | Meaning |
|---|---|---|
| id | UUID PK | row ID |
| record_id | UUID UNIQUE FK records ON DELETE CASCADE | one analysis per Record |
| project_id, user_id | UUID FK | owner context |
| summary | TEXT nullable | factual summary |
| themes, people, places, emotions, events, goals | JSONB (default `[]`) | extracted structured arrays |
| conflict, change, insight | TEXT nullable | only supported by actual original |
| model | TEXT nullable | model label |
| schema_version | INT default 1 | result schema |
| analyzed_at, updated_at | TIMESTAMPTZ | lifecycle |

**Critical:** AI outputs are derived and must never silently overwrite `records.content`. `analyze-record` upserts on `record_id`.

### public.chapters

| Field | Type | Meaning |
|---|---|---|
| id | UUID PK | Chapter ID |
| project_id, user_id | UUID FK | owning Book/user |
| chapter_number | INT | displayed chapter number |
| title | TEXT | editable title |
| ai_content | TEXT nullable | AI-generated draft |
| user_content | TEXT nullable | user-edited override |
| record_ids | UUID[] | **LEGACY** relationship; no new feature should trust it |
| is_complete | BOOLEAN | existing flag; not a replacement for manuscript review |
| sort_order | INT | ordered manuscript |
| created_at, updated_at | TIMESTAMPTZ | lifecycle |

### public.chapter_records — normalized Chapter↔Record

| Field | Type | Meaning |
|---|---|---|
| chapter_id | UUID FK chapters ON DELETE CASCADE | composite PK part 1 |
| record_id | UUID FK records ON DELETE CASCADE | composite PK part 2 |
| position | INT default 0 | source Record order within Chapter |
| relevance_score | REAL nullable | semantic relevance |
| created_at | TIMESTAMPTZ | link creation |

**Constraint:** PK `(chapter_id, record_id)`. Migration 011 backfilled this relation from older arrays/foreign keys. Migration 014 keeps own-Book/own-Record RLS checks.

### public.publications — immutable logical snapshots

| Field | Type | Meaning |
|---|---|---|
| id | UUID PK | published artifact identity |
| project_id, user_id | UUID FK | parent Book and owner |
| version | INT | v1/v2/v3 sequence |
| status | publication_status enum | processing / published / failed |
| title_snapshot, author_snapshot | TEXT | metadata at publish time |
| subtitle_snapshot | TEXT nullable | metadata snapshot |
| cover_snapshot | JSONB default `{}` | Cover choice/tagline snapshot |
| toc_snapshot | JSONB default `[]` | TOC snapshot |
| pdf_path, epub_path | TEXT nullable | private Storage keys |
| page_count | INT nullable | generated pages |
| error_code, error_message | TEXT nullable | failed-generation diagnostics |
| created_at | TIMESTAMPTZ | creation |
| published_at | TIMESTAMPTZ nullable | successful publication time |

**Constraint:** `UNIQUE(project_id, version)` (Migration 012). Storage bucket `published-pdfs` and key `{user_id}/{project_id}/v{version}.pdf`. Signed URLs expire and must not be stored as an immutable publication property. `published_books` remains legacy.

### Auxiliary tables

| Table | Key fields from current TS Row | Purpose |
|---|---|---|
| `record_drafts` | id, user_id, project_id, mode, payload JSONB, updated_at | per-user/Book/mode draft workflow |
| `daily_questions` | id, project_id, user_id, question, question_date, created_at | **LEGACY** dated question cache; new questions are fresh with fallback |
| `notifications` | id, user_id, type, title, body, link, is_read, created_at | badge, chapter, reminder UX |
| `device_tokens` | id, user_id, fcm_token, platform, updated_at | push devices; token is sensitive |
| `subscriptions` | id, user_id, plan, started_at, expires_at, play_purchase_token, play_order_id, updated_at | Free/Pro entitlements; purchase tokens are sensitive |
| `published_books` | id, project_id, user_id, pdf_url, cover_template_id, page_count, published_at | **LEGACY** one-publication-per-Book |
| `ai_usage` | verify base migration | feature usage audit; type inventory currently includes `question`, `freewriting_hint`, `chapter`, `caption_expand`, `chapter_regenerate`, `record_analysis` |

## 3. Explicit enumerations and policy

- `ProjectType`: `emotion`, `parenting`, `yearly`, `career`, `custom`, `growth`, `life_story`, `relationships`, `travel`, `hobby`, `learning`. `emotion`/`yearly` are legacy project categories.
- `RecordModeInstance`: `question`, `photo`, `free`; `RecordMode` additionally has legacy `daily`.
- `SubscriptionPlan`: `free`, `pro`.
- `NotificationType`: `daily_question`, `badge`, `chapter_complete`.
- `publication_status`: `processing`, `published`, `failed`.
- Story Readiness threshold matrix and Free/Pro rules are owned by `13_DEVELOPMENT_SPEC.md` / `06_FREE_PRO_POLICY.md`; no competing numbers here.

## 4. Security and lifecycle notes

- Migrations 010–014 define RLS protections for `record_analysis`, `chapter_records`, `publications`, `records`, `chapters` and `record_drafts`; ownership must be enforced end-to-end in QA, including Edge Functions running service-role.
- `record_analysis.record_id` CASCADE deletes AI metadata with its Record. `chapter_records` cascades on related Chapter/Record deletion. `publications` cascade on Project deletion is in repository Migration 012.
- Publish status must be driven by `publications`, never the legacy `projects.is_completed` flag.
- Deleting a user account must reconcile DB rows, photo/PDF storage objects and push/payment metadata; separately verify the active `delete-account` Edge Function and service policies.
- Avoid exposing `play_purchase_token`, `fcm_token`, signed URLs and personal diary text in logs or diagnostic exports.
- Do not modify old schema merely to match inferred types; inspect production catalog first.

## 5. Migration 015 — TARGET ONLY

```sql
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS manuscript_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS final_review_completed_at TIMESTAMPTZ;
```

This is a **proposed outline, not executed SQL**. Before implementation: confirm the baseline schema, define explicit completion/invalidation policy, update `src/types/database.ts` Row/Insert/Update, protect owned updates, wire Manuscript and Final Review UI, persist refresh/relogin, verify Workspace transitions, and record tests. Do not infer published status from milestone timestamps.

## 6. Open reconciliation items before CURRENT

1. Inspect **live** Supabase `information_schema.columns`, constraints, indexes, RLS policies, Storage policies and actual applied migrations; distinguish repo files from deployed state.
2. Read base migrations 001–008 to confirm exact SQL definitions, defaults, all constraints and the auxiliary `ai_usage` fields.
3. Compare runtime schema and `src/types/database.ts`; record divergences rather than guessing.
4. Confirm `record_drafts` unique key, `subscriptions` uniqueness, types/defaults, Storage buckets, foreign-key/index details.
5. Sync with `14_API_SPEC.md` and `12_DB_V2_CUTOVER_CHECKLIST.md` after verification.

**This file creates documentation only. No SQL was applied, no schema migrated, no source code deployed.**

## 7. Live Supabase verification — 2026-10-16

Project `MyChapter` is **ACTIVE_HEALTHY** (PostgreSQL 17). Live `public` table introspection confirms all 14 expected application tables present and RLS enabled. Every listed public table currently reports 0 rows. Applied migration history includes 001–006 and timestamped versions corresponding to 007–014; latest is `security_performance_hardening`. Security Advisor returned zero lints.

Live `projects` column inventory confirms **neither** `manuscript_reviewed_at` nor `final_review_completed_at` exists; Migration 015 remains a target. Live user `notification_time` and project `notification_time` are SQL `time without time zone` (represented as strings in the client). `subscriptions.user_id` is unique, and `record_analysis.record_id` unique. Live `records.content` SQL check allows 1–5000 characters: mode-specific 10-character minimum is presently application policy, **not** an equivalent DB CHECK.

**Scope of verification:** table existence/columns/RLS-enabled flags and migration inventory confirmed from Supabase introspection; row-level cross-account behavior, Storage policy runtime, and complete policy expressions have **not** been E2E-tested. This is not yet a production launch sign-off.

## 8. Migration 015 applied — 2026-10-16

Live Supabase migration history now includes `20261016025534 workflow_review_milestones`. A read-only information_schema query confirmed both `projects.manuscript_reviewed_at` and `projects.final_review_completed_at` are **nullable timestamp with time zone**. Source migration `supabase/migrations/015_workflow_review_milestones.sql` and `src/types/database.ts` were updated. Earlier TARGET/ABSENT labels in this v0.1 are historical pre-migration observations; these fields are **now PRESENT** in the live schema. Live Security Advisor after migration: zero lints. Functional E2E remains pending.
