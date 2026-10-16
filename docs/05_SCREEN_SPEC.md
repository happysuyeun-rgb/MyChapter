# 05. Screen Specification

**Status:** Final Screen Spec v1.1  
**Updated:** 2026-10-16  
**Source of truth:** product-facing screen/UX behavior. Product policy still follows 02_PRODUCT_DECISIONS.md.

## Status legend

- **Implemented**: current route/UI exists.
- **Partial**: core UI exists but policy, persistence, or final state is incomplete.
- **Target**: final v1.1 design is fixed but code is not aligned yet.
- **Planned**: not part of current MVP completion path.
- **E2E Pending**: implementation exists but production real-data flow is not verified.

## ID policy

Existing IDs are not renumbered. Newly discovered real screens use non-breaking extension IDs.

Examples:

- R-04P = Photo Record
- B-04A = Chapter Preview
- U-05A = Publish Complete
- U-05B = Publication Viewer
- G-01 = global Paywall modal

Current MVP onboarding is two steps: A-03 Nickname + O-01 Notification. Old O-01~04 conceptual onboarding is not implemented as four separate screens.

---

## Entry / Auth

| ID | Screen | Route | Status | Primary behavior |
|---|---|---|---|---|
| SP-01 | Splash | /splash | Implemented | single post-auth routing checkpoint |
| A-01 | Login | /login | Implemented | Google / Kakao / Email entry |
| A-02 | Email Login / Auth | /login/email | Implemented / E2E Pending | magic-link sign in |
| A-03 | Nickname | /onboarding/nickname | Implemented | save 2~10 char author name |
| O-01 | Notification Onboarding | /onboarding/notification | Implemented | save notification preference and complete onboarding |

### Final rules

- Web OAuth and Email callback route to /splash.
- Splash routes by session/profile/onboarding state.
- O-01 must advance only after successful profile persistence.
- Terms and Privacy linked from Login must be viewable by guests.

---

## Home

### H-01 · Empty Home

**Status:** Implemented

- First value explanation.
- Primary CTA: 첫 번째 책 만들기.

### H-02 · In-progress Home

**Status:** Implemented

Shows:

- current Book
- Story Readiness
- PAGE note
- record count
- dominant 오늘 한 페이지 쓰기 CTA
- notification entry

Only Story Readiness is shown as progress. Legacy targetCount progress must not compete with it.

### H-03 · Ready Home

**Status:** Implemented / QA

When Readiness minimum conditions are met:

- explain that Book Making is available
- primary CTA: 책 작업실 열기
- secondary behavior: user may continue recording

### H-04 · Published Home

**Status:** Target

Final state:

- latest publication version and published date
- latest immutable cover snapshot
- primary CTA: 발행본 보기
- secondary CTA: 책 작업실 열기
- Pro: republish through Final Review flow
- Free after first publication: republish opens G-01 Paywall
- new Book entry reflects Free/Pro entitlement

Published state must be derived from publications, not only legacy projects.is_completed.

### H-05 · Publishing Home

**Status:** Deprecated as standalone screen

Publishing progress/failure is finalized as U-04/U-06 state inside Final Review. Do not add a separate publishing route.

---

## Library

| ID | Screen | Route | Status |
|---|---|---|---|
| L-01 | All Books | /library | Implemented |
| L-02 | 진행중 | /library | Implemented |
| L-03 | 발행가능 | /library | Implemented |
| L-04 | 발행완료 | /library | Implemented |
| L-05 | Project Limit / Pro | G-01 | Implemented |

Final Book status should use publications + Readiness. Free users opening a restricted second Book flow see G-01 only at the restricted action.

---

## Project

| ID | Screen | Route | Status |
|---|---|---|---|
| P-01 | New Book Entry | /project/new | Implemented |
| P-02 | Book Type | /project/new | Implemented |
| P-03 | Basic Info | /project/new/setup | Implemented |
| P-04 | AI Title | - | Not MVP |
| P-05 | Created | /project/new/complete | Implemented |
| P-06 | Book Workspace | /project/workspace | Implemented / Partial |
| P-07 | Book Settings | /project/settings | Implemented / Partial |

### P-03 final fields

- Book title: 1~50 chars
- Story Readiness minimum guidance
- no competing period/frequency target UI
- recording mode is chosen per Record

### P-06 final stages

1. 기록
2. 챕터
3. 원고
4. 표지
5. 최종 검수
6. 발행

Current code infers manuscript/review completion from content/published state. Final target is persisted workflow milestones such as manuscript_reviewed_at and final_review_completed_at.

### P-07

Implemented:

- title change
- type change
- readiness snapshot update
- sticky ready_at preservation

Still not implemented:

- Book archive/delete
- optional Book-specific settings

---

## Records

| ID | Screen | Route / form | Status |
|---|---|---|---|
| R-01 | Record List | /records | Implemented |
| R-02 | Mode Select | /record/mode | Implemented |
| R-03 | AI Question Record | /record/write/question | Implemented / E2E Pending |
| R-04 | Free Record | /record/write/free | Implemented |
| R-04P | Photo Record | /record/write/photo | Implemented / E2E Pending |
| R-05 | Saved / Complete | /record/complete | Implemented |
| R-06 | AI Record Edit Result | - | Planned |
| R-07 | Record Detail | /records/:id | Implemented |
| R-08 | Record Edit | /records/:id/edit | Implemented |
| R-09 | Delete / Exit Confirm | modal / flow | Implemented |
| R-10 | AI Edit Quota | policy / paywall | Planned |

### R-03

- AI question + answer + emotion tags
- body 10~2000 chars
- draft restore
- AI_LIMIT may open G-01, but fallback question keeps writing available

### R-04

- optional title
- optional freewriting hint
- body 10~5000 chars
- blank title falls back to date-based title
- current title max length is not yet defined

### R-04P

- photo required
- caption 1~100 chars
- emotion tags
- record photo stored separately
- file size/resolution policy is still open and must be fixed before launch

### R-05

Shows:

- saved page number
- Story Readiness
- streak message / next streak goal
- earned badge titles
- Ready state CTA to Book Workspace

### Record common behavior

- unsaved exit supports continue / save draft / discard
- analyze-record runs asynchronously after create/update
- analysis failure must not fail the original Record save
- original Records are never overwritten by Chapter generation

---

## Book Making

| ID | Screen / state | Route | Status |
|---|---|---|---|
| B-01 | Chapter Start | /book | Implemented |
| B-02 | Chapter Desk / List | /book | Implemented |
| B-03 | Generate State | /book | Implemented / E2E Pending |
| B-04A | Chapter Preview | /book/chapter/:id | Implemented |
| B-04 | Chapter Edit | /book/chapter/:id/edit | Implemented |
| B-05 | Manuscript Review | /book/manuscript | Implemented |
| B-06 | Manuscript Edit | embedded via chapter edit | Partial |
| B-07 | Free Cover | /book/cover | Implemented |
| B-08 | Pro / AI Cover | /book/cover | Partial |
| B-09 | TOC | Final Review embedded | Partial |

### Final Book Making rules

- Ready is required before /book.
- chapter_records is the Chapter↔Record source of truth.
- B-03 requires enough unassigned material; current threshold is 3 Records.
- Chapter regenerate reads original source Records and does not mutate them.
- Manuscript is a workflow over Chapter content, not a duplicate manuscript body table.
- B-07 persists selected_cover_id.
- Pro template covers exist; AI-generated cover remains post-MVP.
- TOC has no dedicated route; Final Review contains it.

---

## Publication

| ID | Screen / state | Route / location | Status |
|---|---|---|---|
| U-01 | Final Review | /book/review | Implemented |
| U-02 | Preview | embedded in U-01 | Final |
| U-03 | Publish Confirm | U-01 CTA | Final |
| U-04 | Publishing | U-01 state | Implemented |
| U-05A | Publish Complete | /book/publish/complete | Implemented |
| U-05B | Publication Viewer | /publication/:id | Implemented / E2E Pending |
| U-06 | Failed | U-01 state | Implemented |
| U-07 | Free Publication Limit | G-01 | Implemented / E2E Pending |

### U-01 required checks

- cover
- TOC
- manuscript

The publish CTA activates only when required checks and prerequisites are satisfied.

### U-04

Publishing stages:

1. cover
2. TOC
3. body
4. PDF

No standalone publishing route is required.

### U-05 / U-06 / U-07

- Publish Complete receives publicationId + version.
- Viewer opens one immutable publication snapshot.
- failed retry reuses the same version when possible.
- Free allows the first published publication only; republish requires Pro.
- entitlement must be enforced on server and client.

---

## My / Settings / Global

| ID | Screen | Route / form | Status |
|---|---|---|---|
| M-01 | My | /mypage | Implemented |
| M-02 | Subscription | /mypage/subscription | Implemented |
| M-03 | AI Usage | - | Planned |
| M-04 | Publication History | /mypage/completed-books | Implemented |
| M-05 | Notifications | /notifications | Implemented / error-state gap |
| M-06 | Settings | /mypage/settings | Implemented |
| M-07 | Privacy Policy | /mypage/privacy-policy | Implemented |
| M-08 | Terms | /mypage/terms-of-service | Implemented |
| M-09 | Delete Account | /mypage/delete-account | Implemented / E2E Pending |
| G-01 | Paywall Modal | global | Implemented |

### M-01

Shows:

- nickname and email
- FREE / PRO badge
- Record / Chapter / completed Book stats
- streak when available
- Pro upsell for Free
- publication/settings/subscription/privacy links
- logout

### M-02

Current code:

- Pro monthly label: 월 5,900원
- multiple Books
- republish / additional publish
- expanded AI
- Pro covers
- first Book Free message

If billing is unavailable on web, show 모바일 앱에서 결제해주세요.

### M-05

- unread count
- mark all read
- type/title/body/relative time
- tap marks read, then follows notification link
- empty state exists
- final target adds explicit error + retry state

### M-06

Includes:

- recording notification ON/OFF
- notification time
- nickname edit
- profile emoji
- plan status and Pro entry
- Terms / Privacy
- app version
- logout
- delete account

Each persistence failure needs local feedback.

### M-07 / M-08

Login links point to these pages. Final route policy: legal pages are publicly readable for guests. Add loading/error handling around iframe/content loading.

### M-09

- explains permanent deletion impact
- requires exact phrase 계정 삭제
- deleting/loading/error states
- production E2E must verify Auth + DB + Storage cleanup

### G-01

Paywall includes:

- multiple Books
- republish / additional publish
- expanded AI + Pro covers
- current price label 월 5,900원
- first Book Free message
- Pro 시작하기 / 나중에 하기
- billing unavailable / loading / error states

---

## Common state matrix

Every API-backed screen must define:

- Loading
- Empty when relevant
- Error + retry
- Permission / ownership failure
- Offline/network failure where distinguishable
- Success
- Paywall when entitlement-gated

A color change alone is not sufficient to communicate state.

---

## Validation matrix

| Input | Current rule | Open item |
|---|---|---|
| Nickname | 2~10 chars, Korean/English/numbers | no spaces |
| Book title | 1~50 chars | no banned-word policy |
| AI Question Record | 10~2000 chars | fixed |
| Free Record | 10~5000 chars | title max length not fixed |
| Photo Record | photo + caption 1~100 chars | file size/resolution not fixed |
| Delete Account | exact phrase 계정 삭제 | fixed |
| Chapter title/body | current implementation has no final max policy | launch review needed |

---

## Direct URL / guard requirements

Final route rules:

1. /project/* requires Auth + completed onboarding.
2. /record/* requires Auth + onboarding + active Book.
3. /records/:id* also requires Record ownership.
4. /book requires active Book + Ready.
5. /book/chapter/:id* requires Ready + Chapter ownership.
6. /book/manuscript requires at least one Chapter.
7. /book/cover requires Ready + at least one Chapter.
8. /book/review requires Ready + Chapter + persisted Cover.
9. /book/publish/complete requires valid publishResult; direct entry is rejected.
10. /publication/:id requires publication ownership.
11. /mypage/privacy-policy and /mypage/terms-of-service are public legal routes.

Current implementation differences are tracked in SCREEN_IMPLEMENTATION_GAP.md.

---

## Accessibility / responsive requirements

- primary phone widths: 320 / 375 / 414 / 768
- no horizontal overflow
- touch targets approximately 44px or larger
- icon-only controls require accessible labels
- keyboard focus must remain visible
- Modal/BottomSheet focus behavior and Escape should be verified
- state is not communicated only by color
- long Book/Chapter titles safely wrap or truncate
- fixed bottom actions respect safe-area inset
- motion expansion should support prefers-reduced-motion

---

## Launch QA exit criteria

- Guest can open Terms/Privacy from Login.
- Failed O-01 persistence does not advance onboarding.
- Incomplete-onboarding user cannot deep-link into Project/Record/Book flows.
- Home/Library/Workspace publication state matches publications source of truth.
- Published Home opens the latest publication and returns to Workspace correctly.
- Record draft restore, photo upload/delete, and analyze-record failure are verified.
- Ready gating, chapter_records, generate/regenerate, and reorder failure recovery are verified.
- manuscript/final review completion survives refresh through persisted milestone.
- Free v1, Pro v2, failed retry, and signed URL viewer all pass.
- multi-account Record/Chapter/Publication access is blocked.
- account deletion cleans Auth/DB/record photos/versioned PDFs.
- 320/375/414/768, long titles, empty/error/loading states render without breakage.
