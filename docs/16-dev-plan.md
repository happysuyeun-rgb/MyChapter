# MyChapter — 개발 잔여 점검 & 진행 계획

> **최종 갱신:** 2026-10-23  
> **목적:** 지금까지 작업에서 **코드 미완**과 **연동만 남은 것**을 구분하고, 출시까지 개발 순서를 고정  
> **관련:** `07-dev-progress.md`, `15-launch-roadmap.md`, `06-user-tasks.md`

---

## 1. 한줄 진단

**MVP 앱 화면·API 코드는 거의 완성.**  
지금 막힌 지점은 **코드 공백이 아니라 Edge Function 배포·OAuth·실연동 E2E**다.  
코드로 아직 없는 것은 **Play Billing 네이티브 브릿지(P1)** 와 **출시 후 기능(S-32, expand-caption 등)** 뿐이다.

| 구분 | 비중 | 의미 |
|------|------|------|
| ✅ 코드 완료 | ~90% | 빌드·화면·Edge Function 소스 존재 |
| 🔄 연동·배포만 | ~8% | Secrets, deploy, OAuth, Vercel, Firebase |
| ❌ 코드 미구현 | ~2% | Billing 플러그인, S-32, expand-caption 등 |

---

## 2. 코드베이스 점검 결과 (2026-10-23)

### 2.1 완료된 것 (재확인)

| 영역 | 확인 |
|------|------|
| Phase 0~5 화면 | 라우트·페이지·스토어 존재 |
| TabBar / Empty / Paywall 폴리싱 | FlatIcon 적용 |
| 마이그레이션 001~006 | Supabase에 idempotent 스크립트로 적용됨 |
| Edge Function **소스** 8개 | `supabase/functions/*` 존재 (Gemini 기반) |
| Dev bypass mock | `src/mocks/` + 핵심 API 분기 |

### 2.2 코드는 있으나 **배포·설정 없으면 동작 안 함** (🔄)

| # | 항목 | 막히는 증상 | 담당 |
|---|------|-------------|------|
| A1 | ~~Edge Function 8개 미배포~~ | ✅ 2026-10-23 프로브로 배포 확인 (`17-test-report`) | — |
| A2 | Secrets (`GOOGLE_AI_API_KEY`, `SERVICE_ROLE_KEY`) + 운영 bypass OFF | AI null/원문 폴백·결제 우회 | 본인 · `23-ai-pdf-safety` |
| A3 | ~~`VITE_DEV_BYPASS` 운영~~ | 로그인 LIVE PASS (2026-10-24) | — |
| A4 | OAuth Redirect URL | 카카오/구글 로그인 불가 | 본인 |
| A5 | ~~Vercel 배포~~ | Production LIVE (로그인) | — |
| A6 | Firebase + Cron | 푸시만 안 됨 (앱 내 알림은 DB로 가능) | 본인 |
| A7 | Play Console + AAB | 스토어 미등록 | 본인 |

### 2.3 **코드 자체가 없는** 미완 (❌)

| # | 항목 | 우선순위 | 근거 | MVP |
|---|------|----------|------|-----|
| B1 | `MyChapterBilling` Android 플러그인 | **P1** | `src/lib/billing.ts`는 `window.MyChapterBilling`만 호출. android/에 플러그인 없음. 현재는 `dev_` 토큰만 | **출시 직전 필수** |
| B2 | S-32 기록→다른 챕터 이동 | P2 | `RecordActionSheet`에 수정/삭제만 있음. 챕터 이동 UI·API 없음 | 출시 후 OK |
| B3 | `expand-caption` Edge Function | P3 | 설계 문서에만 있음. `supabase/functions/`에 폴더 없음 | 선택 |
| B4 | S-22 실물책 POD | P3 | 설계상 MVP 제외 | 제외 |
| B5 | Capacitor Camera | P3 | S-14는 `<input type=file>` | 선택 |
| B6 | 온보딩 소개 슬라이드 | P3 | 설계 결정: MVP 제외 | 제외 |

### 2.4 문서와 코드 불일치 (수정 대상)

| 문서 표현 | 실제 코드 | 조치 |
|-----------|-----------|------|
| Secrets `ANTHROPIC_API_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | `GOOGLE_AI_API_KEY` / `SERVICE_ROLE_KEY` | 2026-10-24 문서 정정 · `23-ai-pdf-safety` |
| PDF `🔄 006 SQL 필요` | 006 idempotent 적용 완료 | progress에 ✅ 반영 |
| S-32 상세·바텀시트 ✅ | 이동 기능만 ❌ | 「상세 UI ✅ / 챕터 이동 ❌」로 분리 |

---

## 3. 남은 작업 체크리스트

### Wave 0 — 인프라 (지금, 코드 거의 없음)

- [ ] Secrets 2종 유효성 (`GOOGLE_AI_API_KEY`, `SERVICE_ROLE_KEY`)
- [ ] 운영: `BILLING_DEV_BYPASS`≠true · `VITE_BILLING_DEV_MODE=false`
- [x] Edge Function 8개 배포 (프로브 확인)
- [x] Email Magic Link 운영 LIVE PASS
- [ ] 책·기록·AI·PDF LIVE (`22` / `23`)

**E2E 통과 기준**

```
로그인 → 온보딩 → 프로젝트 생성 → AI 질문 → 기록 저장 → 목록 표시
```

### Wave 1 — 베타 품질 (E2E 통과 직후)

- [ ] 챕터 자동/수동 생성 E2E
- [ ] PDF 출판 E2E (dev billing)
- [ ] Vercel 배포 + 약관 URL
- [ ] 연동 버그 수정 (Cursor AI)
- [ ] 베타 3~5명

### Wave 2 — 스토어용 **개발** (Cursor AI + 본인)

- [ ] **B1 Play Billing 네이티브 브릿지** (유일한 P1 코드 작업)
- [ ] Play Console 상품 `mychapter_pro_monthly`
- [ ] Android AAB + 내부 테스트
- [ ] Firebase / Cron (푸시 — 연기 가능)
- [ ] 스토어 리스팅·스크린샷

### Wave 3 — 출시 후 개발

- [ ] B2 S-32 챕터 이동
- [ ] B3 expand-caption (선택)
- [ ] UI 추가 폴리싱 / Lottie 고도화 (선택)

---

## 4. 개발 진행 계획 (역할·일정)

### 원칙

1. **Wave 0 끝나기 전**에 Billing·S-32·UI 폴리싱을 크게 벌이지 않는다.  
2. Cursor AI는 **연동 버그 수정**과 **Wave 2 Billing 플러그인**에 집중한다.  
3. 본인은 **Secrets / deploy / OAuth / Vercel / Play Console**을 담당한다.

### 이번 주 (Wave 0 → 1)

| 일차 | 본인 | Cursor AI |
|------|------|-----------|
| Day 1 | Secrets + Function 8개 배포 | 배포 오류 로그 해석·수정 지원 |
| Day 2 | `DEV_BYPASS=false`, 이메일 로그인 E2E | 로그인·온보딩 버그 수정 |
| Day 3 | OAuth (Kakao/Google) | Redirect/딥링크 이슈 수정 |
| Day 4 | AI 질문·기록·챕터 E2E | Edge Function / API 버그 수정 |
| Day 5 | Vercel 배포, PDF(dev) E2E | 실패 케이스 수정, 베타 체크리스트 |

### 다음 주 (Wave 2)

| 일차 | 본인 | Cursor AI |
|------|------|-----------|
| Day 1~2 | Play 상품 등록, Firebase(선택) | **MyChapterBilling Android 플러그인** |
| Day 3~4 | AAB 빌드, 내부 테스트 업로드 | Billing E2E 지원, 스토어 문구 |
| Day 5 | 결제 실기기 확인 | QA 체크리스트 |

### 출시 후 (Wave 3)

| 순서 | 작업 | 담당 |
|------|------|------|
| 1 | S-32 기록→챕터 이동 | Cursor AI |
| 2 | expand-caption (필요 시) | Cursor AI |
| 3 | Camera / Lottie / UI 폴리싱 | 선택 |

---

## 5. Cursor AI 즉시 착수 가능 작업 (우선순위)

Wave 0이 막혀 있어도 **미리 설계·구현 가능한** 코드 작업:

| 순위 | 작업 | 의존성 | 예상 |
|------|------|--------|------|
| 1 | Play Billing Capacitor/Android 플러그인 골격 | Wave 2와 맞춤 | 중 |
| 2 | S-32 API + RecordActionSheet UI | DB에 chapter_id 이미 있음 | 중 |
| 3 | expand-caption Function | GOOGLE_AI_API_KEY | 소 |

**권장:** Wave 0을 본인이 진행하는 동안 AI는 **Billing 플러그인 골격**부터 착수하거나,  
본인 요청 시 **배포/E2E 중 버그 수정**에 집중.

---

## 6. 성공 정의

| 마일스톤 | 정의 |
|----------|------|
| **M1 로컬 실연동** | DEV_BYPASS off, 이메일 로그인~기록 저장 OK |
| **M2 베타** | Vercel + OAuth + AI/챕터/PDF(dev) OK, 테스터 초대 |
| **M3 내부 테스트** | AAB + Billing 실결제 + Play 내부 트랙 |
| **M4 출시** | 스토어 공개 + 계정삭제·약관 URL 심사 통과 |

현재 위치: **마이그레이션·Function 배포 확인 → M1 직전 (Secrets + DEV_BYPASS off)**

---

## 7. 다음 액션 (바로)

1. **본인:** Dashboard Secrets 3종 존재·값 확인 (`06-user-tasks.md` §2.5)  
2. **본인:** `VITE_DEV_BYPASS=false` → `npm run dev` → 실연동 E2E  
3. **막히면:** Edge Function Logs / 콘솔 에러를 Cursor에 공유 → 버그 수정  
4. **M1 통과 후:** Billing 플러그인 개발 착수 요청  

로컬 스모크 상세 → **`17-test-report.md`**  
기능 누락·UX 개선 → **`19-gap-and-ux-plan.md`**

---

## 갱신 이력

| 날짜 | 내용 |
|------|------|
| 2026-10-23 | 최초 작성 — 코드/연동/미구현 구분, Wave 0~3 계획, M1~M4 정의 |
| 2026-10-23 | 스모크 테스트: Function 배포 확인, bypass API 갭 수정 반영 |
| 2026-10-23 | `19-gap-and-ux-plan` 연동 |
