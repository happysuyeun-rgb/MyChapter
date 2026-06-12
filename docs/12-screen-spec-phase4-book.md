# MyChapter — 화면별 기능명세서 (Phase 4: 내 책)

> **기준 문서:** 화면설계서 v1.1, 착수 프롬프트 v2.0  
> **대응 구현:** `src/pages/book/`  
> **작성일:** 2026-06-12

---

## Phase 4 화면 목록

| ID | 화면명 | 경로 | 구현 파일 |
|----|--------|------|-----------|
| S-17 (Empty) | 내 책 Empty | `/book` | `BookPage.tsx` + `EmptyState` |
| S-17 | 챕터 구성 | `/book` | `BookPage.tsx` |
| S-18 | 원고 미리보기 | `/book/chapter/:id` | `ChapterPreviewPage.tsx` |
| S-19 | 원고 편집기 | `/book/chapter/:id/edit` | `ChapterEditPage.tsx` |
| S-20 | 표지 선택 | `/book/cover` | `BookCoverPage.tsx` |
| S-21 | 출판 완료 | `/book/publish/complete` | `PublishCompletePage.tsx` |
| S-P1 | Pro Paywall | (오버레이) | Phase 4 트리거 연동 |

---

## S-17 Empty / 내 책 (기록·챕터 없음)

### 표시 조건

| 조건 | UI |
|------|-----|
| activeProject 없음 | `EmptyState variant="book"` |
| chapters=0 AND unassignedCount=0 | 동일 Empty |

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `EmptyState` | 📚 「완성한 책이 아직 없어요」 |
| CTA | 「홈으로」 → `/home` |
| `AppLayout` + TabBar | 하단 탭 유지 |

### 상태값

| Hook | 설명 |
|------|------|
| `useActiveProject` | project null |

### Free / Pro

- 동일 Empty UI

---

## S-17 / 챕터 구성 (메인)

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| 헤더 | 프로젝트 제목, 챕터/기록 수, ProgressBar |
| 진행 중 Card | 미할당 기록 N/10, progress bar, 「챕터 생성하기」 |
| 완성된 챕터 리스트 | Chapter N, 제목, 기록 수, 예상 페이지 |
| 「책 출판하기」 | chapters ≥ 1 일 때 하단 CTA |

### 상태값

| Store / State | 필드 |
|---------------|------|
| `authStore` | `user` |
| `projectStore` | `activeProject` (`useActiveProject`) |
| `paywallStore` | `showPaywall` |
| 로컬 | `chapters[]`, `unassignedCount`, `isPro`, `loading`, `generating` |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 화면 진입 / pull refresh | `listChapters`, `getUnassignedRecordCount`, `getSubscriptionPlan` |
| 챕터 행 탭 | `/book/chapter/:id` (S-18) |
| 「챕터 생성하기」 | `generateChapter()` → 목록 갱신 |
| unassigned ≥ 10 + Free + chapters ≥ 3 | S-P1 + 「Pro로 챕터 더 만들기」 |
| 「책 출판하기」 | `/book/cover` (S-20) |

### API / Edge Function

| API | 설명 |
|-----|------|
| `listChapters(projectId)` | sort_order ASC |
| `getUnassignedRecordCount` | chapter_id IS NULL, is_draft=false |
| `generate-chapter` | 미할당 10개 → AI 챕터 INSERT |
| `getSubscriptionPlan` | Pro 여부 |

**자동 생성 (백그라운드):**

- 기록 저장 10·20·30…번째 → `records.finalizeSave` → `generate-chapter` invoke
- Free CH4+: Edge 402, records는 chapter_id null 유지

### Free / Pro 제한 분기

| 기능 | Free | Pro |
|------|------|-----|
| 완성 챕터 수 | **3개** | 무제한 |
| 4번째 생성 (≥10 미할당) | CHAPTER_LIMIT → S-P1 | 정상 생성 |
| 「책 출판하기」 진입 | 가능 (출판은 S-20에서 Pro) | 동일 |

### 에러 케이스

| 상황 | 동작 |
|------|------|
| CHAPTER_LIMIT | Paywall, generating 종료 |
| generate 실패 (기록 부족) | chapter null, UI 변화 없음 |
| loading | 「로딩 중...」 |

### 설계(v1.1) 대비

| 설계 | 현재 |
|------|------|
| 드래그 재정렬 (편집 모드) | ❌ 미구현 |
| sort_order 변경 | ❌ |

---

## S-18 / 원고 미리보기

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `NavBar` | Chapter N, ‹ 뒤로, 「편집」 |
| 세리프 본문 | `Noto Serif KR`, 단락 `\n\n` 분리 |
| 「원고 편집하기」 | S-19 |

### 상태값

| 로컬 | 필드 |
|------|------|
| `chapter` | Chapter \| null |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 진입 | `getChapter(id)` |
| 「편집」 / 「원고 편집하기」 | `/book/chapter/:id/edit` |
| ‹ 뒤로 | history back |
| chapter 없음 | `/book` replace |

### API / Edge Function

| API | 설명 |
|-----|------|
| `getChapter(id)` | 단건 SELECT |
| `getChapterDisplayContent()` | `user_content ?? ai_content` |

### Free / Pro 제한 분기

- **없음** — 미리보기 Free/Pro 동일

### 에러 케이스

| 상황 | 동작 |
|------|------|
| invalid id | redirect `/book` |
| content 빈값 | 빈 본문 영역 |

---

## S-19 / 원고 편집기

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `NavBar` | 취소 / 저장 |
| `Input` | 챕터 제목 (max 30) |
| `Textarea` | 본문 (serif) |
| 「AI로 다시 쓰기」 | regenerate 확인 Modal |
| `Modal` | 재생성 확인 |

### 상태값

| 로컬 | 필드 |
|------|------|
| `chapter`, `title`, `content` | |
| `saving`, `regenerating`, `confirmOpen` | |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 「저장」 | `updateChapterContent(id, title, content)` → `user_content` 저장 → S-18 |
| 「AI로 다시 쓰기」 | Modal → `regenerateChapter` → `ai_content` 덮어쓰기, `user_content` null |
| 「취소」 | S-18 (변경 미저장 가능) |

### API / Edge Function

| API | 설명 |
|-----|------|
| `updateChapterContent` | chapters UPDATE title, user_content |
| `regenerate-chapter` | record_ids 기준 AI 재생성 |
| `ai_usage` INSERT | feature: `chapter_regenerate` |

### Free / Pro 제한 분기

| 기능 | Free | Pro |
|------|------|-----|
| 수동 편집 | ✅ | ✅ |
| AI 재생성 | 설계: Pro 또는 제한 | Edge에서 실행 *(월 한도 미포함)* |

### 에러 케이스

| 상황 | 동작 |
|------|------|
| title/content 빈값 | 저장 버튼 disabled |
| regenerate 실패 | regenerating false, 이전 content 유지 |
| save 실패 | saving false *(에러 메시지 미표시)* |

### 설계(v1.1) 대비

- ✅ 제목+본문 편집, AI 재생성, 미저장 확인(취소)
- ⚠️ 저장 실패 UI 없음

---

## S-20 / 표지 선택

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| 표지 그리드 2×2 | `COVER_TEMPLATES` 4종 |
| Pro 뱃지 / 🔒 | proOnly 템플릿 |
| 미리보기 | 프로젝트 제목 + 닉네임 |
| 선택 Card | 현재 선택 표지명 |
| 「PDF 출판하기」 / 「Pro로 출판하기」 | |

### 표지 템플릿

| id | 이름 | Free | Pro |
|----|------|------|-----|
| cover_01 | 클래식 다크 | ✅ | ✅ |
| cover_02 | 포레스트 그린 | ✅ | ✅ |
| cover_03 | 웜 오렌지 | 🔒 | ✅ |
| cover_04 | 미드나잇 퍼플 | 🔒 | ✅ |

### 상태값

| Store / State | 필드 |
|---------------|------|
| `authStore` | `user`, `profile` |
| `bookStore` | `selectedCoverId`, `setSelectedCoverId`, `setPublishResult` |
| `paywallStore` | `showPaywall` |
| `useActiveProject` | `project` |
| 로컬 | `isPro`, `publishing` |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| Pro 전용 표지 탭 (Free) | S-P1 |
| Free 표지 탭 | `setSelectedCoverId` |
| 「PDF 출판하기」 (Free) | S-P1 |
| 「PDF 출판하기」 (Pro) | export → download → save → S-21 |

**출판 플로우 (Pro):**

1. `listChapters`, `listRecords`
2. `prepareBookExport` — Pro 체크
3. `downloadBookHtml` — 클라이언트 HTML 파일 다운로드
4. `savePublishedBook` — `published_books` UPSERT, `projects.is_completed=true`
5. `setPublishResult` → S-21

### API / Edge Function

| API | 설명 |
|-----|------|
| `prepareBookExport` | Pro 아니면 `PDF_PRO_ONLY` throw |
| `buildBookHtml` / `downloadBookHtml` | HTML export *(PDF Edge 미구현)* |
| `savePublishedBook` | published_books, projects UPDATE |
| `getSubscriptionPlan` | isPro |

**설계 대비:** `generate-pdf` Edge Function **미구현** → HTML 다운로드

### Free / Pro 제한 분기

| 기능 | Free | Pro |
|------|------|-----|
| 표지 cover_01/02 | 선택 가능 | ✅ |
| 표지 cover_03/04 | S-P1 | ✅ |
| PDF/HTML 출판 | S-P1 | ✅ |

### 에러 케이스

| 상황 | 동작 |
|------|------|
| chapters=0 | redirect `/book` |
| PDF_PRO_ONLY | Paywall |
| publishing | 버튼 「출판 준비 중...」 |

---

## S-21 / 출판 완료

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| 📚 축하 | 프로젝트 제목 |
| 완성 Card | 표지 썸네일, 기록 수, 페이지, 표지명 |
| 「내 책 보기」 | `/book` |
| 「홈으로」 | `/home` |

### 상태값

| Store | 필드 |
|-------|------|
| `bookStore` | `publishResult`, `clearPublishResult` |

**`publishResult`:**

```typescript
{ project, recordCount, pageCount, coverTemplateId }
```

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 진입 | publishResult 없으면 `/book` replace |
| 「내 책 보기」 | clearPublishResult → `/book` |
| 「홈으로」 | clearPublishResult → `/home` |

### API / Edge Function

- **없음** — S-20 결과 표시만

### Free / Pro 제한 분기

- S-20에서 Pro만 도달 가능

### 에러 케이스

| 상황 | 동작 |
|------|------|
| direct URL 접근 | redirect `/book` |

---

## S-P1 / Pro Paywall (Phase 4 연동)

### Phase 4 트리거

| 트리거 | 화면 |
|--------|------|
| CHAPTER_LIMIT (4번째 챕터) | S-17 |
| Pro 전용 표지 선택 | S-20 |
| PDF 출판 (Free) | S-20 |
| `PDF_PRO_ONLY` | S-20 catch |

### pendingAction 예시

- Pro 전환 후 챕터 생성 재시도
- Pro 전환 후 출판 재시도

---

## Phase 4 데이터 흐름

```
기록 10개 저장 (Phase 3)
    └── generate-chapter (자동)
            └── chapters + notifications (chapter_complete)

S-17 수동 생성
    └── generate-chapter (동일)

S-19 regenerate-chapter
    └── ai_content 덮어쓰기

S-20 출판
    └── HTML download + published_books
            └── projects.is_completed = true
```

### chapters 테이블 (표시용)

| 컬럼 | 용도 |
|------|------|
| `ai_content` | AI 최초 생성 |
| `user_content` | 사용자 편집본 |
| `record_ids` | 포함 기록 UUID[] |
| `sort_order` | 정렬 *(드래그 UI 없음)* |

---

## Phase 4 Store 요약

| Store | Phase 4 역할 |
|-------|--------------|
| `bookStore` | selectedCoverId, publishResult |
| `projectStore` | activeProject |
| `paywallStore` | CHAPTER_LIMIT, PDF, 표지 |
| `subscriptionStore` | isPro (간접) |

---

## Phase 4 구현 갭 (v1.1 대비)

| # | 항목 | 설계 | 현재 |
|---|------|------|------|
| 1 | PDF 출판 | `generate-pdf` 서버 PDF | HTML 다운로드 |
| 2 | S-17 드래그 재정렬 | sort_order 편집 | ❌ |
| 3 | S-17 수동 프로젝트 완료 | is_completed 토글 | 출판 시만 |
| 4 | Storage PDF URL | published-pdfs 버킷 | html 파일명 저장 |
| 5 | S-22 실물책 POD | MVP 제외 | ❌ |

---

## 관련 문서

- `docs/04-business-rules.md` — §4 챕터 자동 생성
- `docs/03-edge-functions-api.md` — generate/regenerate-chapter
- `docs/10-screen-spec-phase3-home-record.md` — 기록 → 챕터 트리거
- `docs/07-dev-progress.md` — Phase 4 현황
