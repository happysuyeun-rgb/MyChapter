# MyChapter — 화면 완성도 · 미개발 점검

> **Status:** CURRENT (code-audited)  
> **최종 갱신:** 2026-10-23  
> **기준:** `05_SCREEN_SPEC.md` v1.1 ↔ `src/router/index.tsx` + `src/pages/**`  
> **관련:** `19-gap-and-ux-plan.md`, `20-error-cases.md`, `SCREEN_IMPLEMENTATION_GAP.md`

---

## 1. 한줄 결론

**MVP 화면 누락 없음.** 명세에 있는 필수 화면은 전부 페이지 파일 + 라우터 연결이 있다.  
출시를 막는 건 “없는 화면”이 아니라 **Billing 네이티브 · 실연동 E2E · 입력 정책 · 일부 에러 UX**다.

---

## 2. 화면 매핑 (요약)

| 영역 | Spec ID | 라우트 | 상태 |
|------|---------|--------|------|
| Splash | SP-01 | `/splash` | ✅ |
| Auth | A-01~02 | `/login`, `/login/email` | ✅ (실연동 E2E 대기) |
| Onboarding | A-03, O-01 | `/onboarding/*` | ✅ |
| Home | H-01~04 | `/home` | ✅ (H-04 표지 snapshot·재발행 CTA는 부분) |
| Library | L-01~05 | `/library` (`/projects`→redirect) | ✅ |
| Project | P-01~03, P-05~07 | `/project/*` | ✅ (P-07 책 삭제/보관 ❌) |
| Records | R-01~05, R-07~09 | `/records*`, `/record/*` | ✅ |
| Book | B-01~05, B-07 | `/book*` | ✅ |
| Cover Pro/AI | B-08 | `/book/cover` | 부분 (Pro 템플릿 ✅ · AI 표지 post-MVP) |
| TOC | B-09 | FinalReview 임베드 | 부분 |
| Publish | U-01~07 | `/book/review`, `/book/publish/complete`, `/publication/:id` | ✅ |
| My | M-01~02, M-04~09 | `/mypage*`, `/notifications` | ✅ |
| Paywall | G-01 | 전역 Modal | ✅ (네이티브 결제 미완) |

### 의도적으로 없는 화면 (Not MVP / Planned / Deprecated)

| ID | 이유 |
|----|------|
| P-04 AI Title | Not MVP |
| R-06 AI Edit Result, R-10 AI Edit Quota | Planned |
| M-03 AI Usage | Planned |
| H-05 Publishing Home | Deprecated (U-04/U-06으로 흡수) |
| `/project/new/mode` (구 S-07) | 삭제됨 — 기록마다 모드 선택 (명세와 일치) |

### 임베드만 있고 독립 라우트 없음 (정상)

U-02 Preview, U-03 Confirm, U-04 Publishing, U-06 Failed, B-06 Manuscript Edit, B-09 TOC, R-09 Confirm Modal

---

## 3. 진짜 미개발 (코드 기준)

### P0 — 출시 전

| 항목 | 근거 |
|------|------|
| Play Billing 네이티브 브리지 | `billing.ts`가 `MyChapterBilling` 기대, Android `MainActivity`에 구현 없음 |
| Production에서 Dev billing 차단 | `VITE_BILLING_DEV_MODE` / 서버 `BILLING_DEV_BYPASS` 확인 필요 |
| 실연동 E2E | Secrets·OAuth·bypass off — `18-user-next-steps.md` |
| 사진·텍스트 입력 정책 | 파일 크기/해상도, 자유일기 제목 max 미확정 (`05` GAP) |

### P1 — 스토어·품질

| 항목 | 현재 |
|------|------|
| 구독 복원 | 버튼은 있으나 Toast 스텁만 |
| 로그아웃 시 FCM 토큰 삭제 | `removeDeviceToken` 미호출 |
| Pro 표지 서버 강제 | 클라만 차단 — 서버 검증 재확인 필요 |
| 로드 실패 ErrorState 확대 | 서재·작업실·상세·원고·표지·완성한 책 등 |
| Settings 저장 실패 피드백 | try/catch·문구 없음 |
| Legal iframe 실패 UI | 대체 화면 없음 |

### P2 — 출시 후 / 선택

| 항목 | 비고 |
|------|------|
| S-32 기록→챕터 이동 | ActionSheet 수정·삭제만 |
| `expand-caption` | Function 없음 |
| Capacitor Camera | `<input type=file>` |
| 책 삭제·보관 (P-07) | 미구현 |
| AI 표지 / iOS / POD | post-MVP |

---

## 4. 문서 vs 코드 — 고쳐야 할 낡은 주장

| 문서 주장 | 실제 |
|-----------|------|
| `19` CHAPTER_LIMIT Banner ✅ | Banner·`CHAPTER_LIMIT` 코드 **없음** (정책상 챕터 수 제한 철회) |
| `19` G-11 복원 버튼 없음 | 버튼 있음, **스텁** |
| `19` G-14 PDF Toast 없음 / G-26 OTP sent=true | FinalReview 인라인 실패 UI · OTP inline 에러로 개선됨 |
| `05` M-05 error-state gap | Notifications `ErrorState` 적용됨 |
| `03_IA` settings/viewer 미구현 | 라우트 존재 |
| 구 `10`~`14` screen-spec 갭 표 | `05` + 본 문서 + `20` 우선 |

---

## 5. 가드 점검

| 가드 | 상태 |
|------|------|
| GuestGuard (login) | ✅ |
| AuthGuard | ✅ |
| OnboardingGuard (제품 라우트 전반) | ✅ |
| BookStageGuard (chapter/manuscript/cover/review) | ✅ |
| `/book` AppLayout (Ready 미달 시 페이지 내 안내) | ✅ (redirect 아님 — 명세와 표현 차이) |

---

## 6. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-10-23 | `05` ↔ 라우터 전수 대조. MVP 화면 누락 없음 판정, 미개발 P0~P2 정리 |
