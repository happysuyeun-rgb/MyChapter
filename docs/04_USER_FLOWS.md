# 04. User Flows

**Status:** MVP flow specification  
**Updated:** 2026-09-28

## 1. New user

```text
Splash
→ Login / Signup
→ Nickname
→ Notification onboarding
→ Home
→ Empty Library
→ 첫 번째 책 만들기
→ Book Type
→ Basic Info
→ Book Created
→ Record Mode
→ First Record
```

## 2. Existing user / daily recording

```text
Home
→ Current Book
→ 오늘 기록하기
→ AI 질문 / 자유 / 사진
→ Write
→ Save
→ Record Complete
→ readiness update
→ Home
```

## 3. AI question record

```text
Record Mode
→ AI Question
→ question generated using project + recent context
→ user writes response
→ emotion tags
→ Save
→ original record persisted
```

Fallback:

```text
AI generation failure / quota
→ fallback question
→ user can still record
```

## 4. Free record

```text
Record Mode
→ Free
→ optional AI writing hint
→ title + body + emotion tags
→ Save
```

AI hint must remain optional. Failure must not block recording.

## 5. Readiness

```text
Records accumulate
→ duration + record count recalculated
→ not ready: continue recording
→ ready: book-making unlock
```

Important:

- no automatic book creation
- no automatic chapter generation before user starts book-making

## 6. Book making

Target flow:

```text
Workspace
→ Chapters
→ AI analyzes accumulated records
→ chapter structure
→ user reviews/reorders/edits
→ Manuscript
→ Cover
→ Final Review
→ Publish
```

Current implementation still contains a legacy 10-record chapter batching mechanism. It is not the final target flow.

## 7. Publication

```text
Final Review
→ confirmation
→ cover preparation
→ TOC/body preparation
→ PDF generation
→ publication persisted
→ Publish Complete
→ Library / publication viewer
```

Failure:

```text
PDF generation failure
→ error state
→ Retry
→ or return to Final Review
```

## 8. Free first book

```text
Free user
→ first Book
→ record
→ unlock
→ chapter/manuscript
→ default cover
→ final review
→ PDF publication #1
→ success
```

After first-book success:

```text
Create second Book / republish / premium AI
→ Pro prompt
```

## 9. Multiple books

Pro:

```text
Home
→ Library
→ select Book
→ active Book
→ Workspace
```

Active book selection must persist across navigation and refresh, but must be validated against the currently authenticated user.

## 10. Published book revisit

Target:

```text
Library / My > Published Books
→ select publication
→ published-book viewer
→ download PDF
→ publication metadata
→ return to book workspace
```

Current gap: completed-books “보기” route currently points to the book-making screen rather than a publication detail/viewer.
