# MVP Product Changelog

This is a **product decision/change log**, not a git commit history.

## 2026-09-28

### Product structure

- Confirmed **Project = Book**
- Primary navigation changed to **홈 | 내 서재 | 마이**
- Recording remains inside the active Book rather than becoming a global product area
- Added Book Workspace concept

### Book types

Expanded user-facing types to:

- 나의 성장
- 나의 이야기
- 일과 커리어
- 가족과 육아
- 사랑과 관계
- 여행과 모험
- 취미와 일상
- 배움과 도전
- 자유 기록

### Recording

- Removed project-level fixed record-mode decision
- Record mode is selected each time
- Project creation no longer auto-generates the first AI question

### Story Readiness

- Added project-aware readiness rules
- Home and Workspace now show **이야기 준비도**
- Direct Book/Cover/Review access is gated by readiness
- First-record Home state avoids meaningless 0% emphasis

### Book Making

- Added dedicated Manuscript review stage
- Improved chapter generation and regeneration prompts
- AI editorial policy now prioritizes source fidelity and user voice

### Publication

- Free first PDF publication entitlement introduced
- Added Final Review
- Added publication progress/error/retry UX
- Improved post-publication navigation
- Identified need for versioned publication model in DB v2

### UI / Brand

- Established Ink Brown / Warm Ivory / Sage / Terracotta system
- Moved from repeated rounded cards toward editorial list/hairline layouts
- Added book-cover visual language
- Refined Home, Library, Workspace, Manuscript, Cover, Final Review
- PAGE placeholder presence added
- Hallmark reviewed as anti-template design audit
- ItsHover reviewed for future functional icon use

### P0 policy cleanup completed in source

- Story Readiness is now the single user-facing book progress model
- Removed automatic chapter generation on every 10th record
- Removed the Free 3-chapter wall from first-book completion
- Active Book persists by ID and Home respects the selected Book
- Project-limit checks no longer open Paywall as a side effect
- Added published-book detail route and PDF reopen flow
- Record deletion now cleans up its stored photo
- Account deletion source now cleans up published PDF storage
- Chapter generation source now uses semantic record clustering instead of fixed 10-record buckets
- Added structured record-analysis Edge Function source

### DB v2 prepared

- Added `009_db_v2_foundation.sql`
- Added `010_record_analysis.sql`
- Added `011_chapter_records.sql`
- Added `012_publication_versions.sql`
- Added `013_rls_v2.sql`

These migrations and new Edge Functions are committed but **not yet deployed to Supabase**.

### Remaining cutover work

- apply DB v2 migrations
- deploy `analyze-record` and updated chapter functions
- invoke record analysis after save
- switch publication API from legacy `published_books` to versioned `publications`
- remove legacy DB columns/tables after compatibility verification
