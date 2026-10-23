# MyChapter — 기능별 에러 케이스 (코드 점검)

> **Status:** CURRENT (code-audited)  
> **최종 갱신:** 2026-10-23  
> **기준:** `src/` + `supabase/functions/*` 실코드  
> **관련:** `14_API_SPEC.md`, `16_QA_E2E.md`, `17-test-report.md`, `19-gap-and-ux-plan.md`  
> **참고:** 화면 스펙(`10`~`14-screen-spec-*`)의「에러 케이스」는 구버전이며, **이 문서가 우선**한다.

---

## 0. 읽는 법

| 표기 | 의미 |
|------|------|
| **handled** | 사용자에게 안내·재시도·Paywall 등 의도된 피드백이 있음 |
| **partial** | 일부만 처리(폴백·스텁·오탐 가능) |
| **gap** | 무한 로딩 / silent / console만 / 오분기 |
| **[도달 의심]** | 클라이언트에 코드 분기는 있으나, Supabase `functions.invoke`가 비-2xx에서 `data: null`을 반환해 **서버 `code`를 못 읽을 가능성**이 큼 → 실기 검증 필요 |

**UI 패턴:** `ErrorState` · `inline` · `Toast` · `Paywall` · `Modal` · `redirect` · `silent` · `console`

---

## 1. 최우선 이슈 (문서·수정 공통)

### 1-A. Edge Function `code` 전달 끊김 **[도달 의심]**

`supabase.functions.invoke`는 HTTP 4xx/5xx일 때 `error`를 채우고 `data`는 보통 `null`이다.  
클라이언트는 대부분 `response.data.code`만 본다.

| 서버가 보내는 코드 | HTTP 예 | 클라이언트가 기대하는 처리 | 실제에 가까운 결과 |
|--------------------|---------|----------------------------|--------------------|
| `AI_LIMIT` | 402 | Paywall + 폴백 | 폴백만 / Paywall 미표시 |
| `NOT_ENOUGH_MATERIAL` | 400 | 기록 부족 안내 | 일반 「챕터 생성 실패」 |
| `PUBLICATION_LIMIT` 등 | 402/409 | Paywall / 전용 문구 | 일반 PDF 실패 문구 |
| `INVALID_PURCHASE` | 402 | 검증 실패 세분화 | `VERIFY_FAILED`로 뭉개짐 |

**수정 방향 (택1):** `FunctionsHttpError` 본문 JSON 파싱, 또는 Edge를 200 + `{ code }` 계약으로 통일.

### 1-B. 로드 실패 → 무한 로딩이 넓음

`ErrorState`+재시도가 있는 곳: **홈 · 기록 목록 · 책(챕터) · 알림** 4곳뿐.  
그 외 다수는 `try/catch` 없이 `loading`이 풀리지 않음.

---

## 2. 기능별 에러 케이스

### 2.1 인증 · 스플래시

| 케이스 | 현재 동작 | 패턴 | 상태 |
|--------|-----------|------|------|
| OAuth 시작 실패 (Kakao/Google) | 「로그인을 시작하지 못했어요…」 | inline | handled |
| OAuth/매직링크 복귀 실패·취소 (`error_description`) | 안내 없이 `/login` 등 | silent + redirect | **gap** |
| 이메일 링크 발송 실패 | `sent=false`, 오류 문구 (401 구분) | inline | handled |
| 발송 rate-limit 등 | 서버 영문 message 그대로 | inline | partial |
| Splash `getSession` throw | 앱 전체 「로딩 중…」 고정 | silent | **gap** |
| 프로필 조회 실패 (`profile=null`) | 온보딩 닉네임으로 오분기 | redirect | **gap** |
| Guard: 세션 만료 | `/login` (복귀·안내 없음) | redirect | partial |
| `VITE_SUPABASE_*` 미설정 | placeholder 클라이언트 → 이후 전부 실패 | silent | **gap** |
| 전역 렌더 예외 | ErrorBoundary/`errorElement` 없음 | 기본 화면 | **gap** |

### 2.2 온보딩

| 케이스 | 현재 동작 | 패턴 | 상태 |
|--------|-----------|------|------|
| 닉네임 형식 불일치 | 버튼 비활성 (전용 에러문구 없음) | silent | partial |
| 닉네임 저장 실패 | 「닉네임 저장에 실패했어요…」 | inline | handled |
| 알림 설정 저장 실패 | 「알림 설정을 저장하지 못했어요…」 | inline | handled |
| 「알림 받기」 | DB 플래그만, OS 권한은 나중에 push init | — | partial |

### 2.3 프로젝트(책) 생성 · 서재

| 케이스 | 현재 동작 | 패턴 | 상태 |
|--------|-----------|------|------|
| Free 한도에서 타입 선택 / 서재 「새 책」 | Paywall | Paywall | handled |
| Free INSERT (`FREE_PROJECT_LIMIT`) | Free 한도 문구 (Paywall 미연결) | inline | partial |
| 그 외 생성 실패 | 「책을 시작하지 못했어요…」 | inline | handled |
| `useProjectLimit` / 서재 로드 실패 | 무한 로딩 | silent | **gap** |
| `getSubscriptionPlan` 네트워크 오류 | `'free'`로 위장 → Pro 오탐 Paywall 가능 | silent | **gap** |
| 책 설정 저장 실패 | 「책 설정을 저장하지 못했어요…」 | inline | handled |

### 2.4 홈

| 케이스 | 현재 동작 | 패턴 | 상태 |
|--------|-----------|------|------|
| 홈 데이터 로드 실패 | 「홈을 불러오지 못했어요」+ 다시 시도 | ErrorState | handled |
| 프로젝트 0개 | EmptyState | Empty | handled |
| 알림 개수만 실패 | 홈 전체 ErrorState (과차단) | ErrorState | partial |
| 오늘의 질문 / AI_LIMIT | Home에서는 AI 미호출 (질문 작성 화면에서만) | — | n/a |

### 2.5 기록 작성 (질문 · 사진 · 자유)

| 케이스 | 현재 동작 | 패턴 | 상태 |
|--------|-----------|------|------|
| 본문/캡션 유효성 | 최소·최대 길이 인라인 메시지 | inline | handled |
| 저장 실패 | 「저장에 실패했어요…」 | inline | handled |
| 사진 없음 | 「사진을 추가해주세요.」 | inline | handled |
| 사진 형식·용량 | 검증 없음 (`accept=image/*`만) | — | **gap** |
| 자유일기 초안 로드/임시저장 실패 | 전용 안내 문구 | inline | handled |
| 질문·사진 임시저장 실패 | catch 없음 → unhandled | silent | **gap** |
| AI 질문/힌트 일반 실패 | 타입별 폴백 (조용히) | silent | handled(의도) |
| `AI_LIMIT` | Paywall+폴백 코드 있음 **[도달 의심]** → 폴백만 될 수 있음 | Paywall / silent | partial |
| `useActiveProject` 실패 | 무한 로딩 | silent | **gap** |
| 저장 완료 화면 직접 URL | `/home` redirect | redirect | handled |

### 2.6 기록 목록 · 상세 · 삭제

| 케이스 | 현재 동작 | 패턴 | 상태 |
|--------|-----------|------|------|
| `listRecords` 실패 | 「기록을 불러오지 못했어요」+ 재시도 | ErrorState | handled |
| `useProjectList` 실패 | LoadingBlock만 지속 (ErrorState 가림) | silent | **gap** |
| 상세 없음 | `/records` redirect (안내 없음) | redirect | handled |
| 상세 네트워크 throw | 무한 로딩 | silent | **gap** |
| 삭제 실패 | `deleting` 고정 + unhandled | silent | **gap** |
| 사진 서명 URL 실패 | 이미지만 생략 | silent | partial |
| 목록 50개 초과 | 페이지네이션 없음 → 미표시 | silent | **gap** |

### 2.7 책 · 챕터

| 케이스 | 현재 동작 | 패턴 | 상태 |
|--------|-----------|------|------|
| 챕터 목록 로드 실패 | 「책을 불러오지 못했어요」+ 재시도 | ErrorState | handled |
| 미배정 기록 &lt; 3 | 생성 버튼 숨김 + 안내 | inline | handled |
| `NOT_ENOUGH_MATERIAL` | 전용 메시지 코드 있음 **[도달 의심]** | inline | partial |
| 생성 일반 실패 | 「챕터를 만들지 못했어요…」 | inline | handled |
| `CHAPTER_LIMIT` | **코드·Edge 모두 없음** (구문서 잔재) | — | 문서 불일치 |
| 순서 변경 실패 | 목록 롤백, 안내 없음 | silent | partial |
| 편집 저장 실패 | Toast 「저장에 실패했어요…」 | Toast | handled |
| NavBar 저장 | 빈 값 검증 없이 호출 가능 | — | **gap** |
| AI 재생성 실패 | catch 없음 | silent | **gap** |
| 프리뷰/편집 로드 throw | 무한 로딩 | silent | **gap** |

### 2.8 표지 · 원고 · PDF 발행

| 케이스 | 현재 동작 | 패턴 | 상태 |
|--------|-----------|------|------|
| BookStageGuard 권한 조회 실패 | 인라인 + 다시 시도 | inline | handled |
| 단계 미충족 | 이전 단계로 redirect | redirect | handled |
| 원고/표지/최종검수 로드 실패 | 다수 무한 로딩 | silent | **gap** |
| 원고 확인 저장 실패 | 인라인 안내 | inline | handled |
| Pro 표지 + Free | Paywall | Paywall | handled |
| 표지 저장 실패 | Toast (로컬 선택은 이미 바뀜) | Toast | partial |
| Free 첫 발행 소진 (`canPublishBook`) | Paywall (실질 방어선) | Paywall | handled |
| 서버 `PUBLICATION_LIMIT` 등 | **[도달 의심]** → 일반 실패 문구 | inline / Paywall | partial |
| `PUBLICATION_IN_PROGRESS` | 코드는 있으나 UI 미분기 | inline | **gap** |
| PDF 일반 실패 | 「PDF 생성 중 문제가…」+ 다시 시도 | inline | handled |
| 발행 상태 store 잔존 | 재진입 시 이전 FAILED 남을 수 있음 | inline | **gap** |
| 발행본 PDF 열기 실패 | 전용 인라인 문구 | inline | handled |

### 2.9 알림

| 케이스 | 현재 동작 | 패턴 | 상태 |
|--------|-----------|------|------|
| 목록 로드 실패 | ErrorState + 재시도 | ErrorState | handled |
| 빈 목록 | 전용 Empty + 홈 CTA | Empty | handled |
| 읽음 / 모두 읽음 실패 | unhandled, UI 무반응 | silent | **gap** |
| `link` 검증 | 인앱은 `/` 시작 검사 없음 (푸시는 있음) | — | partial |

### 2.10 마이페이지 · 설정 · 구독 · 탈퇴

| 케이스 | 현재 동작 | 패턴 | 상태 |
|--------|-----------|------|------|
| 통계 로드 실패 | 0처럼 보임 | silent | **gap** |
| 플랜 조회 실패 | `'free'` 위장 | silent | **gap** |
| 설정(알림·시간·닉네임·이모지) 저장 실패 | 피드백 없음 | silent | **gap** |
| 닉네임 규칙 위반(설정) | 버튼 눌러도 무반응 | silent | **gap** |
| 구독 「구매 복원하기」 | Toast 「모바일 앱에서…」만 (스텁) | Toast | partial |
| 계정 삭제 확인문구 불일치 | 버튼 비활성 | silent | handled |
| 계정 삭제 Edge 실패 | 「계정 삭제에 실패했어요…」 | inline | handled |
| 완성한 책 목록 실패 | 빈 상태로 오표시 | Empty(오표시) | **gap** |

### 2.11 Paywall · 결제

| 케이스 | 현재 동작 | 패턴 | 상태 |
|--------|-----------|------|------|
| 웹/브리지 없음 | 「모바일 앱에서 결제해주세요.」 등 | inline | handled |
| 네이티브 모듈 없음 | `NATIVE_UNAVAILABLE` 문구 | inline | handled |
| 사용자 취소 | 실패와 구분 없음 | inline | partial |
| 영수증 검증 실패 | 「결제 검증에 실패했어요.」 / 복구 경로 없음 | inline | **gap** |
| `INVALID_PURCHASE` | **[도달 의심]** | inline | partial |
| 모달 재오픈 | 이전 `error` 잔존 가능 | inline | partial |

### 2.12 푸시

| 케이스 | 현재 동작 | 패턴 | 상태 |
|--------|-----------|------|------|
| 권한 거부 | 조용히 return, 설정은 ON 유지 가능 | silent | **gap** |
| Android `daily_reminder` 채널 | 등록 전 생성 (필수) | — | handled(부분) |
| `registrationError` | `console.error`만 | console | **gap** |
| 토큰 upsert 실패 | UI 없음 | silent | **gap** |
| 로그아웃 시 토큰 정리 | `removeDeviceToken` 미사용 | silent | **gap** |

---

## 3. API / Edge 에러 코드 맵

### 3.1 클라이언트 클래스

| 클래스 | code | 의도 UI | 비고 |
|--------|------|---------|------|
| `ApiError` | `AI_LIMIT` | Paywall + 폴백 | **[도달 의심]** |
| `ChapterApiError` | `NOT_ENOUGH_MATERIAL` | 인라인 | **[도달 의심]** |
| `ChapterApiError` | `CHAPTER_GENERATE_FAILED` | 인라인 | `response.error` 경로 |
| `BookApiError` | `PUBLICATION_LIMIT` | Paywall | 로컬 `canPublishBook`이 실질 방어 |
| `BookApiError` | `PUBLICATION_IN_PROGRESS` | (미분기) | **gap** |
| `BookApiError` | `REVIEW_REQUIRED` 등 | 인라인 | **[도달 의심]**, 서버가 영문 code를 message로 보낼 수 있음 |
| `BookApiError` | `PDF_GENERATE_FAILED` | 인라인 | |
| `BillingError` | `WEB_UNAVAILABLE` / `NATIVE_UNAVAILABLE` | PaywallModal | |
| `SubscriptionApiError` | `VERIFY_FAILED` | PaywallModal | |

문서·옛 스펙의 `CHAPTER_LIMIT` / `PROJECT_LIMIT` / `PDF_PRO_ONLY`는 **현재 Edge·클라에 없음** (또는 클라에서만 별칭).

### 3.2 Edge Function HTTP (요약)

| Function | 대표 실패 | HTTP |
|----------|-----------|------|
| `generate-question` / `generate-freewriting-hint` | `AI_LIMIT`, Unauthorized | 402 / 401 / 5xx |
| `generate-chapter` | `NOT_ENOUGH_MATERIAL` | 400 / 401 / 5xx |
| `regenerate-chapter` | Chapter not found | 401 / 404 / 5xx |
| `generate-pdf` | `PUBLICATION_LIMIT`, review/cover mismatch, in-progress | 402 / 409 / 401 / 404 / 5xx |
| `verify-subscription` | Missing data, Invalid product, Dev not enabled, `INVALID_PURCHASE` | 400 / 403 / 503 / 402 |
| `delete-account` | Confirmation / Unauthorized | 400 / 401 / 5xx |
| `send-daily-reminder` | CRON 불일치 | 401 / 5xx |

---

## 4. Toast / ErrorState 사용 현황

| 패턴 | 사용처 (현재) |
|------|----------------|
| **ErrorState** | Home, RecordsList, BookPage, Notifications |
| **Toast** | ChapterEdit 저장 실패, BookCover 표지 저장 실패, Subscription 복원 스텁 |
| **Paywall** | Free 한도·발행 한도·Pro 표지·(의도) AI_LIMIT |

---

## 5. 우선 수정 백로그 (에러 UX)

| 우선 | 항목 | 이유 |
|------|------|------|
| P0 | Edge `invoke`에서 비-2xx body/`code` 파싱 | Paywall·발행 사유·AI 한도가 실제로 안 탈 수 있음 |
| P0 | `getSubscriptionPlan` 실패를 `'free'`로 숨기지 않기 | Pro 오탐 Paywall |
| P1 | 로드 화면 ErrorState 확대 (서재·상세·원고·표지·최종검수·설정 등) | 무한 로딩 |
| P1 | 기록 삭제 / 알림 읽음 / 챕터 재생성 catch + 안내 | 버튼 고정·무반응 |
| P1 | 결제 검증 실패·취소 구분 + 복원 실연동 | 돈 관련 신뢰 |
| P2 | OAuth/매직링크 복귀 `error_description` 표시 | 로그인 이탈 |
| P2 | Splash 프로필/세션 실패 ≠ 온보딩 오분기 | 계정 루프 |
| P2 | Settings 저장 실패 피드백 | 스펙 불일치 |
| P2 | Push 권한 거부 시 설정 UI 정합 | ON인데 알림 없음 |
| P3 | 전역 ErrorBoundary, CompletedBooks 오표시, 목록 페이지네이션 | 품질 |

---

## 6. QA 체크리스트 (수동)

실로그인(`VITE_DEV_BYPASS=false`) 후 아래를 한 번씩 확인한다.

- [ ] 이메일 링크 발송 실패 → 입력 화면에 한국어/상태 코드 안내
- [ ] 네트워크 차단 후 홈/기록/책/알림 → ErrorState + 재시도
- [ ] AI 한도(또는 402 모킹) → **Paywall이 뜨는지** (1-A 검증)
- [ ] Free 두 번째 책 → Paywall
- [ ] Free 발행 소진 후 PDF → Paywall
- [ ] 챕터 기록 부족 → 부족 안내 vs 일반 실패 (1-A 검증)
- [ ] 챕터 저장 실패(오프라인) → Toast
- [ ] 기록 삭제 실패 → 버튼이 「삭제 중」에 안 멈춤
- [ ] 웹 Paywall → 「모바일 앱에서…」
- [ ] 계정 삭제 실패 → 모달 내 안내

결과 기록: `17-test-report.md` 또는 `16_QA_E2E.md`.

---

## 7. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-10-23 | 코드 전수 점검 후 초안 작성. Edge code 전달·무한 로딩·구독 free 위장을 최우선으로 표기 |
