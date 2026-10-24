# MY CHAPTER 문서 인덱스

**Status:** CURRENT  
**Updated:** 2026-10-24

이 문서는 MY CHAPTER 저장소의 문서 구조와 우선순위를 정의한다.

> 원칙: 같은 정책을 여러 문서에서 다시 정의하지 않는다.  
> 상세 문서는 한 곳만 Source of Truth로 두고, 다른 문서는 링크/참조만 한다.

> **E2E 현황:** → **[22-e2e-status.md](./22-e2e-status.md)** (로그인 LIVE PASS · 책·기록 PENDING)  
> **지금 본인이 할 일:** → **[18-user-next-steps.md](./18-user-next-steps.md)** STEP 4 (책·기록·PAGE)

---

## 1. 문서 우선순위

충돌 시 아래 순서로 판단한다.

1. `02_PRODUCT_DECISIONS.md` — 확정 제품 정책
2. `01_PRODUCT_SPEC.md` — 현재 기능 정의
3. `05_SCREEN_SPEC.md` — 화면/UX 최종 기준
4. `06_FREE_PRO_POLICY.md` — Free/Pro 및 과금 정책
5. `07_ARCHITECTURE.md` — 시스템 구조
6. `08_DB_V2_DESIGN.md` + 실제 Supabase schema/migrations — 데이터 구조
7. `13_DEVELOPMENT_SPEC.md` — 통합 개발 구현 명세
8. `14_API_SPEC.md` — Client API / Edge Function 계약
9. `15_DATA_DICTIONARY.md` — 실제 데이터 필드/관계
10. `16_QA_E2E.md` — QA / E2E 기준
11. `17_RELEASE_RUNBOOK.md` — 배포/운영 절차

실제 코드가 위 확정 정책과 다르면 코드를 수정하거나 Product Decision을 명시적으로 변경한다.

---

## 2. Product / UX — 현재 Source of Truth

| 번호 | 문서 | 역할 | 상태 |
|---|---|---|---|
| 00 | [00_PRODUCT_OVERVIEW.md](./00_PRODUCT_OVERVIEW.md) | 서비스 정의/포지셔닝 | CURRENT |
| 01 | [01_PRODUCT_SPEC.md](./01_PRODUCT_SPEC.md) | 기능/도메인 정의 | CURRENT |
| 02 | [02_PRODUCT_DECISIONS.md](./02_PRODUCT_DECISIONS.md) | 확정 의사결정 | **PRIMARY SoT** |
| 03 | [03_IA.md](./03_IA.md) | IA / 메뉴 구조 | CURRENT |
| 04 | [04_USER_FLOWS.md](./04_USER_FLOWS.md) | 핵심 사용자 플로우 | CURRENT |
| 05 | [05_SCREEN_SPEC.md](./05_SCREEN_SPEC.md) | 화면/UX v1.1 | **PRIMARY UX SoT** |
| 06 | [06_FREE_PRO_POLICY.md](./06_FREE_PRO_POLICY.md) | Free/Pro / 과금 정책 | CURRENT |
| 09 | [09_AI_POLICY.md](./09_AI_POLICY.md) | AI 역할/안전/원본 보존 | CURRENT |
| 10 | [10_DESIGN_SYSTEM.md](./10_DESIGN_SYSTEM.md) | 디자인 시스템 | CURRENT |
| 11 | [11_MVP_SCOPE.md](./11_MVP_SCOPE.md) | MVP 범위 | CURRENT |

---

## 3. Technical — 개발 기준

| 번호 | 문서 | 역할 | 상태 |
|---|---|---|---|
| 07 | [07_ARCHITECTURE.md](./07_ARCHITECTURE.md) | 기술 스택/도메인/런타임 구조 | CURRENT |
| 08 | [08_DB_V2_DESIGN.md](./08_DB_V2_DESIGN.md) | DB v2 설계 배경/구조 | CURRENT, 일부 상태 문구 갱신 필요 |
| 12 | [12_DB_V2_CUTOVER_CHECKLIST.md](./12_DB_V2_CUTOVER_CHECKLIST.md) | DB v2 적용/검증 체크리스트 | ACTIVE |
| 13 | [13_DEVELOPMENT_SPEC.md](./13_DEVELOPMENT_SPEC.md) | **통합 개발명세서** | CURRENT |
| 14 | [14_API_SPEC.md](./14_API_SPEC.md) | Client API + Edge Function 계약 | WORKING (source-audited v0.1) |
| 15 | [15_DATA_DICTIONARY.md](./15_DATA_DICTIONARY.md) | schema/필드/관계 — 원격 DB 대조 전 | WORKING (repository v0.1) |

### 개발명세서 작성 원칙

`13_DEVELOPMENT_SPEC.md`는 정책을 다시 만드는 문서가 아니다.

- Product 정책 → 02/06 참조
- 화면/route → 05 참조
- DB 필드 → 15 참조
- API request/response → 14 참조
- 개발명세서는 **어떻게 구현하고 연결하는지**를 설명한다.

### 런치 운영 문서 (소문자 하이픈 시리즈)

아래 문서는 출시 준비/운영 작업용이다. 제품 정책의 기준은 위 `00~15` 대문자 문서이며, 충돌 시 대문자 문서가 우선한다.

| 문서 | 설명 | 대상 | 최종 갱신 |
|------|------|------|-----------|
| **[06-user-tasks.md](./06-user-tasks.md)** | **직접 해야 하는 일** (Supabase, Vercel, Play 등) | **서비스 담당자** | — |
| **[07-dev-progress.md](./07-dev-progress.md)** | AI 구현 현황 (완료 / 연동 필요 / 미완) | 담당자 + 개발자 | 2026-06-23 |
| **[08-development-specification.md](./08-development-specification.md)** | **개발명세서** (통합 기술 문서) | 전체 | — |
| **[09-supabase-setup.md](./09-supabase-setup.md)** | Supabase + **마이그레이션 적용** | Supabase 연결 시 필수 | — |
| **[11-agent-workflow.md](./11-agent-workflow.md)** | AI 에이전트 프롬프트·출시 체크리스트 요약 | 담당자 + Cursor | 2026-06-23 |
| **[15-launch-roadmap.md](./15-launch-roadmap.md)** | **출시 로드맵·우선순위·2주 일정** | **담당자 (시작점)** | 2026-10-24 |
| **[16-dev-plan.md](./16-dev-plan.md)** | **잔여 점검·Wave 0~3 개발 계획** | **개발 진행 시 필독** | 2026-10-23 |
| **[17-test-report.md](./17-test-report.md)** | **스모크·자동테스트·로그인 LIVE 요약** | 담당자 + Cursor | 2026-10-24 |
| **[18-user-next-steps.md](./18-user-next-steps.md)** | **본인 할 일 상세 따라하기** | **서비스 담당자 (지금)** | 2026-10-24 |
| **[19-gap-and-ux-plan.md](./19-gap-and-ux-plan.md)** | **기능 누락 재점검 + UX·디자인 개선 계획** | 제품·개발 | 2026-10-24 |
| **[20-error-cases.md](./20-error-cases.md)** | **기능별 에러 케이스 (코드 점검)** | QA·개발 | 2026-10-23 |
| **[21-screen-completeness.md](./21-screen-completeness.md)** | **화면 완성도·미개발 점검** | 제품·개발 | 2026-10-23 |
| **[22-e2e-status.md](./22-e2e-status.md)** | **LIVE E2E PASS/PENDING·출시 차단** | **담당자 + Work + Cursor** | 2026-10-24 |
| **[23-ai-pdf-safety.md](./23-ai-pdf-safety.md)** | **AI 챕터·PDF 서버 안전성·설계안** | 담당자 + Cursor (기능 수정 승인 전) | 2026-10-24 |
| **[06-play-store-listing-draft.md](./06-play-store-listing-draft.md)** | **Play 스토어 등록정보 초안** | 사용자 + Cursor | 2026-10-23 |
| **[07-manual-setup-checklist.md](./07-manual-setup-checklist.md)** | **수동 설정 체크리스트** (Secrets, Vercel, Play 등) | 사용자 | 2026-10-23 |

---

## 4. QA / Release / Progress

| 문서 | 역할 | 상태 |
|---|---|---|
| [SCREEN_IMPLEMENTATION_GAP.md](./SCREEN_IMPLEMENTATION_GAP.md) | Screen Spec ↔ 현재 코드 차이 | ACTIVE |
| [CHANGELOG_MVP.md](./CHANGELOG_MVP.md) | MVP 변경 이력 | ACTIVE |
| [16_QA_E2E.md](./16_QA_E2E.md) | 기능/권한/실데이터 E2E | ACTIVE (v0.2; auth LIVE PASS, Book/Record PENDING) |
| [22-e2e-status.md](./22-e2e-status.md) | LIVE 현황 보드 | ACTIVE |
| `17_RELEASE_RUNBOOK.md` | Vercel/Supabase/Android 배포 절차 | NEXT |

---

## 5. Legacy 문서

아래 **소문자·하이픈 형식의 2026-06 문서군은 초기 MVP 문서**다.

예:

- `00-design-decisions.md`
- `01-routing-and-flows.md`
- `02-database-schema.md`
- `03-edge-functions-api.md`
- `04-business-rules.md`
- `05-implementation-plan.md`
- `06-user-tasks.md`
- `07-dev-progress.md`
- `08-development-specification.md`
- `09-supabase-setup.md`
- `10-screen-spec-phase3-home-record.md`
- `11-screen-spec-phase1-2-auth-project.md`
- `12-screen-spec-phase4-book.md`
- `13-screen-spec-phase5-mypage-payment.md`
- `14-platform-spec-phase6-android-push-deploy.md`
- `15-launch-roadmap.md`

이 문서들은 현재 제품 정책과 충돌하는 내용이 포함되어 있으므로 **신규 개발 판단에 사용하지 않는다.**

대표적인 오래된 내용:

- 10개 기록 단위 챕터 자동 생성
- Free 3챕터 제한
- Free PDF 발행 불가
- `published_books` 단일 발행 구조
- `daily_questions` 1일 캐시 기반
- 이전 화면 ID(S-xx)
- DB v2 적용 전 상태

보존 목적은 변경 이력/과거 설계 참고뿐이다.

향후 물리적으로 `docs/archive/2026-06/`로 이동할 수 있으나, 기존 링크 파손을 피하기 위해 현재 단계에서는 **Deprecated 표시 + 인덱스 분리**를 우선한다.

### 출시 작업 진행 순서

1. **[22-e2e-status.md](./22-e2e-status.md)** — LIVE E2E 현황  
2. **[18-user-next-steps.md](./18-user-next-steps.md)** — **지금 본인이 할 일 (상세)**
3. **[16-dev-plan.md](./16-dev-plan.md)** — 뭐가 남았는지·Wave 계획
4. **[15-launch-roadmap.md](./15-launch-roadmap.md)** — P0부터 출시 순서
5. [06-user-tasks.md](./06-user-tasks.md) — Supabase·Vercel·Play 전체

---

## 6. 문서 상태 표기

각 문서 상단에 아래 중 하나를 사용한다.

- **CURRENT** — 현재 구현/정책 기준
- **PRIMARY SoT** — 충돌 시 우선하는 기준 문서
- **ACTIVE** — 진행/체크리스트
- **WORKING** — 작성/전환 중
- **NEXT** — 생성 예정
- **DEPRECATED** — 신규 판단에 사용 금지
- **ARCHIVE** — 과거 이력 보관

---

## 7. 지금부터의 작성 순서

1. 문서 구조 정리 / legacy 분리 — **DONE**
2. `13_DEVELOPMENT_SPEC.md` — 통합 개발명세서 — **DONE**
3. `14_API_SPEC.md` — 현재 코드/Edge Function 계약 정리 — **WORKING (v0.1, 추가 응답 계약 검증 필요)**
4. `15_DATA_DICTIONARY.md` — repository schema 기준 초안 **WORKING (v0.1, 실제 Supabase 확인 필요)**
5. `16_QA_E2E.md` / `22-e2e-status.md` — 이메일 로그인 LIVE PASS · **책·기록 E2E 진행 중**
6. `17_RELEASE_RUNBOOK.md` — 출시/운영 절차
7. 오래된 문서의 물리적 archive 이동은 마지막에 수행

---

## 8. 문서 관리 규칙

- 확정 정책을 개발명세서에서 임의 변경하지 않는다.
- 실제 DB가 설계 문서보다 앞선 경우 실제 schema를 확인하고 설계 문서를 갱신한다.
- Edge Function 코드를 바꾸면 14_API_SPEC도 함께 검토한다.
- migration을 적용하면 15_DATA_DICTIONARY와 12_DB_V2_CUTOVER_CHECKLIST를 함께 갱신한다.
- 화면 behavior가 바뀌면 05_SCREEN_SPEC와 SCREEN_IMPLEMENTATION_GAP을 함께 갱신한다.
- 출시 전 E2E 결과는 16_QA_E2E에 남긴다.
- 비밀키/토큰/서비스 계정 JSON은 문서에 기록하지 않는다.

### 런치 문서 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-23 | `15-launch-roadmap.md`, `11-agent-workflow.md` 추가; 문서 작성 규칙·날짜 표기 도입 |
| 2026-10-23 | `16-dev-plan.md` 추가 — 잔여 점검·개발 Wave 계획 |
| 2026-10-23 | `17-test-report.md` — build·Edge 프로브·UI 스모크 |
| 2026-10-23 | `18-user-next-steps.md` — 본인 할 일 상세 가이드 |
| 2026-10-23 | `19-gap-and-ux-plan.md` — 명세 갭 재검증·UX Wave U0~U4 |
| 2026-10-23 | `20-error-cases.md` — 기능별 에러 케이스 코드 점검 |
| 2026-10-23 | `21-screen-completeness.md` — MVP 화면 누락 없음·미개발 P0~P2 |
| 2026-10-24 | `22-e2e-status.md` — 운영 로그인 7/7 PASS · 책·기록 PENDING |
| 2026-10-24 | `23-ai-pdf-safety.md` — AI·PDF 서버 위험·설계 · Secret 명칭 문서 정정 |
