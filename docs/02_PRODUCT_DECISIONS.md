# 02. Product Decisions

**Status:** Source of truth for product decisions  
**Updated:** 2026-09-28

이 문서는 구현보다 우선한다. 코드와 이 문서가 충돌하면 **확정된 Decision을 기준으로 구현을 수정한다.**

Legend:

- **CONFIRMED**: 제품 정책으로 확정
- **PROPOSED**: DB v2 적용 전 최종 검토 필요
- **OPEN**: 아직 수치/정책 미확정

---

## PD-001 · Project means Book

**Status: CONFIRMED**

사용자에게 Project는 별도 관리 개념이 아니라 **한 권의 책**이다.

## PD-002 · Recording mode is chosen per record

**Status: CONFIRMED**

AI 질문 / 자유 기록 / 사진 기록은 프로젝트 생성 시 고정하지 않는다. 매 기록 시 선택한다.

따라서 `projects.record_mode`는 DB v2에서 제거 후보이다.

## PD-003 · Book making is gated

**Status: CONFIRMED**

몇 개 기록만으로 책 만들기를 즉시 열지 않는다.

MVP gate:

- elapsed duration
- record volume

향후 AI story-quality signal을 추가할 수 있다.

## PD-004 · One readiness source of truth

**Status: CONFIRMED**

Book Readiness를 책 만들기 unlock과 사용자-facing 진행도의 유일한 기준으로 사용한다.

- 프로젝트 생성 화면에서 period/frequency/target_date 기반의 완성 예측을 제거했다.
- legacy `target_count`, `frequency`, `target_date`, project-level `notification_time`은 DB v2 cutover 전까지 호환 필드로만 남긴다.
- 사용자에게 서로 다른 두 개의 완성률을 노출하지 않는다.

## PD-005 · No automatic chapter at every 10 records

**Status: CONFIRMED**

기록 저장 시 `recordCount % 10 === 0`으로 챕터를 자동 생성하던 구현을 제거했다.

원하는 흐름:

```text
기록 축적
→ readiness 충족
→ 사용자가 책 만들기 시작
→ AI가 전체 기록을 분석
→ 챕터 구조 제안/생성
```

## PD-006 · Chapters are semantic, not fixed 10-record buckets

**Status: CONFIRMED**

AI는 기록을 시간순 고정 묶음으로 나누지 않는다.

반복 주제, 사건, 관계, 변화 흐름을 바탕으로 관련 기록을 선택해 한 챕터를 구성한다. DB v2 migration과 semantic clustering Edge Function 배포를 완료했으며, `chapter_records`를 현재 source of truth로 사용한다.

## PD-007 · Manuscript is a workflow stage

**Status: CONFIRMED**

별도 manuscript 본문 테이블을 두지 않는다.

챕터의 AI content + user content가 원고의 source of truth이며, Manuscript 화면은 전체 원고 검수 workflow다.

## PD-008 · Preserve original records

**Status: CONFIRMED**

AI 편집/챕터 생성/재생성은 원본 기록을 변경하지 않는다.

## PD-009 · Free user can complete one real book

**Status: CONFIRMED**

Free 사용자는 첫 책에서:

- 기록
- AI 질문
- 책 만들기
- 원고
- 기본 표지
- 최종 검수
- PDF 발행 1회

까지 완료할 수 있어야 한다.

Free chapter 3개 제한은 제거했다. 첫 책의 챕터 수 자체는 과금 지점으로 사용하지 않는다.

## PD-010 · Paid conversion after first-book success

**Status: CONFIRMED**

주요 Pro 전환 지점:

- 두 번째 책
- 재발행 / 추가 publication version
- 확장 AI 기능
- Pro cover / 향후 AI cover

기록을 시작하기 전에 과금벽을 과도하게 세우지 않는다.

## PD-011 · Publication is versioned snapshot

**Status: CONFIRMED**

발행된 책은 당시의 제목/원고/목차/표지를 보존하는 immutable snapshot으로 설계한다.

재발행 시 기존 publication을 덮어쓰지 않고 v2, v3를 만든다.

## PD-012 · Record analysis should be persisted

**Status: CONFIRMED**

장기 개인화와 Story Graph를 위해 record-level structured analysis를 저장한다.

readiness v1은 이를 필수 조건으로 사용하지 않는다.

## PD-013 · Chapter-record relation should be normalized

**Status: CONFIRMED**

현재 중복 관계:

- `records.chapter_id`
- `chapters.record_ids[]`

DB v2에서는 `chapter_records` relation table을 source of truth로 사용하는 방향을 우선한다.

## PD-014 · Project type can change

**Status: CONFIRMED / IMPLEMENTED**

화면에서 “나중에 바꿔도 기록은 그대로 남는다”고 안내한다.

변경 시:

- 원본 기록 유지
- 기존 원고 유지
- 미래 AI 질문/추천은 새 type 반영
- 이미 readiness unlock을 달성한 책은 `ready_at`으로 유지하여 다시 잠그지 않는다.

Project Settings에서 제목과 책 유형 변경을 구현했다.

## PD-015 · PAGE is a brand character

**Status: CONFIRMED**

PAGE는 범용 icon set으로 대체하지 않는다.

ItsHover 등 오픈소스 아이콘은 기능 아이콘용이며 PAGE는 별도 브랜드 자산이다.

## PD-016 · Hallmark is an audit rule, not a theme replacement

**Status: CONFIRMED**

Hallmark는 반복 카드, AI-template UI, 과도한 장식 등을 줄이는 디자인 감사 기준으로 사용한다.

MY CHAPTER의 고유 Paper × Editorial 시스템이 우선한다.

## Open decisions

아래 항목은 아직 수치 확정 금지:

- Free AI edit quota: 총 3회 vs 월 3회
- Pro AI edit quota/fair-use
- Pro AI cover fair-use quota
- EPUB를 어느 milestone에 포함할지
