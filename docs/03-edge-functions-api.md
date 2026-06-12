# MyChapter — Edge Functions & API

모든 Function: `Authorization: Bearer <supabase_jwt>` 필수 (Cron·웹훅 제외).

---

## 1. `generate-question`

**POST** `/functions/v1/generate-question`

### Request

```json
{
  "project_id": "uuid"
}
```

서버에서 project, recent 3 records, ai_usage 조회.

### Response

```json
{ "question": "오늘 가장 마음이 따뜻해지는 순간이 있었나요?" }
```

### 로직

1. `daily_questions`에 오늘 질문 있으면 캐시 반환 (ai_usage 미증가)
2. Free: 이번 달 `ai_usage WHERE feature='question'` COUNT >= 10 → 402 + `{ code: 'AI_LIMIT' }`
3. Claude `claude-sonnet-4-6` 호출
4. `daily_questions` INSERT, `ai_usage` INSERT

---

## 2. `generate-freewriting-hint`

**POST** `/functions/v1/generate-freewriting-hint`

```json
{ "project_id": "uuid" }
```

```json
{ "hint": "오늘 하루 중 예상과 달랐던 순간을 떠올려보세요." }
```

Free: `freewriting_hint`는 ai_usage **질문 쿼터에 포함** (동일 10회).

---

## 3. `generate-chapter`

**POST** `/functions/v1/generate-chapter`

```json
{
  "project_id": "uuid",
  "record_ids": ["uuid", "..."]   // 정확히 10개
}
```

```json
{
  "chapter_id": "uuid",
  "chapter_number": 1,
  "chapter_title": "시작의 감정들",
  "chapter_content": "..."
}
```

### 로직

1. Free: 기존 완성 챕터 >= 3 → 402 `{ code: 'CHAPTER_LIMIT' }`, S-P1 트리거용
2. records 내용 종합 → Claude
3. `chapters` INSERT (`ai_content`, `record_ids`, `is_complete=true`)
4. `records.chapter_id` UPDATE
5. `notifications` INSERT (chapter_complete)
6. `ai_usage` INSERT feature=`chapter`

---

## 4. `regenerate-chapter` (S-19)

**POST** `/functions/v1/regenerate-chapter`

```json
{ "chapter_id": "uuid" }
```

기존 `record_ids`로 재생성 → `ai_content` 덮어쓰기, `user_content` NULL.

---

## 5. `expand-caption` (S-14, 선택)

**POST** `/functions/v1/expand-caption`

```json
{ "caption": "오늘 편의점에서 만난 반가운 얼굴", "project_id": "uuid" }
```

```json
{ "expanded": "편의점 문을 나서는데..." }
```

클라이언트: "AI로 확장하기" 버튼 탭 시만 호출, 적용은 사용자 확인 후.

---

## 6. `generate-pdf`

**POST** `/functions/v1/generate-pdf`

```json
{
  "project_id": "uuid",
  "cover_template_id": "cover_01"
}
```

```json
{
  "pdf_url": "https://.../signed-url",
  "page_count": 88
}
```

### 로직

1. Free → 402 `{ code: 'PDF_PRO_ONLY' }`
2. chapters `ORDER BY sort_order`, display_content 조합
3. `@react-pdf/renderer`로 PDF 생성
4. Storage `published-pdfs` 업로드
5. `published_books` UPSERT
6. `projects.is_completed = true`

---

## 7. `verify-subscription`

**POST** `/functions/v1/verify-subscription`

```json
{
  "purchase_token": "string",
  "product_id": "mychapter_pro_monthly"
}
```

Google Play Developer API로 검증 → `subscriptions` UPDATE plan=`pro`.

---

## 8. `delete-account`

**POST** `/functions/v1/delete-account`

```json
{ "confirm": true }
```

1. Play 구독 취소 API (있을 경우)
2. Storage 객체 삭제
3. `auth.admin.deleteUser(uid)` — CASCADE로 public 데이터 삭제

클라이언트: S-W1에서 2단계 확인 후 호출.

---

## 9. `send-daily-reminder` (Cron)

**POST** (내부/Cron only, `service_role`)

매일 **분 단위 스캔** (또는 21:00 KST 일괄):

1. `users WHERE notification_enabled AND notification_time = now()`
2. 오늘 해당 project에 record 없는 활성 프로젝트
3. FCM 발송: "오늘의 질문이 도착했어요 ✍️", link=`/record/mode`
4. `notifications` INSERT type=`daily_question`

---

## 10. `on-record-saved` (선택 통합)

기록 저장 후 클라이언트가 호출하거나 DB webhook:

```json
{ "record_id": "uuid" }
```

1. 진행률 계산 (클라이언트도 가능)
2. 스트릭·배지 계산 → 해당 시 `notifications` INSERT
3. 미할당 기록 10개 → `generate-chapter` 큐

---

## 11. 클라이언트 API 모듈 (`src/lib/api/`)

```
auth.ts           signIn OAuth, OTP, signOut
users.ts          updateProfile, completeOnboarding
projects.ts       CRUD, list, getActive
records.ts        list (paginated), get, create, update, delete, moveChapter
chapters.ts       list, get, updateUserContent
questions.ts      getTodayQuestion → generate-question
subscriptions.ts  getPlan, purchase flow
notifications.ts  list, markAllRead
books.ts          publish, getPdfUrl
```

---

## 12. 에러 코드 (공통)

| code | HTTP | UI |
|------|------|-----|
| `AI_LIMIT` | 402 | S-P1 |
| `PROJECT_LIMIT` | 402 | S-P1 |
| `CHAPTER_LIMIT` | 402 | S-P1 |
| `PDF_PRO_ONLY` | 402 | S-P1 |
| `UNAUTHORIZED` | 401 | → /login |
| `AI_TIMEOUT` | 504 | 토스트 + 재시도 |
