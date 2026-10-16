# MY CHAPTER 문서 인덱스

**Status:** CURRENT  
**Updated:** 2026-10-16

이 문서는 MY CHAPTER 저장소의 문서 구조와 우선순위를 정의한다.

> 원칙: 같은 정책을 여러 문서에서 다시 정의하지 않는다.  
> 상세 문서는 한 곳만 Source of Truth로 두고, 다른 문서는 링크/참조만 한다.

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
| 14 | `14_API_SPEC.md` | Client API + Edge Function 계약 | NEXT |
| 15 | `15_DATA_DICTIONARY.md` | 실제 schema/필드/관계 | NEXT |

### 개발명세서 작성 원칙

`13_DEVELOPMENT_SPEC.md`는 정책을 다시 만드는 문서가 아니다.

- Product 정책 → 02/06 참조
- 화면/route → 05 참조
- DB 필드 → 15 참조
- API request/response → 14 참조
- 개발명세서는 **어떻게 구현하고 연결하는지**를 설명한다.

---

## 4. QA / Release / Progress

| 문서 | 역할 | 상태 |
|---|---|---|
| [SCREEN_IMPLEMENTATION_GAP.md](./SCREEN_IMPLEMENTATION_GAP.md) | Screen Spec ↔ 현재 코드 차이 | ACTIVE |
| [CHANGELOG_MVP.md](./CHANGELOG_MVP.md) | MVP 변경 이력 | ACTIVE |
| `16_QA_E2E.md` | 기능/권한/실데이터 E2E | NEXT |
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
3. `14_API_SPEC.md` — 현재 코드/Edge Function 계약 정리
4. `15_DATA_DICTIONARY.md` — 실제 Supabase schema 기준
5. `16_QA_E2E.md` — 실사용자 E2E / RLS / Free-Pro 검증
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
