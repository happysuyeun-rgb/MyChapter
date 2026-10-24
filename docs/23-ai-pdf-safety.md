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
| S-02 | AI 키 없음→원문 챕터 “성공” | P0 품질 / P1 키 있으면 완화 | AI E2E·출시 전 **수정 또는 키 검증 필수** |
| S-03 | Free 3챕터·챕터 AI 한도 서버 미강제 | P1 | 정책 유지 시 **출시 전 서버 강제 권장** (정책 철회 시 문서 정정) |
| S-04 | Pro 표지 서버 미강제 | P1 | 무료 Pro 표지 우회 가능 — **출시 전 권장** |
| S-05 | 챕터 동시성·비용 무제한 | P1 | 베타 소규모면 모니터링으로 완화 가능 |
| S-06 | PDF 교차계정 LIVE 미실시 | P2 | 차단 아님 · 테스트 권장 |
| S-07 | Secret 문서 오표기 | P2 | 문서 수정으로 해소 |

**책·기록 LIVE와 독립:** 본 항목은 Work E2E를 막지 않음. **AI·PDF LIVE 시작 전** S-01 확인 + S-02 처리(또는 키 검증 증거)를 권고.

---

## 8. 승인 후 수정 파일 예상 (기능 코드 — 아직 미적용)

| 영역 | 파일 |
|------|------|
| Gemini 실패 구분 | `supabase/functions/_shared/gemini.ts` |
| 챕터 생성 | `supabase/functions/generate-chapter/index.ts` |
| 챕터 재생성 | `supabase/functions/regenerate-chapter/index.ts` |
| (선택) 한도·락 | 위 + 소규모 migration 또는 기존 `ai_usage` 조회 |
| (선택) Pro 표지 | `generate-pdf/index.ts`, `updateProjectCoverSelection` |
| 클라 에러 UX | `src/lib/api/chapters.ts`, `BookPage.tsx`, `ChapterEditPage.tsx` |
| **금지(현 시점)** | `records.ts`, 기록 페이지, requestId 정책 |

---

## 9. 검증 시나리오 (승인·수정 후 / Work 안전 수동)

1. Dashboard: bypass OFF, `GOOGLE_AI_API_KEY`/`SERVICE_ROLE_KEY` 존재 (값 미공유).
2. 키를 임시 제거한 **스테이징**에서 generate-chapter → `AI_UNAVAILABLE`, DB 챕터 0건 증가.
3. 키 복구 후 미배치 ≥3 → 챕터 1건, `ai_usage.feature=chapter`.
4. Free: 정책상 4번째 챕터 거부(구현 후).
5. Free: `cover_03` 직접 API 저장 시도 → 서버 거부(구현 후).
6. Free 1회 PDF 성공, 2회 `PUBLICATION_LIMIT`.
7. 타 계정 publication id / storage path 접근 거부.
8. 멀티탭 동시 generate-chapter → 1건만 성공(구현 후).

---

## 갱신 이력

| 날짜 | 내용 |
|------|------|
| 2026-10-24 | 최초 정적 점검·설계안 · 기능 코드 미변경 |
