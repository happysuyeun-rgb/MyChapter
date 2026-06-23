---
name: mychapter-ui
description: >-
  MyChapter UI 작업 시 DESIGN.md(Notion)와 프로젝트 토큰을 함께 적용합니다.
  Empty State, Paywall, 온보딩, 카드·모달 폴리싱 요청 시 사용하세요.
  docs/ 문서를 수정할 때는 상단 최종 갱신 날짜와 갱신 이력을 반드시 업데이트하세요.
---

# MyChapter UI 가이드

## 참고 파일 (순서대로)

1. **`DESIGN.md`** — Notion 기반 레이아웃·간격·empty-state·modal 패턴
2. **`tailwind.config.js`** — MyChapter 브랜드 색·폰트 (우선 적용)
3. **`docs/00-design-decisions.md`** — 제품·아키텍처 결정

## 브랜드 토큰 (DESIGN.md보다 우선)

| 토큰 | 값 | 용도 |
|------|-----|------|
| accent | `#3B6D11` | CTA, 활성 탭, 강조 |
| accent-light | `#EAF3DE` | 아이콘 배경, 배너 |
| surface / surface-alt | `#F5F4F0` / `#F0EEEA` | 페이지·카드 배경 |
| ink / ink-muted | `#1A1A18` / `#6B6B67` | 본문·보조 텍스트 |
| font-serif | Noto Serif KR | Empty State·Paywall 제목 |
| font-sans | Noto Sans KR | 본문·버튼 |
| rounded-card | 16px | 카드·시트 |
| rounded-btn | 14px | 버튼 |

## Notion에서 가져올 패턴

- **Empty state**: `ex-empty-state-card` — 부드러운 `canvas-soft` 배경 원형 아이콘 프레임, serif 제목, 짧은 caption
- **Paywall / modal**: `ex-modal-card`, `pricing-plan-card-featured` — 상단 핸들, 기능 리스트, primary CTA + ghost 보조
- **간격**: sm=12px, md=16px, lg=24px
- **아이콘**: 이모지 대신 `FlatIcon` (`src/components/common/FlatIcon.tsx`) 라인 SVG

## 구현 규칙

- 새 화면은 기존 `Button`, `Card`, `EmptyState`, `FlatIcon` 재사용
- 탭바·Empty State·Paywall 아이콘 스타일 통일 (stroke 1.75, round cap)
- 과한 그림자·그래디언트 금지 — 따뜻한 미니멀 유지
- 모바일 max-width `430px` (`max-w-phone`) 준수

## UI 폴리싱 체크리스트

- [ ] 제목에 `font-serif` 적용 여부
- [ ] 보조 텍스트 `text-ink-muted`
- [ ] CTA는 `Button` primary variant
- [ ] 이모지 → `FlatIcon` 교체
- [ ] 카드/배너에 적절한 padding (`p-4` 이상)
