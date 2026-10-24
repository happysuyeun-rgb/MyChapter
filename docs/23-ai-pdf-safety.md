# MyChapter — AI 챕터·PDF 출시 전 서버 안전성 점검

> **작성:** 2026-10-24  
> **기준 tip:** `a32b6a0` (+ 본 문서 커밋)  
> **범위:** 정적 코드·마이그레이션·문서. **운영 Secret 값·DB·결제 설정 미조회/미변경.**  
> **제약:** Work 책·기록 E2E와 충돌하는 기능 코드 **미수정**. 아래는 결함 확정 + **승인 전 설계안**.

---

## 1. 결제 우회 (`BILLING_DEV_BYPASS`) — 운영 활성 여부

| 항목 | 결과 |
|------|------|
| 코드 경로 | `verify-subscription/index.ts`: `BILLING_DEV_BYPASS === 'true'` 이고 `purchase_token`이 `dev_` 이면 Pro 승격 |
| 클라 경로 | `src/lib/billing.ts`: `import.meta.env.DEV` **또는** `VITE_BILLING_DEV_MODE === 'true'` 이면 `dev_` 토큰 생성 |
| **운영 Secret/빌드 env 실제 값** | **미확인** (Dashboard·Vercel 읽기/변경 금지) |

**위험 조건 (확정):** 운영에서 서버 bypass ON **그리고** 프로덕션 번들에 `VITE_BILLING_DEV_MODE=true`(또는 잘못 배포된 DEV 빌드)이면 웹에서 무료 Pro 가능.

**출시 전 담당자 확인(읽기만):** Supabase Secrets에서 `BILLING_DEV_BYPASS`≠true, Vercel Production `VITE_BILLING_DEV_MODE=false`. 값을 채팅/이슈에 붙이지 말 것.

---

## 2. Free/Pro 권한 — 서버 강제 여부

| 기능 | 클라 | 서버 | 판정 |
|------|------|------|------|
| PDF Free 1회·동시 발행 | `canPublishBook` | `reserve_book_publication` → `PUBLICATION_LIMIT` 등 (`020`/`017`~) | **서버 강제 OK** |
| PDF 소유권 | JWT 세션 | RPC `auth.uid()` + project.user_id | **OK** |
| Pro 표지 `cover_03`/`04` | `BookCoverPage` paywall만 | `generate-pdf` / cover UPDATE에 플랜 검사 **없음** | **P1 갭** |
| Free 3챕터 (`04-business-rules` §4.2) | BookPage에 한도 UI 없음 | `generate-chapter`에 플랜·챕터수 한도 **없음** | **P1 갭** (정책 문서와 불일치) |
| 질문/힌트 AI 월한도 | Paywall 분기 | `generate-question` / `generate-freewriting-hint`에서 Free `ai_usage` 카운트 | **서버 강제 OK** |
| 챕터 생성·재생성 AI | 수동 버튼·더블클릭 가드 | `ai_usage` **INSERT만**, 조회/제한 **없음** | **P1 갭** |

---

## 3. AI 생성 실패를 “성공”으로 처리 — 확정 결함

**근거**

1. `supabase/functions/_shared/gemini.ts` — 키 없으면 `return null` (예외 없음).
2. `generate-chapter/index.ts` L244–262 — `chapterContent` 기본값이 **원문 join**. `aiText`가 null이어도 INSERT·알림·`ai_usage` 기록 후 **200 성공**.
3. `regenerate-chapter/index.ts` L94–119 — AI null이면 **기존 원고 유지한 채 UPDATE 성공** 가능 (사용자는 “재생성 성공”으로 오인).

**재현 조건:** `GOOGLE_AI_API_KEY` 미설정 또는 Gemini가 빈 응답 → 챕터 API는 성공 응답.

**출시 차단?** AI 품질·신뢰 관점 **P0에 가깝지만**, 키만 올바르면 당장 LIVE는 가능. **키 유효성 미확인 상태에서는 AI E2E 전 차단 권고.**

### 권장 수정 설계 (승인 후)

1. `generateGeminiText` 실패 구분: `missing_key` / `upstream_error` / `empty`.
2. `generate-chapter`: AI 필수 경로에서 null/parse 실패 시 **4xx/5xx + `code: AI_UNAVAILABLE`**, **chapters INSERT 금지**.
3. `regenerate-chapter`: AI 실패 시 UPDATE 하지 말고 동일 코드 반환 (기존 원고 보존은 OK, “성공” 응답은 금지).
4. 클라: `AI_UNAVAILABLE` → 재시도/Secret 안내 (책·기록 저장 코드와 분리).

**기존 데이터 영향:** 이미 원문-join으로 저장된 챕터는 그대로 둠. 재생성으로만 교정. 마이그레이션 불필요.

---

## 4. AI 사용량·동시 요청 비용

| 위험 | 근거 | 등급 |
|------|------|------|
| 챕터/재생성 무제한 Gemini 호출 | 한도 체크 없음 + `maxOutputTokens` 1024~4096, 클러스터+본문 **최대 2회/요청** | **P1** |
| 더블/연속 클릭·멀티탭 | UI `generating`만; 서버 락/idempotency 없음 | **P1** |
| 동시 generate-chapter | 동일 미배치 기록이 여러 챕터에 들어갈 수 있음 (`chapter_records` PK는 chapter+record) | **P1** |
| 질문/힌트 | Free 월한도 서버 강제 | 양호 |

### 권장 설계 (승인 후)

- Free: 챕터 생성 N회/월 또는 **책당 챕터 수 상한**(정책 §4.2와 맞출지 제품 확정).
- Pro: 합리적 일/월 상한 + soft-limit.
- `pg_advisory_lock(project_id)` 또는 “생성 중” 플래그로 동시 생성 직렬화.
- `ai_usage` feature `chapter` / `chapter_regenerate` 사전 COUNT.

---

## 5. PDF 보안 (타 사용자 접근)

| 계층 | 결과 |
|------|------|
| Edge `generate-pdf` | JWT + `getUser` 필수 |
| Reservation RPC | `auth.uid()`, 소유 project, Free 한도 |
| Storage `published-pdfs` | 폴더 1단 = `auth.uid()` SELECT/DELETE (`006_published_pdfs_storage.sql`) |
| `finish_book_publication` | service_role 전용 (이전 점검) |

**확정:** 정상 배포·RLS 유지 시 **타 사용자 PDF 직접 접근 경로는 코드상 차단**.  
**잔여 리스크(P2):** signed URL 유출 시 TTL 동안 열람 가능(일반적인 signed URL 특성). 교차계정 E2E는 미실시 → LIVE 전 권장.

---

## 6. Secret 명칭 (코드 SoT)

| 코드가 읽는 이름 | 용도 |
|------------------|------|
| `GOOGLE_AI_API_KEY` | Gemini (`_shared/gemini.ts`) |
| `SERVICE_ROLE_KEY` | Edge admin 클라이언트 |
| `BILLING_DEV_BYPASS` | 결제 우회 (운영 금지) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | 플랫폼 주입 |

**오표기(문서):** `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — 런타임 미사용. 본 작업에서 관련 문서 정정.

---

## 7. 등급 요약 · 출시 차단

| ID | 결함 | 등급 | 웹 MVP 차단? |
|----|------|------|----------------|
| S-01 | 운영 bypass 실값 **미확인** | P0 설정 | **담당자 확인 전 AI/결제 관련 공개 비권장** |
| S-02 | AI 키 없음→원문 챕터 “성공” | ~~P0~~ → **코드 수정됨** (`AI_UNAVAILABLE`, INSERT/UPDATE 금지) | Edge 재배포 후 스테이징/운영 검증 |
| S-03 | Free 3챕터·챕터 AI 한도 서버 미강제 | P1 | 정책 유지 시 **출시 전 서버 강제 권장** (정책 철회 시 문서 정정) |
| S-04 | Pro 표지 서버 미강제 | P1 | 무료 Pro 표지 우회 가능 — **출시 전 권장** |
| S-05 | 챕터 동시성·비용 무제한 | P1 | 베타 소규모면 모니터링으로 완화 가능 |
| S-06 | PDF 교차계정 LIVE 미실시 | P2 | 차단 아님 · 테스트 권장 |
| S-07 | Secret 문서 오표기 | P2 | 문서 수정으로 해소 |

**책·기록 LIVE와 독립:** Work E2E와 충돌 없음. **AI·PDF LIVE 전** S-01 확인 + S-02 Edge **재배포** 필요.

---

## 8. S-02 적용 파일 (완료 · Edge 재배포 필요)

| 영역 | 파일 |
|------|------|
| Gemini 결과 구분 | `_shared/gemini.ts` (`tryGenerateGeminiText`) |
| 원고 가드 | `_shared/geminiResult.ts` |
| 챕터 생성/재생성 | `generate-chapter`, `regenerate-chapter` |
| 클라 | `chapters.ts`, `BookPage.tsx`, `ChapterEditPage.tsx` |
| 단위 테스트 | `src/lib/chapterAiResult.test.ts` |

---

## 9. P1 후속 구현 방안 (코드 미적용 · 설계 확정)

### 9.1 Free 챕터 3개 제한 — 서버 강제

1. **제품 확정:** `04-business-rules` §4.2 유지 여부. 철회 시 문서만 정정하고 본 항 취소.
2. **강제 위치:** `generate-chapter`에서 INSERT 직전:
   - `subscriptions.plan` (user) 조회
   - Free이면 `chapters` count where `project_id` ≥ 3 → `403` `{ code: 'CHAPTER_LIMIT' }`
3. **스키마:** 신규 migration 불필요(기존 테이블). (선택) DB CHECK/트리거는 cross-project Free 정책과 충돌 여부 검토 후.
4. **클라:** `CHAPTER_LIMIT` → Paywall (`BookPage`).
5. **데이터:** 이미 4챕터+ Free 책이 있으면 그랜트파더 또는 수동 정리 정책 필요 — 배포 전 카운트 쿼리.

### 9.2 AI 사용량·비용 상한

1. **생성/재생성 공통:** INSERT 전 `ai_usage`에서 `feature IN ('chapter','chapter_regenerate')` AND 당월 COUNT.
2. **제안 한도 (제품 확정 필요):** Free 월 5회 합산 / Pro 월 50회(또는 일 10). `AI_LIMIT` 402 — 질문 API와 동일 코드 재사용.
3. **클러스터+본문 2콜:** 사용량은 **요청 1회**로 카운트(과금 체감과 맞춤). 실패(`AI_UNAVAILABLE`) 시 `ai_usage` INSERT 안 함(현재 S-02와 일치).
4. **관측:** Dashboard/로그에 `reason=missing_key|upstream_error` 집계.

### 9.3 프로젝트별 동시 생성 방지

1. **권장:** `generate-chapter` 시작 시 `pg_advisory_xact_lock(hashtext(project_id::text))`를 RPC 또는 raw SQL로 — **migration 1개** (SECURITY DEFINER 래퍼, `auth.uid()` 소유 검증).
2. **대안(스키마 최소):** `projects.chapter_generating_at timestamptz` — 획득 실패 시 `409 CHAPTER_IN_PROGRESS`, 90초 타임아웃 회수.
3. **클라:** 진행 중 버튼 유지 + 409 메시지.
4. **기록 저장과 무관** — advisory lock은 챕터 Function만.

### 9.4 Pro 전용 표지 서버 검사

1. **상수:** `cover_03`, `cover_04` = Pro (클라 `BookCoverPage`와 동일 목록을 `_shared/covers.ts`로 공유 또는 Edge 하드코드).
2. **`updateProjectCoverSelection`:** plan≠pro 이고 proOnly 표지 → throw.
3. **`generate-pdf` / `reserve_book_publication`:** 예약 시 cover가 Pro-only이면 plan 검사 — Free면 `COVER_PRO_ONLY` 403. RPC 수정 시 migration; Edge만 검사도 1차 가능.
4. **기존 Free+Pro표지 데이터:** 발행 차단 vs 강제 다운그레이드 — 제품 결정 후.

---

## 10. 검증 시나리오

**자동:** `chapterAiResult.test.ts` (키 없음·upstream·empty·재생성 비영속·정상 JSON).

**수동 (스테이징 권장, 운영 키 제거 금지):**

1. bypass OFF, Secret 존재 확인(값 미공유).
2. 스테이징에서 키 제거 → `AI_UNAVAILABLE`, 챕터 행 증가 없음.
3. 키 복구 → 정상 생성.
4. (P1 구현 후) Free 4번째·표지·동시 클릭.

---

## 갱신 이력

| 날짜 | 내용 |
|------|------|
| 2026-10-24 | 최초 정적 점검·설계안 · 기능 코드 미변경 |
| 2026-10-24 | S-02 코드 적용 · P1 §9 설계 확정 |
