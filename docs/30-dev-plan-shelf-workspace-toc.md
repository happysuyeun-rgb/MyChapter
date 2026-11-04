# 30 · 개발 계획 — 보관함 · 작업실 · Final Review 목차

> 작성 2026-11-04 · 설계: [29-design-shelf-workspace-toc-ai-edit.md](./29-design-shelf-workspace-toc-ai-edit.md)  
> 브랜치: `feat/shelf-archive-workspace-toc` · 단계별 커밋 → 단일 PR → 사용자 승인 후 main 머지  
> **진행:** Step 1~4 구현 완료 (2026-11-04) · build 통과 · mock 모드 화면 확인(보관함 꺼내기, 작업실 NEXT STEP, Final Review 빈 챕터 경고)

## 제약

- DB 마이그레이션 · Edge Function · Secrets 변경 없음
- `VITE_DEV_BYPASS` mock 경로를 함께 구현 (로컬 검증용)
- 기존 컴포넌트 재사용: `BrandMasthead`, `StudioSection`, `StepperVisual`, `Modal`, `Button`, `EmptyState`

## 순서

### Step 1 · 보관함 (D1 / L-06)

| 파일 | 작업 |
|------|------|
| `src/lib/api/projects.ts` | `getArchivedProjects(userId)`, `restoreProject(projectId, userId)` |
| `src/mocks/projects.ts`, `src/mocks/index.ts` | `mockGetArchivedProjects`, `mockRestoreProject` |
| `src/pages/project/ArchivedProjectsPage.tsx` | 신규 `/library/archived` |
| `src/router/index.tsx` | AppLayout 하위 라우트 추가 |
| `src/pages/project/ProjectsListPage.tsx` | 하단 `보관함 · N권 →`, 활성 0·보관≥1 빈 상태 |
| `src/components/common/EmptyState.tsx` | `archivedCount` prop → 보관 전용 문구/CTA |
| `src/pages/home/HomePage.tsx` | 활성 0·보관≥1이면 보관 빈 상태 |

검증

- [ ] P-07에서 보관 → 서재에서 사라지고 하단에 `보관함 · 1권`
- [ ] 보관함에서 `서재로 꺼내기` → 서재에 복귀, 보관함 목록에서 제거
- [ ] 보관함에서 `영구 삭제` → `책 삭제` 입력 전 버튼 비활성, 삭제 후 목록 제거
- [ ] Free · 유일한 책 보관 → 홈/서재 모두 `보관함 열기` 빈 상태 (생성 CTA 아님)
- [ ] Free 안내 문구는 Free에서만 노출

### Step 2 · 작업실 단계 UX (D2 / P-06)

| 파일 | 작업 |
|------|------|
| `src/pages/project/ProjectWorkspacePage.tsx` | NEXT STEP 블록, 원고 active, 완료 날짜, 발행 단계 → 발행본 |

검증

- [ ] 준비도 미충족: Primary `+ 오늘 기록하기`만 존재
- [ ] 준비 완료 · 챕터 0: Primary `챕터 만들기`, 기록은 텍스트 링크
- [ ] 단계별 NEXT STEP 문구/경로가 PRODUCTION 목록의 첫 미완료 단계와 일치
- [ ] 발행됨: `발행본 보기` → `/publication/:id`
- [ ] 화면에 ink solid 버튼이 1개

### Step 3 · Final Review 목차 · 단일 CTA (D3 / B-09 · U-01)

| 파일 | 작업 |
|------|------|
| `src/pages/book/FinalReviewPage.tsx` | Desk 레이아웃, 목차 행(기록 수·분량·빈 원고), 순서 바꾸기 링크, 빈 챕터 시 원고 체크 비활성, 단일 CTA |

검증

- [ ] 목차 행에 `기록 N개 · 약 N자` 표시, 빈 챕터는 경고
- [ ] 빈 챕터 존재 시 `원고 최종 확인` 체크 불가
- [ ] 검수 저장 전/후 Primary 1개만 노출
- [ ] 발행 진행/실패/Paywall 분기 기존과 동일

### Step 4 · 문서 상태 갱신

- `05_SCREEN_SPEC.md` — L-06 Implemented, P-06 Implemented, B-09 Implemented
- `21-screen-completeness.md` — 동일 반영

## 공통 검증

- `npm run build` (tsc + vite) 통과
- 변경 파일 lint 오류 없음
- 커밋 제외: `node_modules_broken_bak/`, `src/lib/api/functionInvoke.ts`(줄바꿈 노이즈)

## 이후 (이번 PR 밖)

- D4 AI 편집: Open decision(Free 한도 Q1/Q2/Q3) 확정 → DB 설계(기록 편집본) → Edge Function → R-06 화면
- P0 운영: AI/PDF LIVE E2E, `BILLING_DEV_BYPASS` OFF, Play Billing
