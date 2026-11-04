# 06. 구현 계획 (Phase 구분)

> Phase 1: 문서 (`01`–`06`). Phase 2: 사용자 승인 후 Desk 셸 UI + 토큰/공통 컴포넌트 문서 (`07`–`08`) 및 홈·탭·Empty 적용.

---

## 1. Phase 개요

| Phase | 내용 | 산출 | 금지 |
|-------|------|------|------|
| **1** | UX 감사·유아이볼·전략·IA·DS·계획 | `docs/redesign/*` + 검토 PR | 서비스 코드·배포·DB |
| **2** | 셸 UX: 홈 Desk · Tab · Empty · 용어 | UI만, API 동일 | 스키마·결제·발행 로직 |
| **3** | 책 작업실 · 기록 모드 · SuccessPanel | `StudioSection`/`StepperVisual`/`SuccessPanel` · 잠금 카피 | entitlement/RPC 변경 |
| **4** | Pro 설득·동의 UI 자리 · 폴리시 | 결제 UI 카피만 | Secret·약관 무단 게시 |
| **5** | 시각 토큰 미세조정 · a11y · QA | 체크리스트 | 무단 레퍼런스 복제 |

각 Phase는 **별도 브랜치 + PR**, 병합은 사용자 승인 후.

---

## 2. 첫 번째 개발 대상 (Phase 2 추천)

### **홈 Desk + Tab IA 정렬 + Empty states**

| 항목 | 범위 |
|------|------|
| 대상 path | `/home`, `/library`, TabBar (`AppLayout`) |
| 대상 파일(예상) | `HomePage`, `TabBar`/`AppLayout`, `ProjectsListPage` Empty, 공통 `EmptyState` |
| 포함 | 준비도 위젯 배치, CTA 1개 강조, 서재/홈 Empty+CTA, 탭 라벨·아이콘 톤 |
| 제외 | 라우트 path 변경, API·Supabase, 온보딩 재설계, Paywall 로직 |
| 예상 규모 | S~M (수 개 페이지 + 1 공통 컴포넌트) |
| 성공 기준 | `/home`이 “책을 만드는 작업실”로 읽힘; 빈 서재에서 새 책 CTA 명확 |

---

## 3. 이후 순서

1. `/project/workspace` 작업실 섹션화 + 잠금 카피  
2. `/record/*` 공통 헤더·저장 UX  
3. `/book/publish/complete` 등 성공·실패 패널  
4. `/mypage/subscription` Pro 대비 카드 (API 불변)  
5. 온보딩 카피 정렬 (`/project/new` 유지)  
6. 동의 UI (법률 본문 승인 후)

---

## 4. 데이터·기능 보존 체크리스트

- [ ] 프로젝트/기록 CRUD 계약 동일  
- [ ] readiness·cover entitlement·발행 게이트 서버 판정 유지  
- [ ] 기존 deep link·북마크 path 동작  
- [ ] 결제·웹훅·구독 상태 필드 불변  
- [ ] 마이그레이션/Secret/Edge 배포 없음 (Phase 2–4 UI만일 때)

---

## 5. 리스크

| 리스크 | 완화 |
|--------|------|
| 문서·코드 라우트 불일치 | 01 감사표 기준으로 path만 신뢰 |
| 일기 앱으로 회귀 | IA 용어 사전·서재 정의 고정 |
| 레퍼런스 복제 | 패턴만 흡수, asset/레이아웃 복사 금지 |
| 범위 팽창 | Phase 2는 홈+Empty만 |

---

## 6. 검토 게이트

- Phase 1 PR: 전략·IA·DS 합의  
- 디자인 확정: 사용자 승인 후 Phase 2 착수  
- 매 PR: “API/스키마 변경 없음” 체크
