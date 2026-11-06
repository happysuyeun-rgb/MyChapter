# 31 · 본인 확인 체크리스트 — PR #9 (알림 권한 · Pro 표지 · 약관 · Play 결제 · AI 편집)

> 대상: [PR #9](https://github.com/happysuyeun-rgb/MyChapter/pull/9) · 브랜치 `feat/push-permission-cover-legal`
> 작성: 2026-11-04 · Cursor가 코드로 할 수 있는 작업은 끝났고, 아래는 **본인만 할 수 있는 확인·운영 작업**이다.
> 비밀값(키·JSON·토큰)은 채팅·Git·이 문서에 적지 않는다. **완료 여부만** 알려주면 된다.

---

## 운영 반영 현황 (2026-11-06 Cursor 실행)

| 항목 | 상태 |
|---|---|
| PR #9 머지 · Vercel 운영 배포 | ✅ `4b62681` |
| Migration `026` | ✅ 운영 적용 (`ai_edit` 확인) |
| `edit-chapter` Function | ✅ 배포 (2026-11-06 AI Function 재배포에 포함) |
| `generate-pdf` Function | ✅ 재배포 (2026-11-06) |
| AI Function 재배포 | ✅ 2026-11-06 `generate-question` · `generate-freewriting-hint` · `analyze-record` · `generate-chapter` · `regenerate-chapter` · `edit-chapter` · `generate-pdf` |
| 화면 준비 완료 표시 UTC 정렬 · 목업 Free 모드(`VITE_MOCK_PLAN=free`) | ✅ 코드 (운영 웹 배포는 Vercel 배포 한도 해제 후) |
| 준비 완료 날짜 UTC 정렬 ([PR #10](https://github.com/happysuyeun-rgb/MyChapter/pull/10)) | ✅ `ae6a679` 운영 배포 — 025 트리거와 날짜 기준 일치 |
| Migration `025` | ✅ 운영 적용 (PR #10 배포 후) |
| Secret `GOOGLE_AI_API_KEY` | ✅ 2026-11-06 등록 (값은 문서·채팅에 적지 않음) |
| Vercel Production `VITE_AI_EDIT_ENABLED` | ✅ `true` · 2026-11-06 운영 재배포 (`https://my-chapter.vercel.app`) |
| Secret `BILLING_DEV_BYPASS` | ✅ 2026-11-04 삭제 (승인 후 Cursor 실행). 삭제 전에도 운영 `verify-subscription`의 운영 프로젝트 차단(SEC-01)으로 개발용 결제는 거부되고 있었음 |
| Vercel Production `VITE_BILLING_DEV_MODE` | ✅ 없음 (2026-11-06 이름 목록 확인) |
| Secret `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | ❌ 미등록 → 실결제 서버 검증 불가 (Play 출시 전 등록) |

---

## 0. 한눈에 — 권장 순서

| 순서 | 할 일 | 막히는 것 |
|---|---|---|
| 1 | 운영 사이트에서 웹 화면 확인 (§1 항목을 운영 URL에서) | — |
| 2 | ~~PR #9 머지 → 운영 웹 반영~~ ✅ 완료 | — |
| 3 | ~~운영 DB `025`, `026` · `edit-chapter` 배포~~ ✅ Cursor 완료 | — |
| 4 | ~~Secret `GOOGLE_AI_API_KEY` 등록 (§2.3)~~ ✅ 2026-11-06 · ~~`BILLING_DEV_BYPASS` 삭제~~ ✅ | — |
| 5 | ~~Vercel `VITE_AI_EDIT_ENABLED=true` + 재배포 (§2.4)~~ ✅ 2026-11-06 | 운영에서 §2.6 확인 |
| 6 | Play Console 구독 상품 + 내부 테스트 (§3) | 실결제 |
| 7 | Android 실기기 테스트 (§4) | 출시 |
| 8 | 남은 제품 결정 회신 (§5) | AI 편집 한도 확정 |

---

## 1. PR #9 Preview 웹 확인 (머지 전)

Preview URL은 PR #9의 Vercel 봇 댓글에 있다. 실계정(Free 계정 권장)으로 로그인.

| # | 확인 | 기대 결과 | ☐ |
|---|---|---|---|
| 1.1 | 마이 → 설정 → 알림 ON/OFF | 웹에서는 권한 팝업 없이 저장됨, 오류 없음 | ☐ |
| 1.2 | 마이 → 약관/개인정보처리방침 | 로딩 표시 후 본문. (실패 시 "다시 시도" + "브라우저에서 열기") | ☐ |
| 1.3 | Free 계정으로 책 표지에서 Pro 표지(잠금 표시) 선택 | 바로 Paywall, 표지는 바뀌지 않음. (서버 거부 시 미리보기 원복은 `025` 적용 후 §2.1에서 확인) | ☐ |
| 1.4 | 마이 → 구독 → "구매 복원하기" (웹) | "모바일 앱에서…" 안내 Toast | ☐ |
| 1.5 | 마이 → AI 사용량 | 화면 정상. `AI 편집` 행은 `0 / 3` (Free) | ☐ |
| 1.6 | 챕터 편집 화면 | 2026-11-06부터 운영 플래그 ON → **PAGE EDIT**가 보여야 함. 확인은 §2.6 | ☐ |

> 1.5에서 오류가 나면 알려주세요. `026` 적용 전에도 깨지지 않도록 만들어 두었습니다.

---

## 2. 운영 반영 — DB · Function · 환경변수 (본인 승인·실행)

### 2.1 Migration `025` (Pro 표지 서버 강제)

✅ 2026-11-04 Cursor가 적용 (트리거 `projects_enforce_cover_entitlement`, `projects_enforce_readiness_integrity` 확인).

> ⚠ `supabase/scripts/verify_025_publication_entitlement.sql`은 테이블을 TRUNCATE하는 **로컬 임시 DB 전용** 스크립트다. 운영에서 실행 금지.

남은 확인 (운영 앱에서):
- ☐ 홈·서재 목록이 평소처럼 열림 (한국 시간 오전 9시 전에도 한 번)
- ☐ Free 계정: Pro 표지 저장 거부 + Paywall

### 2.2 Migration `026` (AI 편집 집계)

✅ 2026-11-04 Cursor가 적용 (`ai_feature`에 `ai_edit` 확인).

### 2.3 `edit-chapter` Function 배포

✅ 2026-11-04 Cursor가 배포. ✅ 2026-11-06 `GOOGLE_AI_API_KEY` 등록 후 AI Function 재배포.

- ✅ Secret 이름 `GOOGLE_AI_API_KEY` 등록 확인 (값 공유 금지)

> CLI 참고: 이 저장소는 Supabase CLI **v2**가 필요하다 (`npx supabase@2 ...`). v3는 `config.toml`의 `[inbucket]` 때문에 실패한다.

### 2.4 AI 편집 버튼 켜기 (`GOOGLE_AI_API_KEY` 등록 후)

✅ 2026-11-06 Cursor가 Production에 `VITE_AI_EDIT_ENABLED=true` 설정 후 운영 재배포. 챕터 편집에서 PAGE EDIT가 보이는지 §2.6에서 확인.

### 2.5 결제 우회 OFF 재확인

| 위치 | 이름 | 운영 값 | ☐ |
|---|---|---|---|
| Supabase Secrets | `BILLING_DEV_BYPASS` | 없음 또는 `false` | ☐ |
| Vercel Production | `VITE_BILLING_DEV_MODE` | 없음 또는 `false` | ✅ 2026-11-06 없음 |
| Supabase Secrets | `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | 등록됨 (값 공유 금지) | ☐ |
| Supabase Secrets | `GOOGLE_PLAY_PACKAGE_NAME` | 없으면 기본 `com.mychapter.app` 사용 | ☐ |

### 2.6 AI 편집 운영 확인 (`2.4` 후, 운영 사이트)

| # | 확인 | 기대 결과 | ☐ |
|---|---|---|---|
| 2.6.1 | 챕터 편집 → "PAGE에게 다듬기 맡기기" | 결과 창: 변경 요약 · 다듬은 원고/원문 탭 | ☐ |
| 2.6.2 | "이 버전 사용하기" → "편집 내용 저장하기" | 챕터에 반영. **원본 기록은 그대로** | ☐ |
| 2.6.3 | "원문 유지" | 아무것도 바뀌지 않음 | ☐ |
| 2.6.4 | AI 사용량 화면 | `AI 편집 1 / 3` | ☐ |
| 2.6.5 | Free로 4번째 시도 | Paywall 표시 | ☐ |
| 2.6.6 | 50자 미만 원고에서 시도 | "50자 이상…" 안내, 횟수 차감 없음 | ☐ |

---

## 3. Play Console — 구독 상품

| # | 할 일 | ☐ |
|---|---|---|
| 3.1 | 수익 창출 → 구독 → 상품 ID **`mychapter_pro_monthly`** 생성 (코드와 정확히 일치해야 함) | ☐ |
| 3.2 | 기본 요금제(월간 자동 갱신) 1개 생성 + 가격 설정 + **활성화** | ☐ |
| 3.3 | 설정 → 라이선스 테스트에 본인 Google 계정 추가 (테스트 결제는 실제 청구 없음) | ☐ |
| 3.4 | 서비스 계정에 Play Console 권한(재무 데이터 보기 / 주문 관리) 부여 — `verify-subscription` 서버 검증용 | ☐ |
| 3.5 | 이번 브랜치로 만든 AAB를 **내부 테스트** 트랙에 업로드 (결제는 Play에서 설치한 앱에서만 동작) | ☐ |

---

## 4. Android 실기기 테스트 (내부 테스트 트랙 설치본)

| # | 시나리오 | 기대 결과 | ☐ |
|---|---|---|---|
| 4.1 | 온보딩 알림 화면 → "알림 받기" → OS 팝업 **허용** | 설정에서 알림 ON | ☐ |
| 4.2 | (재설치 후) 같은 화면 → OS 팝업 **거부** | "기기 알림이 꺼져 있어요…" Toast, 앱 알림 OFF 유지 | ☐ |
| 4.3 | 설정에서 알림 ON 시도 (OS 권한 거부 상태) | 오류 안내, 토글 OFF 유지 | ☐ |
| 4.4 | Paywall → 구독 → Google Play 결제창 → **취소** | 오류 문구 없이 Paywall 유지 | ☐ |
| 4.5 | Paywall → 구독 → 테스트 카드로 **결제 완료** | Pro 전환, Pro 표지 저장 가능 | ☐ |
| 4.6 | 앱 데이터 삭제 → 재로그인 → 구독 → "구매 복원하기" | "Pro 구독을 복원했어요." + Pro 유지 | ☐ |
| 4.7 | 구독 없는 Google 계정에서 "구매 복원하기" | "복원할 Pro 구독이 없어요." | ☐ |
| 4.8 | 결제 3일 후에도 구독 유지 (자동 환불 안 됨) | acknowledge 정상 | ☐ |
| 4.9 | 약관 화면 (비행기 모드) | 오류 화면 + 다시 시도 | ☐ |

결과는 표의 #번호와 PASS/FAIL만 알려주면 된다. FAIL이면 화면 캡처 1장.

---

## 5. 회신이 필요한 제품 결정

| 결정 | 현재 코드 잠정값 | 회신 |
|---|---|---|
| Pro AI 편집 월 fair-use | 100회 | ☐ 유지 / 변경: ___ |
| "다시 다듬기"도 1회 차감? | 차감함 | ☐ 유지 / 차감 안 함 |
| 기록(R-05) 단위 AI 편집본 | 보류 (DB 설계 필요) | ☐ 다음 사이클 / 출시 후 |

---

## 6. 기존 미완료 (이번 PR과 별개, 계속 유효)

- AI 챕터 생성·PDF 발행 LIVE E2E — `22-e2e-status.md`, `27-functional-test-checklist.md`
- 보관함(보관 → 복원 → 삭제) 운영 계정 1회 확인
- 위 결과를 `22-e2e-status.md`에 PASS로 옮기는 것은 회신 받으면 Cursor가 반영
