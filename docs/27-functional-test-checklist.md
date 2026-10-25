# MyChapter — 기능 테스트 체크리스트 & 실행 계획

> **최종 갱신:** 2026-10-25  
> **관련:** `06-user-tasks.md`, `18-user-next-steps.md`, `22-e2e-status.md`, `26-ai-pdf-release-execution-runbook.md`  
> **제약:** 운영 DB·Secret·Edge는 Cursor가 변경하지 않음. Secret 원문은 문서·채팅에 기록하지 않음.

---

## 0. 전제 — 담당자 선행이 필요한가?

| 범위 | 담당자 선행 | 비고 |
|------|-------------|------|
| 로그인·책·기록 회귀 | 불필요 | 이미 LIVE PASS — 재확인만 |
| `npm test` / `npm run build` | 불필요 | BUILD |
| AI 질문·챕터·PDF | **필요** | Gemini / SERVICE_ROLE |
| 결제 우회 차단 증명 | **필요** | `BILLING_DEV_BYPASS` OFF |
| DB 025 가드 (표지·준비도) | **필요** | 운영/스테이징 025 적용 후 |

**권장 순서:** Phase 0(본인) → Phase 1(지금) → Phase 2(Secret 후) → Phase 3(025 후)

---

## Phase 0 — 담당자 선행 (게이트)

| # | 항목 | 담당 | 상태 | 비고 |
|---|------|------|------|------|
| 0.1 | 운영 `BILLING_DEV_BYPASS` ≠ true | 본인 | ☐ | 값 미기록 · 완료만 통보 |
| 0.2 | Vercel `VITE_BILLING_DEV_MODE=false` | 본인 | ☐ | Production |
| 0.3 | `GOOGLE_AI_API_KEY` 등록 | 본인 | ☐ | |
| 0.4 | `SERVICE_ROLE_KEY` 등록 | 본인 | ☐ | anon 아님 |
| 0.5 | (권장) 스테이징 프로젝트 | 본인 | ☐ | 운영 025 직적용 금지 |

**Phase 0 완료 조건:** 0.1~0.4 ☑ 후 Phase 2 시작.

---

## Phase 1 — 지금 가능한 회귀 (담당자 대기 없이)

### 1-A. BUILD / CI 로컬

| # | 항목 | 기대 | 상태 | 결과 |
|---|------|------|------|------|
| 1.1 | `npm test` | 전부 PASS | ☑ | **PASS — BUILD** · 60 tests (2026-10-25) |
| 1.2 | `npm run build` | 성공 | ☑ | **PASS — BUILD** · `tsc -b && vite build` OK |

### 1-B. 운영 공개 스모크 (비로그인)

운영 URL: https://my-chapter.vercel.app

| # | 항목 | 기대 | 상태 | 결과 |
|---|------|------|------|------|
| 1.3 | 스플래시 → 로그인 화면 | 로드 OK | ☑ | **PASS — LIVE** · `/splash` → `/login`, Kakao/Google/이메일 CTA 표시 |
| 1.3b | `/legal/privacy.html` · `/legal/terms.html` | HTTP 200 | ☑ | **PASS — LIVE** · 200 (privacy 805B, terms 768B) |

### 1-C. 운영 LIVE 스모크 (로그인·책·기록) — 세션 필요

근거 범위: `22-e2e-status.md` §2·§4 (2026-10-24 이미 PASS — 회귀 재확인)

| # | 항목 | 기대 | 상태 | 결과 |
|---|------|------|------|------|
| 1.4 | Magic Link 로그인 | 홈/온보딩 | ☐ | **BLOCKED** — 담당자/Work 세션·메일 필요 |
| 1.5 | 세션 유지(새로고침) | 로그인 유지 | ☐ | 1.4 종속 |
| 1.6 | 책 목록·기존 책 진입 | 데이터 표시 | ☐ | 1.4 종속 |
| 1.7 | 기록 목록·상세 | PAGE 표시 | ☐ | 1.4 종속 |
| 1.8 | 로그아웃·보호 라우트 | 차단 | ☐ | 1.4 종속 |

> 1.4~1.8: Magic Link 권한이 있는 담당자/Work가 수행. Cursor 단독 불가.

---

## Phase 2 — Secret·우회 OFF 이후 (AI / 결제 가드)

| # | 항목 | 기대 | 상태 | 결과 |
|---|------|------|------|------|
| 2.1 | AI 질문 1회 | 성공 또는 명확한 에러 코드 | ☐ | **BLOCKED** · Phase 0 |
| 2.2 | `dev_` 토큰 Pro 승격 | **거부** | ☐ | **BLOCKED** · Phase 0 |
| 2.3 | 준비도 미달 책 챕터 생성 | 서버 차단 (`BOOK_NOT_READY` 등) | ☐ | **BLOCKED** · Phase 0 + Edge 배포 상태 |
| 2.4 | (스테이징·준비도 충족) 챕터 성공 | 챕터 행·내용 | ☐ | |
| 2.5 | (동일) PDF 1회 | published / storage | ☐ | |
| 2.6 | Free 2회째 발행 | `PUBLICATION_LIMIT` | ☐ | |

---

## Phase 3 — 025 적용 후 (DB 보안 가드)

| # | 항목 | 기대 | 상태 | 결과 |
|---|------|------|------|------|
| 3.1 | Free REST `cover_03/04` UPDATE | `COVER_PRO_ONLY` | ☐ | **BLOCKED** · 025 미적용 |
| 3.2 | 만료 Pro + 발행 이력 | `PUBLICATION_LIMIT` | ☐ | |
| 3.3 | `ready_at` / min 조작 | 차단 | ☐ | |
| 3.4 | 책·기록 생성 회귀 | 정상 | ☐ | |

검증 SQL(스테이징): `supabase/scripts/verify_025_publication_entitlement.sql`

---

## Phase 4 — 이번 라운드 제외 (백로그)

| # | 항목 | 상태 |
|---|------|------|
| 4.1 | Kakao / Google OAuth | ☐ 제외 |
| 4.2 | 일반 사용자 SMTP | ☐ 제외 |
| 4.3 | 계정 삭제·재가입 | ☐ 제외 |
| 4.4 | Play 실결제 · FCM | ☐ 제외 |

---

## 실행 로그

| 일시 | Phase | 수행 | 요약 |
|------|-------|------|------|
| 2026-10-25 | 문서 | Cursor | 체크리스트 작성 |
| 2026-10-25 | 1-A | Cursor | vitest 60 PASS · build OK |
| 2026-10-25 | 1-B | Cursor | 스플래시→로그인 LIVE · legal 200 |
| 2026-10-25 | 1-C / 2 / 3 | — | Phase 0·세션 대기 |

---

## 현재 판정 요약

| Phase | 판정 |
|-------|------|
| 1-A BUILD | **PASS** |
| 1-B 공개 LIVE | **PASS** |
| 1-C 로그인 후 | **BLOCKED** (본인 Magic Link) |
| 2 AI/결제 | **BLOCKED** (Phase 0) |
| 3 DB 025 | **BLOCKED** (운영 미적용) |

**다음 액션 (본인):** Phase 0.1~0.4 완료 통보 → Cursor/Work가 Phase 2 진행.  
**병행 가능:** 본인이 1.4~1.8 Magic Link 회귀 체크.

---

## 판정 규칙

| 라벨 | 의미 |
|------|------|
| PASS — LIVE | 실계정·운영(또는 동등)에서 관찰 |
| PASS — BUILD | vitest / build만 |
| BLOCKED | Phase 0 등 선행 미완 |
| FAIL | 기대와 불일치 — 재현 절차 기록 |

실계정 미수행 시 LIVE PASS 금지 (`22-e2e-status.md`와 동일).

---

## 갱신 이력

| 날짜 | 내용 |
|------|------|
| 2026-10-25 | 초안 작성 및 Phase 1-A/1-B 실행 |
