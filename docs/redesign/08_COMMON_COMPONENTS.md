# 08. 공통 컴포넌트 체계 · 변경안

> **기능 요구·화면 명세(`05_SCREEN_SPEC`) 유지.**  
> 컴포넌트는 시각·카피·재사용만 정리한다. 결제·readiness·발행 판정 로직은 페이지/가드에 남긴다.

---

## 1. 현행 인벤토리 (`src/components/common`)

| 컴포넌트 | 상태 | Editorial Desk 역할 | 변경 방향 |
|----------|------|---------------------|-----------|
| `Button` | 사용 중 | Primary=Ink CTA | 유지 · 화면당 1 primary |
| `EmptyState` | 사용 중 | H-01 / 서재·기록 Empty | `library` variant 추가 · CTA 명세 정렬 |
| `ErrorState` | 사용 중 | 재시도 1개 | hairline 톤으로 정렬 (원형 배지 완화) |
| `LoadingBlock` | 사용 중 | 로딩 | 유지 |
| `ProgressBar` | 사용 중 | 준비도 트랙 | Desk에서는 sage fill |
| `FlatIcon` | 사용 중 | 기능 아이콘 | 이모지/◇ 대체 |
| `Card` | 제한 사용 | 의미 있는 면만 | 신규 Desk 화면에 기본 금지 |
| `Chip` / `Badge` | 사용 중 | 필터·상태 | 과다 칩 금지 |
| `PageShell` | 레거시 셸 | 플레이스홀더 | 신규 화면 비사용 |
| `Modal` / `BottomSheet` / `Toast` / `Input` / `Textarea` | 유지 | 운영 UI | API 불변 |

레이아웃: `TabBar` · `AppLayout` · `NavBar` — path 유지, 라벨·활성 톤만.

---

## 2. 신규 · 강화 컴포넌트

| 이름 | Phase | Props 요지 | 용도 | 비침투 |
|------|-------|------------|------|--------|
| `DeskProgress` | 2 | `score`, `message`, `recordCount`, `isReady`, `compact?` | 홈·서재 준비도 요약 | readiness **계산은 호출측** |
| `EmptyState` (+`library`) | 2 | `variant` | 서재 빈 선반 | 라우트만 `/project/new` |
| `StudioSection` | **3 적용** | `title`, `eyebrow`, `locked?`, `lockReason?`, `children` | `/project/workspace` | 잠금 bool은 호출측 |
| `SuccessPanel` | **3 적용** | `leading?`, `title`, `description`, `primary`, `secondary?`, `tertiary?` | 기록/발행/새책 완료 | |
| `StepperVisual` | **3 적용** | `steps[]` (ready/lockReason/onSelect) | 제작 단계 표시 | `BookStageGuard` 대체 금지 |
| `PaywallCompare` | 4 | Free/Pro rows | 구독 UI | 결제 API 불변 |
| `ConsentRow` | 4 | label, checked, required | 가입 동의 | 약관 본문 승인 후 |

---

## 3. EmptyState variant 계약

| variant | 명세 | CTA | to |
|---------|------|-----|-----|
| `home` | H-01 | 첫 번째 책 만들기 | `/project/new` |
| `library` | L-01 empty | 첫 번째 책 만들기 | `/project/new` |
| `records` | 기록 목록 empty | 첫 페이지 쓰기 | `/record/mode` |
| `book` | 완성 책 없음 | 홈으로 돌아가기 | `/home` |

---

## 4. 홈 Desk 구성 (명세 매핑)

| 명세 | 블록 | 컴포넌트 |
|------|------|----------|
| H-02 | CURRENT BOOK + 준비도 + 오늘 CTA | 커버 미니 + `DeskProgress` + primary button |
| H-03 | Ready | **primary = 책 작업실 열기**, secondary = 계속 기록 |
| H-04 | Published | primary = 발행본 보기, secondary = 작업실 |
| PAGE note | PAGE'S NOTE | 카피만 · FlatIcon |
| 메타 | 기록 수 · 책 상태 | hairline 리스트 |

---

## 5. TabBar

| 항목 | 현행 | 목표 |
|------|------|------|
| 라벨 | 홈 / 내 서재 / 마이 | 홈 / **서재** / 마이 |
| path | `/home` `/library` `/mypage` | **불변** |
| 활성 | border-ink | 유지 + 아이콘 stroke 명확 |

---

## 6. 사용 규칙 (체크리스트)

- [ ] `bg-surface` 페이지 셸  
- [ ] serif Display 화면당 1  
- [ ] primary CTA 1 (Ink `Button` 또는 ink 면 위 surface 텍스트 CTA)  
- [ ] Empty/Error/Loading 공통 컴포넌트  
- [ ] 용어: 책 / 기록 / 작업실 / 발행 (일기장·다이어리 금지)  
- [ ] Card-in-card 금지  
- [ ] 내비·기능에 이모지 금지 → `FlatIcon`

---

## 7. 마이그레이션

1. Phase 2: `EmptyState` · `DeskProgress` · `TabBar` · Home/Library 적용  
2. Phase 3: workspace · record · SuccessPanel  
3. 기존 `Card` 남용 화면은 화면 단위 PR로 hairline 치환
