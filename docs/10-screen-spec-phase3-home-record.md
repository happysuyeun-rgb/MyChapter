# MyChapter — 화면별 기능명세서 (Phase 3: 홈·기록)

> **기준 문서:** 화면설계서 v1.1, 착수 프롬프트 v2.0  
> **대응 구현:** `src/pages/home/`, `src/pages/record/`, `src/pages/notifications/`  
> **작성일:** 2026-06-12  
> **범위:** S-09, S-10, S-11, S-12~S-16, S-30~S-32

---

## Phase 3 화면 목록

| ID | 화면명 | 경로 | 구현 파일 |
|----|--------|------|-----------|
| S-09 | 홈 Empty State | `/home` | `HomePage.tsx` (조건 분기) |
| S-10 | 홈 메인 | `/home` | `HomePage.tsx` |
| S-11 | 알림 목록 | `/notifications` | `NotificationsPage.tsx` |
| S-12 | 기록 모드 선택 | `/record/mode` | `RecordModePage.tsx` |
| S-13 | 질문 모드 작성 | `/record/write/question` | `RecordQuestionPage.tsx` |
| S-14 | 사진 모드 작성 | `/record/write/photo` | `RecordPhotoPage.tsx` |
| S-15 | 자유 일기 작성 | `/record/write/free` | `RecordFreePage.tsx` |
| S-16 | 저장 완료 | `/record/complete` | `RecordCompletePage.tsx` |
| S-30 | 기록 목록 | `/records` | `RecordsListPage.tsx` |
| S-31 | 기록 상세 | `/records/:id` | `RecordDetailPage.tsx` |
| S-32 | 기록 액션 시트 | (S-31 오버레이) | `RecordActionSheet.tsx` |

---

## S-09 / 홈 Empty State

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `EmptyState` (`variant="home"`) | 이모지, 제목, 설명, CTA 버튼 |
| `AppLayout` + `TabBar` | 하단 탭 (홈/기록/내책/마이) |

### 상태값 (Zustand + 로컬)

| Store / State | 필드 | 설명 |
|---------------|------|------|
| `authStore` | `user`, `profile` | 로그인·닉네임 (탭 외 영역) |
| 로컬 `useState` | `projects`, `loading` | 프로젝트 0개 판별용 |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 화면 진입 | `getProjects(userId)` → count = 0 이면 Empty 렌더 |
| CTA 「첫 프로젝트 시작하기」 | `/project/new` (S-05) 이동 |
| 하단 탭 「기록」 | S-30 (기록 0개면 records Empty) |
| 하단 탭 「내 책」 | S-17 Empty 또는 book Empty |

### API / Edge Function

| 호출 | 시점 |
|------|------|
| `getProjects()` | `HomePage` mount |

### Free / Pro 제한 분기

- **없음** — 프로젝트 0개는 플랜 무관 동일 UI

### 에러 케이스

| 상황 | 동작 |
|------|------|
| API 실패 | `loading` 해제 후 projects=[] → Empty 표시 가능 |
| 미로그인 | `AuthGuard`에서 `/login` 리다이렉트 (진입 불가) |

### 설계(v1.1) 대비

- ✅ 프로젝트 0개 조건, CTA → S-05
- ✅ `EmptyState` 3 variant 공유 (`home` / `records` / `book`)

---

## S-10 / 홈 메인

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| 헤더 | 오늘 날짜, 닉네임 인사, 🔔 알림 버튼 (미읽음 뱃지) |
| 스트릭 Card | 🔥 연속 기록 일수 / 격려 문구 |
| 프로젝트 Card | 제목, 유형 라벨, ProgressBar, 기록 수/남은 수 |
| 「전체보기」 | 프로젝트 2개 이상 시 노출 |
| 오늘의 AI 질문 Card | 질문 텍스트 + 「지금 답하기 ✍️」 CTA |

### 상태값 (Zustand + 로컬)

| Store / State | 필드 | 설명 |
|---------------|------|------|
| `authStore` | `user`, `profile` | 사용자 정보 |
| `projectStore` | `activeProject`, `setActiveProject` | 첫 프로젝트를 active로 설정 |
| 로컬 | `projects`, `recordCount`, `todayQuestion`, `streak`, `unreadCount`, `loading` | 화면 데이터 |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 화면 진입 | 프로젝트·기록·질문·스트릭·미읽음 알림 로드 |
| 🔔 탭 | `/notifications` (S-11) |
| 「전체보기」 | `/projects` (S-10b, 현재 placeholder) |
| 「지금 답하기」 | `project.record_mode`에 따라 분기 (아래) |

**「지금 답하기」 분기 (`record_mode`):**

| record_mode | 이동 |
|-------------|------|
| `daily` | `/record/mode` (S-12) |
| `question` | `/record/write/question` (S-13) |
| `photo` | `/record/write/photo` (S-14) |
| `free` | `/record/write/free` (S-15) |

### API / Edge Function

| API | 시점 | 설명 |
|-----|------|------|
| `getProjects(userId)` | mount | 프로젝트 목록 |
| `listRecords(userId, { projectId })` | mount | 진행률·스트릭 |
| `getTodayQuestion(projectId)` | mount | `daily_questions` 캐시 조회 |
| `generate-question` (Edge) | 캐시 없을 때 | AI 질문 생성 + INSERT |
| `getUnreadCount(userId)` | mount | 알림 뱃지 |

### Free / Pro 제한 분기

| 기능 | Free | Pro |
|------|------|-----|
| 오늘의 질문 생성 | 월 10회 (`ai_usage`: question + freewriting_hint) | 무제한 |
| 「전체보기」 (설계) | **숨김** (프로젝트 1개) | Pro + 프로젝트 2개 이상 |
| 홈 CTA | **항상 활성** (1일 1기록 제한 없음) | 동일 |

**구현 갭:** 「전체보기」는 현재 `projects.length > 1`이면 노출 (Pro 체크 없음).

**AI_LIMIT 시 (설계):** S-P1 Paywall — **홈에서는 미연동**, fallback 질문 또는 빈 상태 가능. S-08에서는 Paywall 연동됨.

### 에러 케이스

| 상황 | 동작 |
|------|------|
| `generate-question` → `AI_LIMIT` | `ApiError` throw; 홈 catch 없음 → fallback 문구 미표시 가능 |
| Edge Function 실패 | `questions.ts` 프로젝트 유형별 fallback 질문 |
| 로딩 중 | 「로딩 중...」 |
| projects = 0 | S-09 Empty |

### 오늘의 질문 규칙 (참고)

- 1일 1질문 (`daily_questions` UNIQUE project_id + question_date)
- KST 자정 이후 새 질문
- 컨텍스트: 최근 3 records 감정·내용

---

## S-11 / 알림 목록

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `NavBar` | 제목 「알림」, 「모두 읽음」(미읽음 있을 때) |
| 알림 리스트 | 타입별 아이콘, 제목, 본문, 상대 시간, 미읽음 dot |
| Empty | 알림 0개 → 🔔 + 「홈으로」 |

### 상태값

| Store / State | 필드 |
|---------------|------|
| `authStore` | `user` |
| 로컬 | `notifications[]`, `loading` |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 화면 진입 | `listNotifications(userId, 30)` |
| 알림 행 탭 | `markAsRead(id)` → `link` 있으면 navigate |
| 「모두 읽음」 | `markAllRead(userId)` |
| 「홈으로」 (Empty) | `/home` |
| ‹ 뒤로 | `navigate(-1)` |

### API / Edge Function

| API | 설명 |
|-----|------|
| `listNotifications()` | `notifications` SELECT, 최신 30건 |
| `markAsRead()` | `is_read = true` |
| `markAllRead()` | 미읽음 일괄 처리 |

**알림 생성 주체 (타 화면/백엔드):**

| type | 생성처 |
|------|--------|
| `daily_question` | `send-daily-reminder` Cron |
| `badge` | `records.ts` finalizeSave → `createBadgeNotifications` |
| `chapter_complete` | `generate-chapter` Edge |

### Free / Pro 제한 분기

- **없음** — 알림 수신·조회 플랜 무관

### 에러 케이스

| 상황 | 동작 |
|------|------|
| API 실패 | 빈 목록 또는 로딩 종료 |
| `link` null | 읽음 처리만, 화면 유지 |

### 알림 타입별 딥링크 (설계)

| type | link 예시 |
|------|-----------|
| `daily_question` | `/record/mode` |
| `badge` | `/home` |
| `chapter_complete` | `/book/chapter/:id` |

---

## S-12 / 기록 모드 선택

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `NavBar` | 「오늘의 기록 #N」, ← |
| `ModeSelectCard` × 3 | 질문 / 사진 / 자유 일기 |
| `Button` | 「선택한 모드로 시작」 |

### 상태값

| Store / State | 필드 |
|---------------|------|
| `projectStore` | `activeProject` (`useActiveProject`) |
| 로컬 | `selected` (question/photo/free), `recordNumber` |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 화면 진입 | `getRecordCount` → `#N = count + 1` |
| 모드 카드 탭 | `selected` 변경 |
| 「선택한 모드로 시작」 | `/record/write/{question\|photo\|free}` |
| ← | 이전 화면 |

### API / Edge Function

| API | 시점 |
|-----|------|
| `getRecordCount(projectId)` | mount |

### Free / Pro 제한 분기

- **없음** — 모드 선택 자체는 Free/Pro 동일

### 에러 케이스

| 상황 | 동작 |
|------|------|
| activeProject 없음 | 「로딩 중...」 (project 미로드) |

### 진입 조건 (설계)

- `project.record_mode === 'daily'` 일 때만 S-12 경유
- 고정 모드(question/photo/free)는 S-10·S-30에서 해당 작성 화면 직행

---

## S-13 / 질문 모드 작성

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `NavBar` | ✕ / 「저장」 |
| 질문 Card | 오늘의 질문 표시 |
| `Textarea` | 본문 (10~2000자) |
| `EmotionTagPicker` | 감정 태그 (선택) |
| `ExitConfirmModal` | ✕ 시 임시저장/삭제/계속 |

### 상태값

| Store / State | 필드 |
|---------------|------|
| `authStore` | `user` |
| `recordStore` | `editingRecord`, `setEditingRecord`, `setLastSave` |
| `projectStore` | `activeProject` |
| 로컬 | `question`, `content`, `emotions`, `recordNumber`, `saving`, `showExit`, `error` |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 신규 진입 | 오늘 질문 로드 + draft 복원 |
| 수정 진입 (`editingRecord`) | 기존 content/emotions/question prefill |
| 「저장」 | 유효성 검사 → `createRecord` 또는 `updateRecord` → S-16 |
| ✕ (dirty) | `ExitConfirmModal` |
| 임시저장 | `saveDraft` → `record_drafts` UPSERT → 이전 화면 |
| 삭제 후 나가기 | draft 무시, `editingRecord` clear → 이전 화면 |

### API / Edge Function

| API | 시점 |
|-----|------|
| `getTodayQuestion` / `generate-question` | 신규 작성 시 질문 로드 |
| `loadDraft` / `saveDraft` / `deleteDraft` | draft CRUD |
| `createRecord` / `updateRecord` | 저장 |
| `generate-chapter` | 저장 후 기록 10·20…번째 시 (백그라운드) |

**`createRecord` 후처리 (`finalizeSave`):**

- 진행률·스트릭·배지 계산
- `createBadgeNotifications` (streak 7/14/30, record 10/25/50)
- `recordCount % 10 === 0` → `generate-chapter` invoke

### Free / Pro 제한 분기

| 기능 | Free | Pro |
|------|------|-----|
| 질문 로드 시 AI 생성 | 월 10회 한도 (캐시 hit은 미차감) | 무제한 |
| 기록 저장 | **제한 없음** | 동일 |
| 챕터 자동 생성 | 3챕터까지 (4번째 CHAPTER_LIMIT) | 무제한 |

### 에러 케이스

| 상황 | UI |
|------|-----|
| content < 10자 | 「최소 10자 이상 작성해주세요.」 |
| content > 2000자 | 「최대 2000자까지...」 |
| DB/Storage 실패 | 「저장에 실패했어요. 다시 시도해주세요.」 |
| `generate-question` AI_LIMIT | throw (화면 catch 없음 → fallback 가능) |

### 유효성 (설계)

- `content`: 10~2000자
- `question_text`: 저장 시 오늘 질문 스냅샷
- `emotion_tags`: 선택

---

## S-14 / 사진 모드 작성

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| 사진 업로드 영역 | `<input type="file">` + 미리보기 |
| `Input` | 캡션 1~100자 |
| `EmotionTagPicker` | 감정 태그 |
| `ExitConfirmModal` | 나가기 확인 |

### 상태값

| Store / State | 필드 |
|---------------|------|
| `recordStore` | `editingRecord`, `setLastSave` |
| 로컬 | `caption`, `emotions`, `photoFile`, `photoPreview`, `existingPhotoPath`, `saving`, `error` |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 사진 영역 탭 | 파일 선택 → 미리보기 |
| 「저장」 | 사진 upload → `createRecord`/`updateRecord` → S-16 |
| 수정 시 사진 미변경 | `existingPhotoPath` 유지 |

### API / Edge Function

| API | 설명 |
|-----|------|
| `uploadRecordPhoto` | Storage `record-photos/{userId}/{projectId}/{uuid}.ext` |
| `getPhotoSignedUrl` | 수정 시 기존 사진 표시 |
| `createRecord` / `updateRecord` | `photo_url` + caption 저장 |
| `expand-caption` (설계) | **미구현** — AI 캡션 확장 |

### Free / Pro 제한 분기

- 기록 저장: Free/Pro 동일
- `expand-caption`: 설계상 선택 기능, **미구현**

### 에러 케이스

| 상황 | UI |
|------|-----|
| 사진 없음 | 「사진을 추가해주세요.」 |
| 캡션 0자 또는 >100자 | 「캡션은 1~100자로...」 |
| Storage upload 실패 | 「저장에 실패했어요...」 |

### 설계(v1.1) 대비

- ⚠️ Capacitor Camera 대신 HTML file input 사용
- ❌ AI 캡션 확장(`expand-caption`) 없음

---

## S-15 / 자유 일기 작성

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| AI 글감 배너 | `generate-freewriting-hint` 결과, 닫기 가능 |
| 제목 input | 선택 (미입력 시 날짜 기본 제목) |
| `Textarea` | 본문 10~5000자 |
| `EmotionTagPicker` | 감정 태그 |
| `ExitConfirmModal` | 임시저장 플로우 |

### 상태값

| Store / State | 필드 |
|---------------|------|
| `recordStore` | `editingRecord`, `setLastSave` |
| 로컬 | `hint`, `showHint`, `title`, `content`, `emotions`, `saving`, `error` |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 신규 진입 | AI 글감 로드 + draft 복원 |
| 글감 「닫기」 | `showHint = false` |
| 「저장」 | title 기본값 처리 → create/update → S-16 |
| 제목 미입력 | `"M월 D일"` 형식 자동 제목 |

### API / Edge Function

| API | 설명 |
|-----|------|
| `generate-freewriting-hint` | AI 글감 (Free: ai_usage `freewriting_hint` 카운트) |
| `loadDraft` / `saveDraft` / `deleteDraft` | draft (title, content, emotions) |
| `createRecord` / `updateRecord` | `mode: 'free'`, `title` optional |

### Free / Pro 제한 분기

| 기능 | Free | Pro |
|------|------|-----|
| AI 글감 | 월 10회 (question과 **합산**) | 무제한 |
| 기록 저장 | 무제한 | 동일 |

### 에러 케이스

| 상황 | UI |
|------|-----|
| content < 10자 | 「최소 10자 이상...」 |
| content > 5000자 | 「최대 5000자까지...」 |
| hint API 실패 | 프로젝트 유형별 fallback 글감 |
| 저장 실패 | 「저장에 실패했어요...」 |

---

## S-16 / 저장 완료

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| ✅ 아이콘 + 「N번째 기록 완성!」 | |
| Progress Card | 프로젝트명, 진행률 %, ProgressBar |
| 스트릭 Card | 2일+ 연속 시 표시 |
| 배지 Card | 신규 배지 제목 목록 |
| 「홈으로 돌아가기」 | |

### 상태값

| Store | 필드 |
|-------|------|
| `recordStore` | `lastSave`, `lastProject`, `clearLastSave` |

**`lastSave` 구조 (`SaveRecordResult`):**

```typescript
{
  record, recordCount, progress, streak, badgeTitles[]
}
```

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 화면 진입 | `lastSave` 없으면 `/home` replace |
| 「홈으로 돌아가기」 | `clearLastSave()` → `/home` |

### API / Edge Function

- **직접 호출 없음** — S-13~15 저장 결과를 store에서 표시
- 백그라운드: 10번째 기록 시 `generate-chapter`, 배지 시 `notifications` INSERT

### Free / Pro 제한 분기

| 상황 | Free | Pro |
|------|------|-----|
| 10번째 기록 → 챕터 생성 | 1~3챕터 OK, 4번째 CHAPTER_LIMIT | 무제한 |
| CHAPTER_LIMIT 시 | 설계: S-P1 + 안내 — **S-16 UI 미연동** (Edge만 402) |

### 에러 케이스

| 상황 | 동작 |
|------|------|
| store 비어 있음 | 즉시 `/home` redirect |
| deep link 직접 접근 | 동일 |

### 설계(v1.1) 대비

- ✅ N번째 완성, 진행률, 스트릭, 배지
- ⚠️ CHAPTER_LIMIT → Paywall 안내 UI 없음

---

## S-30 / 기록 목록

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `NavBar` | 「기록」, 「+ 기록」 |
| 프로젝트 `Chip` 필터 | Pro 다중 프로젝트 시 (projects > 1) |
| 월별 그룹 헤더 | 「2026년 6월」 |
| 기록 행 | 일(day), 요일, #N·모드, preview, 감정 태그 |
| `EmptyState` | records=0 |

### 상태값

| Store / State | 필드 |
|---------------|------|
| `authStore` | `user` |
| `useProjectList` | `projects[]` |
| 로컬 | `records[]`, `filterProjectId`, `loading` |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 화면 진입 | `listRecords(userId, { limit: 50 })` |
| Chip 「전체」/프로젝트 | filter 변경 → 재조회 |
| 기록 행 탭 | `/records/:id` (S-31) |
| 「+ 기록」 | `record_mode`에 따라 S-12 또는 S-13~15 직행 |

### API / Edge Function

| API | 설명 |
|-----|------|
| `listRecords()` | `is_draft=false`, created_at DESC |
| `getProjects()` | 필터 Chip용 |

### Free / Pro 제한 분기

| 기능 | Free | Pro |
|------|------|-----|
| 목록 조회 | 본인 기록 전체 | 동일 |
| 프로젝트 필터 Chip | projects > 1일 때 (Pro 다프로젝트 시나리오) | 동일 |

### 에러 케이스

| 상황 | UI |
|------|-----|
| projects=0 & records=0 | `EmptyState variant="records"` (탭만) |
| records=0 (프로젝트 있음) | NavBar + Empty |
| 로딩 | 「로딩 중...」 |

### preview 규칙

- `free` + title 있음 → title 표시
- 그 외 → content 60자 truncate

---

## S-31 / 기록 상세

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `NavBar` | ← / ··· |
| `Badge` | 모드 라벨 |
| 질문 Card | question 모드만 |
| 제목 | free 모드 |
| 사진 | photo 모드 (signed URL) |
| 본문 | serif 스타일 |
| 감정 태그 pill | |
| 챕터 정보 | `chapter_id` 있을 때 |
| `RecordActionSheet` | S-32 |
| 삭제 `Modal` | 2차 확인 |

### 상태값

| Store / State | 필드 |
|---------------|------|
| `authStore` | `user` |
| `recordStore` | `setEditingRecord` |
| 로컬 | `record`, `chapter`, `photoUrl`, `sheetOpen`, `deleteOpen`, `deleting` |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 화면 진입 | `getRecord(id)`, photo signed URL, chapter 조회 |
| ··· | S-32 바텀시트 open |
| ← | `/records` 또는 history back |
| record 없음 | `/records` replace |

### API / Edge Function

| API | 설명 |
|-----|------|
| `getRecord(id)` | 단건 |
| `getPhotoSignedUrl(path)` | Storage 1h URL |
| `chapters` SELECT | chapter_id FK |
| `deleteRecord` | S-32 → 삭제 Modal 확인 후 |

### Free / Pro 제한 분기

- **없음**

### 에러 케이스

| 상황 | 동작 |
|------|------|
| invalid id / 404 | `/records` redirect |
| photo URL 실패 | 사진 영역 미표시 |
| 삭제 실패 | Modal 유지 (에러 UI 미세) |

---

## S-32 / 기록 액션 시트

> S-31 위 BottomSheet. 별도 라우트 없음.

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `BottomSheet` | |
| 「✏️ 기록 수정하기」 | |
| 「🗑 기록 삭제」 | |

### 상태값

- S-31 로컬: `sheetOpen`, `deleteOpen`
- `recordStore.editingRecord` — 수정 시 설정

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 「기록 수정하기」 | `setEditingRecord(record)` → mode별 S-13/14/15 |
| 「기록 삭제」 | 삭제 확인 Modal (S-31) |
| 시트 바깥 탭 | close |

### API / Edge Function

| API | 액션 |
|-----|------|
| `deleteRecord(id, userId)` | 삭제 확인 후 |
| (수정) | S-13~15에서 `updateRecord` |

### Free / Pro 제한 분기

- **없음**

### 에러 케이스

| 상황 | 동작 |
|------|------|
| 삭제 중 | 버튼 「삭제 중...」, disabled |

### 설계(v1.1) 대비

| 설계 | 구현 |
|------|------|
| 수정 / **챕터 변경** / 삭제 3옵션 | 수정 + 삭제 **2옵션만** |
| 챕터 변경 시 record_ids 동기화 | ❌ 미구현 |

---

## Phase 3 공통: Zustand Store 요약

### `authStore`

| 필드 | Phase 3 사용처 |
|------|----------------|
| `user`, `profile` | 모든 화면 |

### `projectStore`

| 필드 | Phase 3 사용처 |
|------|----------------|
| `activeProject` | S-12~15, 기록 저장 |
| `setActiveProject` | S-10 mount |

### `recordStore`

| 필드 | Phase 3 사용처 |
|------|----------------|
| `lastSave`, `lastProject` | S-16 |
| `editingRecord` | S-13~15 수정, S-31→S-32 |
| `setLastSave`, `clearLastSave` | 저장 완료 플로우 |

### `paywallStore` (Phase 3 연동 제한)

| 트리거 (설계) | Phase 3 연동 |
|---------------|--------------|
| AI_LIMIT (질문/글감) | S-08만 연동; **S-10/S-13/S-15 미연동** |
| CHAPTER_LIMIT | S-16/S-10 **미연동** |

---

## Phase 3 공통: Edge Function · API 맵

```
S-10 ── getTodayQuestion ──► daily_questions
     └── generate-question ──► AI + daily_questions + ai_usage

S-13 ── generate-question (캐시 miss)
     └── createRecord/updateRecord ──► records
              └── finalizeSave ──► badges, generate-chapter (×10)

S-14 ── uploadRecordPhoto ──► Storage
     └── createRecord/updateRecord

S-15 ── generate-freewriting-hint
     └── createRecord/updateRecord

S-30 ── listRecords
S-31 ── getRecord, deleteRecord
S-11 ── listNotifications, markAsRead
```

---

## Phase 3 구현 갭 (v1.1 대비)

| # | 항목 | 설계 | 현재 |
|---|------|------|------|
| 1 | S-10 전체보기 | Pro + projects≥2 | projects≥2만 체크 |
| 2 | S-32 챕터 변경 | 3옵션 | 2옵션 |
| 3 | S-14 expand-caption | AI 캡션 | 미구현 |
| 4 | AI_LIMIT Paywall | S-10/S-13/S-15 | S-08만 |
| 5 | CHAPTER_LIMIT UI | S-16/홈 | Edge만 402 |
| 6 | S-10b | Pro 프로젝트 목록 | placeholder |

---

## 관련 문서

- `docs/01-routing-and-flows.md` — 플로우
- `docs/04-business-rules.md` — 스트릭·배지·유효성
- `docs/03-edge-functions-api.md` — Edge API 상세
- `docs/07-dev-progress.md` — 전체 구현 현황

**다음 Phase 명세:** Phase 4 (내 책), Phase 5 (마이·결제) — 별도 문서 예정
