# 01. Product Spec

**Status:** Current functional specification  
**Updated:** 2026-09-28

## 1. Project / Book

### Rule

**Project = one Book**

모든 기록, AI 분석, 챕터, 표지, 발행 결과는 하나의 Project에 귀속된다.

### Project types

사용자-facing 유형은 9개다.

1. 나의 성장
2. 나의 이야기
3. 일과 커리어
4. 가족과 육아
5. 사랑과 관계
6. 여행과 모험
7. 취미와 일상
8. 배움과 도전
9. 자유 기록

유형은 AI 질문 방향, readiness 기준, 챕터 추천 방향에 영향을 준다. 기록을 강제로 특정 주제에 맞추는 용도로 사용하지 않는다.

## 2. Recording

### Record mode

기록 방식은 **프로젝트 생성 시 고정하지 않는다.**

사용자가 `오늘 기록하기`를 누를 때마다 선택한다.

Current modes:

- AI 질문으로 기록
- 자유롭게 기록
- 사진으로 기록 (현재 구현된 선택형 모드)

### Original preservation

원본 기록은 항상 보존한다.

AI가 이후 문장을 편집하거나 챕터 원고를 생성하더라도 원본 기록을 삭제하거나 덮어쓰지 않는다.

### Record fields in current MVP

- content
- optional title
- optional AI question text
- optional photo
- emotion tags
- created time
- project relationship

## 3. Story Readiness

책 만들기는 몇 개 기록 후 즉시 열리지 않는다.

현재 UX 원칙:

> **기간 + 충분한 기록량**이 쌓인 뒤 책 만들기를 연다.

현재 MVP readiness v1은 기간과 기록 수를 사용한다. 장기적으로 AI story-quality signal을 추가할 수 있다.

Current rule set:

| Type | Minimum | Target |
|---|---:|---:|
| 나의 성장 | 60일 + 30개 | 90일 + 40개 |
| 나의 이야기 | 90일 + 40개 | 180일 + 60개 |
| 일과 커리어 | 60일 + 30개 | 90일 + 40개 |
| 가족과 육아 | 30일 + 30개 | 90일 + 45개 |
| 사랑과 관계 | 30일 + 25개 | 90일 + 40개 |
| 여행과 모험 | 7일 + 10개 | 15일 + 15개 |
| 취미와 일상 | 30일 + 20개 | 60일 + 30개 |
| 배움과 도전 | 30일 + 20개 | 90일 + 35개 |
| 자유 기록 | 30일 + 20개 | 60일 + 30개 |

Current scoring:

- 기간 진행: 35%
- 기록량 진행: 65%
- 실제 unlock은 minimum days와 minimum records를 모두 충족해야 한다.

> **Open issue:** 프로젝트 생성 화면의 별도 목표 기간/빈도/target_count 정책과 readiness를 하나로 통합해야 한다. Product Decisions 참조.

## 4. Book Making

Unlock 이후의 사용자 흐름:

```text
챕터
→ 원고
→ 표지
→ 최종 검수
→ 발행
```

### Chapters

목표 제품 동작:

- 전체 기록에서 반복되는 주제와 변화 흐름을 찾는다.
- 단순히 10개씩 시간순으로 자르지 않는다.
- 기록과 챕터의 관계는 유연하게 구성한다.
- 사용자는 챕터 제목·원고·순서를 수정할 수 있다.

> 현재 코드는 10개 미할당 기록 단위 생성 로직을 포함하고 있으며 DB v2 이전에 교체 대상이다.

### Manuscript

Manuscript는 별도 본문 데이터 복제본이 아니라 **챕터 원고를 책 전체 관점에서 검수하는 workflow stage**로 본다.

각 챕터에는:

- AI-generated content
- user-edited content

가 존재할 수 있으며, 표시 시 user content가 우선한다.

### Cover

MVP:

- 기본 템플릿 표지
- Free 기본 표지 사용 가능
- Pro 전용 표지 선택 가능

Post-MVP:

- AI custom cover
- 사용자 커스텀 업로드/편집 검토

### TOC / Final review

발행 전 확인:

- 책 제목/작가
- 표지
- 목차
- 챕터 원고
- 발행 권한

현재 전용 TOC 화면은 없고 Final Review 안에서 목차를 확인한다.

### Publication

MVP publication:

- MY CHAPTER 내부 발행 상태 생성
- PDF 생성/저장/다운로드
- 내 서재 및 발행 이력에서 접근

외부 서점 등록은 MVP가 아니다.

## 5. Library

Status:

- 진행중
- 발행가능
- 발행완료

내 서재에서 각 책의:

- 표지
- 제목
- 유형
- 상태
- 이야기 준비도
- 기록 수

를 확인한다.

## 6. Notifications

현재 목적:

- 기록 리마인드
- 챕터 완료
- badge/achievement

알림은 제품의 핵심이 아니라 기록 지속을 돕는 보조 기능이다.

## 7. Subscription

핵심 원칙:

> **Free 사용자가 첫 번째 책을 실제로 완성하고 발행할 수 있어야 한다.**

자세한 사항은 `06_FREE_PRO_POLICY.md` 참조.

## 8. Product invariants

아래는 기능 구현보다 우선한다.

- 사용자가 이야기의 주인공이다.
- AI는 기록에 없는 사실을 만들지 않는다.
- 원본 기록은 보존한다.
- 기록 자체를 과도하게 paywall로 막지 않는다.
- Project와 Book을 사용자 경험에서 분리하지 않는다.
- 발행된 결과물은 장기적으로 versioned snapshot으로 다룬다.
