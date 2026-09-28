# MY CHAPTER

> **하루를 기록하고, 삶을 한 권으로.**

MY CHAPTER는 사용자가 자신의 이야기를 **책(Project)** 단위로 기록하고, AI가 기록을 분석해 챕터와 원고로 발전시킨 뒤 최종적으로 전자책으로 발행하도록 돕는 기록 출판 서비스입니다.

## Product status

- MVP UI/IA skeleton: 1차 구현 완료
- Current focus: 제품 정책 정합성 정리 → DB v2 설계/마이그레이션
- Working branch: `audit/mychapter-sept-2026`
- External bookstore / POD / community / multilingual: MVP 제외

## Source of truth

제품 정책과 개발 판단은 아래 문서를 우선합니다.

1. [Product Decisions](docs/02_PRODUCT_DECISIONS.md)
2. [Product Spec](docs/01_PRODUCT_SPEC.md)
3. [IA](docs/03_IA.md) / [Screen Spec](docs/05_SCREEN_SPEC.md)
4. [Architecture](docs/07_ARCHITECTURE.md)
5. [DB v2 Design](docs/08_DB_V2_DESIGN.md)

## Docs

- [00 Product Overview](docs/00_PRODUCT_OVERVIEW.md)
- [01 Product Spec](docs/01_PRODUCT_SPEC.md)
- [02 Product Decisions](docs/02_PRODUCT_DECISIONS.md)
- [03 IA](docs/03_IA.md)
- [04 User Flows](docs/04_USER_FLOWS.md)
- [05 Screen Spec](docs/05_SCREEN_SPEC.md)
- [06 Free / Pro Policy](docs/06_FREE_PRO_POLICY.md)
- [07 Architecture](docs/07_ARCHITECTURE.md)
- [08 DB v2 Design](docs/08_DB_V2_DESIGN.md)
- [09 AI Policy](docs/09_AI_POLICY.md)
- [10 Design System](docs/10_DESIGN_SYSTEM.md)
- [11 MVP Scope](docs/11_MVP_SCOPE.md)
- [MVP Changelog](docs/CHANGELOG_MVP.md)

## Product structure

```text
Book(Project)
├─ Records
│  └─ Record Analysis
├─ Chapters
│  └─ Chapter ↔ Records
├─ Manuscript workflow
├─ Cover
└─ Publications
```

## Current product flow

```text
책 생성
→ 기록
→ 이야기 준비도
→ 책 만들기 Unlock
→ 챕터 구성
→ 원고 편집
→ 표지
→ 최종 검수
→ 발행
→ 내 서재
```

> DB v2 문서는 현재 설계안이며 아직 Supabase에 적용되지 않았습니다.
