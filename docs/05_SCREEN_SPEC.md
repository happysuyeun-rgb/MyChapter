# 05. Screen Specification

**Status:** Screen map v1  
**Updated:** 2026-09-28

## Screen status legend

- **Implemented**: current route/UI exists
- **Partial**: route exists but final behavior/policy is incomplete
- **Planned**: product requirement exists but route/UI not yet implemented

## Entry / Auth

| ID | Screen | Status | Primary action |
|---|---|---|---|
| SP-01 | Splash | Implemented | auth routing |
| A-01 | Login | Implemented | login |
| A-02 | Signup/Auth | Partial | account creation |
| A-03 | Nickname | Implemented | nickname save |
| O-01~04 | Onboarding | Partial | nickname + notifications currently covered |

## Home

### H-01 · Empty Home

**Status:** Implemented

Purpose:
- explain first value
- create first Book

CTA:
- 첫 번째 책 만들기

### H-02 · In-progress Home

**Status:** Implemented

Shows:
- current book
- story readiness
- book stage indicators
- dominant 오늘 기록하기 CTA
- PAGE guidance
- notifications

Active Book selection is persisted by ID and validated against the current user's books.

### H-03 · Ready Home

**Status:** Partial

When readiness is met:
- show that book making is available
- next action should clearly lead to Workspace/Chapters

### H-04 · Published Home

**Status:** Partial

Published status is derivable but a publication-focused Home state is not fully separated.

### H-05 · Publishing

**Status:** Partial

Publishing progress currently appears inside Final Review. Dedicated processing route is not implemented.

## Library

### L-01 · All books

**Status:** Implemented

### L-02 · 진행중

**Status:** Implemented

### L-03 · 발행가능

**Status:** Implemented

### L-04 · 발행완료

**Status:** Implemented

### L-05 · Project limit / Pro

**Status:** Implemented

Paywall opens only when the user attempts to create a restricted additional Book.

## Project

### P-01/P-02 · New book / Type

**Status:** Implemented

### P-03 · Basic info

**Status:** Implemented

Current user-facing fields:
- title
- Story Readiness guidance

Legacy duration/frequency fields remain backend compatibility data until DB v2 cutover but are no longer presented as a competing completion rule.

### P-04 · AI title

**Status:** Not required in current MVP

### P-05 · Created

**Status:** Implemented

CTA correctly moves to per-record mode selection.

### P-06 · Book Workspace

**Status:** Implemented

Stages:
- 기록
- 챕터
- 원고
- 표지
- 최종 검수
- 발행

### P-07 · Project Settings

**Status:** Implemented / partial

Implemented:
- title change
- type change
- readiness snapshot update
- sticky `ready_at` preservation

Still planned:
- archive/delete
- optional notification/book settings

## Records

### R-01 · Record list

**Status:** Implemented

### R-02 · Mode selection

**Status:** Implemented

Modes:
- AI question
- free
- photo

### R-03 · AI question

**Status:** Implemented

### R-04 · Free record

**Status:** Implemented

### R-05 · Saved

**Status:** Implemented

Saved-state progress now uses Story Readiness.

### R-06 · AI record edit result

**Status:** Planned

### R-07/R-08 · Detail/Edit

**Status:** Implemented

### R-09 · Delete confirm

**Status:** Implemented in existing record flow where applicable

### R-10 · AI edit quota

**Status:** Planned

## Book Making

### B-01/B-02 · Chapter start/list

**Status:** Implemented / backend deployed

The current source uses semantic clustering across unassigned records. Automatic 10-record chapter creation has been removed.

### B-03 · Generate

**Status:** Implemented / backend deployed

AI selects related source records by recurring themes and change flow, then generates the chapter from the selected originals.

### B-04 · Chapter edit

**Status:** Implemented

### B-05/B-06 · Manuscript review/edit

**Status:** Implemented

Manuscript is workflow over chapter content, not duplicated persistent body.

### B-07 · Free cover

**Status:** Implemented

### B-08 · Pro / AI cover

**Status:** Partial

Pro template covers exist. AI-generated cover is post-MVP.

### B-09 · TOC

**Status:** Partial

TOC is shown in Final Review; dedicated screen is not implemented.

## Publication

### U-01 · Final Review

**Status:** Implemented

Required checks:
- cover
- TOC
- manuscript

### U-02 · Preview

**Status:** Planned/partial

No dedicated preview route.

### U-03 · Publish confirm

**Status:** Included in Final Review interaction

### U-04 · Publishing

**Status:** Partial

Progress state exists in Final Review.

### U-05 · Published

**Status:** Implemented

Publication viewer opens a specific versioned `publication/:id` snapshot.

### U-06 · Failed

**Status:** Implemented in Final Review with retry

### U-07 · Free publication limit

**Status:** Implemented

Free first publication copy is aligned with the first-book-free policy.

## My

| ID | Screen | Status |
|---|---|---|
| M-01 | My | Implemented |
| M-02 | Subscription | Implemented |
| M-03 | AI usage | Planned |
| M-04 | Publication history | Implemented |
| M-05 | Notifications | Implemented |
| M-06 | Settings | Implemented |

## Direct URL / guard requirements

Book-making routes must validate:

1. authenticated user
2. active project exists
3. project belongs to user
4. readiness requirements
5. stage prerequisites when relevant

Routes requiring review:

- `/book`
- `/book/manuscript`
- `/book/cover`
- `/book/review`
- `/publication/:id`
