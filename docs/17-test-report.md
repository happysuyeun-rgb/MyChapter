# MyChapter — 로컬 스모크 테스트 리포트

> **최종 갱신:** 2026-10-23  
> **환경:** `VITE_DEV_BYPASS=true`, Vite `localhost:5173`, Supabase project `rdrafwfdwfzgcfiqkgug`  
> **관련:** `16-dev-plan.md`, `15-launch-roadmap.md`

---

## 1. 요약

| 영역 | 결과 | 비고 |
|------|------|------|
| `npm run build` (tsc + vite) | ✅ PASS | 수정 전·후 모두 성공 |
| Supabase 스키마 (REST) | ✅ PASS | `users`, `projects` 등 응답 |
| Edge Function 8개 | ✅ **이미 배포됨** | `expand-caption`만 404 (미구현 정상) |
| UI mock 스모크 (bypass) | ✅ PASS | 홈·기록·내책·마이·작성·저장 |
| 실로그인 E2E | ⏸ 미실시 | bypass on — Wave 0에서 진행 |

**중요한 발견:** Edge Function은 문서상 “배포 필요”였으나, 원격 프로브 결과 **8개 모두 응답**한다. 다음 병목은 **재배포가 아니라 Secrets 확인 + `VITE_DEV_BYPASS=false` 실연동 E2E**.

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

## 6. 아직 검증하지 않은 것

| 항목 | 이유 |
|------|------|
| 실제 로그인 (이메일/OAuth) | `VITE_DEV_BYPASS=true` |
| AI Function + JWT E2E | 유저 세션 필요 |
| PDF 출판 | Pro + Function + Storage E2E |
| Play Billing 네이티브 | 플러그인 미구현 |
| Firebase 푸시 | 미설정 |
| Secrets 값 유효성 (`GOOGLE_AI_API_KEY`) | Dashboard에서만 확인 가능 |

---

## 7. 다음 권장 액션 (테스트 결과 반영)

1. **Edge Function “재배포”는 급하지 않음** — 이미 살아 있음.  
2. Dashboard에서 Secrets (`GOOGLE_AI_API_KEY`, `SERVICE_ROLE_KEY`, `BILLING_DEV_BYPASS`) **값 존재 여부만 확인**.  
3. `.env.local` → `VITE_DEV_BYPASS=false` 후 **실연동 E2E** (로그인 → 프로젝트 → 기록).  
4. 실패 시 Function **Logs** + 브라우저 콘솔을 Cursor에 공유.

---

## 갱신 이력

| 날짜 | 내용 |
|------|------|
| 2026-10-23 | 최초 작성 — build, Edge 프로브, bypass UI 스모크, bypass API 갭 수정 |
