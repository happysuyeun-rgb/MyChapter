# MyChapter — 테스트 리포트

> **최종 갱신:** 2026-10-24  
> **환경:** 로컬 bypass 스모크 + 운영 LIVE 로그인 + vitest  
> **운영:** https://my-chapter.vercel.app @ `7ab565a6`  
> **관련:** `16-dev-plan.md`, `15-launch-roadmap.md`, `22-e2e-status.md`, `16_QA_E2E.md`

---

## 1. 요약

| 영역 | 결과 | 비고 |
|------|------|------|
| `npm run build` (tsc + vite) | ✅ PASS — BUILD | tip `7ab565a` 기준 |
| vitest 저장 정합 회귀 | ✅ PASS — BUILD | **18/18** (`npm test`) |
| Supabase 스키마 (REST) | ✅ PASS | `users`, `projects` 등 응답 |
| Edge Function 8개 | ✅ **이미 배포됨** | `expand-caption`만 404 (미구현 정상) |
| UI mock 스모크 (bypass) | ✅ PASS | 홈·기록·내책·마이·작성·저장 |
| **운영 이메일 로그인 E2E** | ✅ **7/7 PASS — LIVE** | 2026-10-24 Work 검증 · `22-e2e-status.md` |
| 실계정 책·기록 저장 E2E | ⏸ PENDING | Work 다음 |
| AI 챕터 · PDF E2E | ⏸ PENDING | 미실시 |
| Google · Kakao OAuth | ⏸ 미완료 설정 | |
| 일반 사용자 SMTP | ⏸ 미완료 설정 | |

**저장 정합성 커밋:** `7ab565a` — 충돌 시 자동 중복 생성 금지, 기존 열기 / 새 기록 명시 선택.  
**이력:** 과거 운영 인증·공개키 문제는 로그인 LIVE PASS로 **해결 기록**. 책·기록 LIVE는 별도.

---

## 2. 빌드

```
npm run build → tsc -b && vite build → exit 0
```

- 모듈 213개 변환, 프로덕션 번들 생성 성공
- lottie-web `eval` 경고만 있음 (기존 의존성)

---

## 3. Supabase / Edge Function 프로브

| Function | HTTP | 응답 요약 | 해석 |
|----------|------|-----------|------|
| `generate-question` | 400 | `project_id required` | 배포됨 |
| `generate-freewriting-hint` | 401 | Unauthorized | 배포됨 |
| `generate-chapter` | 400 | `project_id required` | 배포됨 |
| `regenerate-chapter` | 401 | Unauthorized | 배포됨 |
| `verify-subscription` | 400 | Missing purchase data | 배포됨 |
| `delete-account` | 400 | Confirmation required | 배포됨 |
| `send-daily-reminder` | 200 | `target_users:0` | 배포됨 |
| `generate-pdf` | 400 | Missing project_id… | 배포됨 |
| `expand-caption` | 404 | NOT_FOUND | 미구현 (예상) |

REST: `users?select=id&limit=1` → `[]` (스키마·RLS 정상 동작).

---

## 4. UI 스모크 (DEV_BYPASS)

| 화면/흐름 | 결과 | 메모 |
|-----------|------|------|
| `/` → `/home` 자동 진입 | ✅ | mock 유저 서아 |
| 홈 진행률·AI 질문 | ✅ | 프로젝트·질문 표시 |
| `/records` 목록 3건 | ✅ | FlatIcon 탭바 정상 |
| `/book` 챕터 0·기록 3 | ✅ | 미할당 3/10 |
| `/mypage` | ✅* | *초기엔 통계 `-` (버그) → 수정 후 숫자 표시 |
| `/record/mode` → 질문 작성 | ✅ | 질문 로드 (초기에 지연 있음) |
| 저장 → `/record/complete` | ✅ | “4번째 기록 완성” |

---

## 5. 테스트 중 발견한 버그 (수정함)

| 이슈 | 원인 | 조치 |
|------|------|------|
| 마이페이지 통계가 `-`로 고착 | `getPublishedBook`이 bypass 없이 Supabase 호출 → 실패/지연, `useUserStats`에 finally 없음 | `books.ts` bypass + `useUserStats` try/finally |
| 질문 작성 화면 초기 “불러오는 중…” 지연 | `drafts.ts`가 bypass 없이 DB 조회 | `drafts.ts` bypass no-op |
| 자유일기 힌트 / device token / 계정삭제 | bypass 미커버 | `hints`, `deviceTokens`, `account`에 bypass 추가 |

재빌드: `npm run build` ✅

---

## 6. 운영 로그인 E2E (2026-10-24) — LIVE

| # | 항목 | 결과 |
|---|------|------|
| 1 | Vercel Production 배포 | PASS |
| 2 | Supabase 공개키 반영 | PASS |
| 3 | Magic Link 발송 | PASS |
| 4 | 이메일 로그인 | PASS |
| 5 | 마이페이지 진입 | PASS |
| 6 | 새로고침 후 세션 유지 | PASS |
| 7 | 로그아웃·보호 화면 차단 | PASS |

Supabase 요청 29건 — 4xx·5xx 없음. 상세: `22-e2e-status.md`.

---

## 7. 아직 LIVE 검증하지 않은 것

| 항목 | 이유 |
|------|------|
| 첫 책 생성 · 자유/질문/사진 저장 · 새로고침 · PAGE 정합 | Work 다음 (`18` STEP 4) |
| AI Function + JWT E2E | 세션 있음 — 책·기록 이후 |
| PDF 출판 | Pro + Function + Storage E2E |
| Google / Kakao OAuth | Provider 미완료 |
| 일반 사용자 SMTP | 미완료 |
| Play Billing 네이티브 | 플러그인 미구현 |
| Firebase 푸시 | 미설정 |
| Secrets 값 유효성 (`GOOGLE_AI_API_KEY`) | Dashboard 확인 필요 |

---

## 8. 다음 권장 액션

1. **Work:** 책·기록 6항목 E2E (`22-e2e-status.md` §4) — 결과 전 대규모 리팩터 금지.  
2. Secrets (`GOOGLE_AI_API_KEY`, `SERVICE_ROLE_KEY`) 값 존재·유효성 확인 (AI·PDF용).  
3. 실패 시 Function **Logs** + 브라우저 콘솔을 Cursor에 공유.  
4. OAuth·SMTP는 로그인 PASS와 별개로 유지.

---

## 갱신 이력

| 날짜 | 내용 |
|------|------|
| 2026-10-23 | 최초 작성 — build, Edge 프로브, bypass UI 스모크, bypass API 갭 수정 |
| 2026-10-24 | 운영 로그인 7/7 PASS · vitest 18 · `7ab565a` · 책·기록 PENDING 분리 |
