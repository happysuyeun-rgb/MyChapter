# MyChapter — 비즈니스 규칙

---

## 1. AI 루틴 계산 (S-06)

```typescript
type PeriodDays = 30 | 100 | 180 | 365;
type Frequency = 'daily' | 'week5' | 'week3' | 'week1';

const RECORDS_PER_WEEK: Record<Frequency, number> = {
  daily: 7,
  week5: 5,
  week3: 3,
  week1: 1,
};

function calculateRoutine(periodDays: PeriodDays, frequency: Frequency, startDate = new Date()) {
  const weeks = periodDays / 7;
  const targetCount = Math.ceil(weeks * RECORDS_PER_WEEK[frequency]);
  const estimatedPages = Math.ceil(targetCount * 1.2);
  const targetDate = addDays(startDate, periodDays);
  return { targetCount, estimatedPages, targetDate };
}
```

**예:** 100일 + 주 5회 → `ceil(100/7 * 5)` = **72개**, 약 **86p**

칩 변경 시 S-06에서 실시간 재계산 (DB 저장은 S-07 완료 시).

---

## 2. 진행률

```typescript
progress = Math.min(100, Math.round((recordCount / project.target_count) * 100));
remaining = Math.max(0, project.target_count - recordCount);
```

`is_completed`: `recordCount >= target_count` 또는 사용자 수동 완료(S-17).

---

## 3. 스트릭 & 배지

### 3.1 연속 일수 (Streak)

```typescript
function calculateStreak(records: { created_at: string }[], timezone = 'Asia/Seoul'): number {
  const daysWithRecords = new Set(
    records.map(r => formatInTimeZone(r.created_at, timezone, 'yyyy-MM-dd'))
  );
  let streak = 0;
  let cursor = startOfDayInTz(new Date(), timezone);
  while (daysWithRecords.has(format(cursor, 'yyyy-MM-dd'))) {
    streak++;
    cursor = subDays(cursor, 1);
  }
  return streak;
}
```

- 오늘 기록 없어도 **어제까지** streak 유지 (오늘 포함 역산)
- 자정 KST 기준

### 3.2 배지 알림

| 조건 | 알림 제목 |
|------|-----------|
| streak 7 | 7일 연속 기록 달성! 🔥 |
| streak 14 | 2주 완주 배지를 획득했어요 |
| streak 30 | 30일 연속 기록! 🏆 |
| records 10 | 10번째 기록 달성 |
| records 25 | 25번째 기록 달성 |
| records 50 | 50번째 기록 달성 |

동일 배지 중복 발송 방지: `notifications`에 metadata `{ badge_key: 'streak_7' }` 또는 클라이언트 플래그.

---

## 4. 챕터 자동 생성

### 4.1 트리거

- 프로젝트 내 **chapter_id IS NULL** 인 records가 **10개** 쌓이면 생성
- 11~20 → CH2, 21~30 → CH3 …

### 4.2 Free 3챕터 제한

- CH1~CH3: 정상 생성
- 4번째 트리거(기록 31~40): 생성 **보류**, records는 `chapter_id` null 유지
- S-16 또는 홈에서 "챕터 구성을 위해 Pro가 필요해요" + S-P1
- Pro 전환 후: 보류된 10개로 `generate-chapter` 수동/자동 실행

### 4.3 챕터 변경 (S-32)

1. 사용자가 CH2 선택
2. `records.chapter_id` UPDATE
3. 양쪽 챕터 `record_ids` 배열 동기화
4. **AI 재생성 없음** — 원고는 S-19에서 수동 재생성

### 4.4 드래그 재정렬 (S-17 편집 모드)

- `chapters.sort_order` UPDATE only
- `chapter_number`는 sort_order 기반 재부여

---

## 5. 오늘의 질문

| 규칙 | 내용 |
|------|------|
| 생성 시점 | 홈 첫 진입 또는 S-08 완료 시 |
| 캐시 | `daily_questions` 1일 1건 |
| 재생성 | 당일 불가 (MVP) |
| 컨텍스트 | 최근 3 records 감정·내용 100자 요약 |

---

## 6. 기록 유효성

| 모드 | 필드 | 규칙 |
|------|------|------|
| question | content | 10~2000자 |
| photo | photo_url, content(캡션) | 캡션 1~100자, 사진 필수 |
| free | content | 10~5000자, title 선택 |

**중복 기록:** MVP에서 **1일 1기록 제한 없음** (여러 번 작성 허용). 홈 CTA는 항상 활성.

---

## 7. 임시저장 (S-13, S-15)

✕ 탭 시:

```
┌─────────────────────────┐
│ 작성 중인 내용이 있어요   │
│ [임시저장 후 나가기]      │
│ [삭제 후 나가기]         │
│ [계속 작성]              │
└─────────────────────────┘
```

- `record_drafts` UPSERT
- 재진입 시 draft 로드 제안

---

## 8. AI 사용량 (Free)

```sql
-- 이번 달 질문류 사용량
SELECT COUNT(*) FROM ai_usage
WHERE user_id = $1
  AND feature IN ('question', 'freewriting_hint')
  AND created_at >= date_trunc('month', now());
```

`chapter`, `chapter_regenerate`, `caption_expand`는 MVP에서 **Pro 전용** 또는 Free 월 10회에 **미포함** (챕터 3개까지 자동 생성은 서비스 제공으로 카운트 제외).

---

## 9. 회원 탈퇴 (S-W1)

1. (선택) `generate-pdf` 일괄 — 완성 프로젝트만
2. 최종 확인: "계정 삭제" 텍스트 입력 또는 2차 다이얼로그
3. `delete-account` Edge Function
4. 로컬 세션 클리어 → S-02

---

## 10. S-P1 결제 성공 후

1. `subscriptions.plan = 'pro'`
2. 팝업 닫기
3. `pendingAction` 실행 (PDF 다운로드, 프로젝트 생성, 챕터 생성 등)

```typescript
// zustand 예시
interface PaywallStore {
  pendingAction: (() => void) | null;
  showPaywall: (action?: () => void) => void;
}
```
