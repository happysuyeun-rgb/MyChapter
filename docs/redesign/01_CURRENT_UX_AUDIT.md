# 01. 현행 UX 진단 보고서

> **Phase:** Redesign Phase 1 (분석 전용)  
> **기준:** GitHub `main` @ `cf030a2` · 코드 `src/router`, `src/pages`, `src/components`, `tailwind.config.js`  
> **문서 기준:** `05_SCREEN_SPEC.md`, `02_PRODUCT_DECISIONS.md`, `10_DESIGN_SYSTEM.md`, `04_USER_FLOWS.md`(2026-10-25 정합)  
> **범위:** 코드 수정 없음

---

## 1. 문서 vs 코드 불일치

| 주제 | 문서 | 코드 실측 | 판정 |
|------|------|-----------|------|
| 신규 온보딩 후 경로 | `04_USER_FLOWS` (갱신됨): `/project/new` | `NotificationPage` → `/project/new` | **일치** |
| 하단 탭 | 스펙상 Home·Library·Records·Book·My 등 다중 가능 | `TabBar`: **홈 / 내 서재 / 마이** 3탭만 | **문서 과다 · 코드 축소** |
| Records·Book 탭 | `05`에 Records/Book Making 상세 | `/records`, `/book`은 라우트 있으나 **TabBar 미포함** (딥링크·가드) | **접근성 약함** |
| 디자인 방향 | Paper×Editorial (`10_DESIGN_SYSTEM`) | Tailwind: ink/surface/sage/terracotta · serif/sans | **대체로 일치** |
| 약관 동의 | `28` 설계: 명시 동의 필요 | 로그인 암시 문구만 | **미구현 (알려진 갭)** |
| 카드 UI | 스펙: hairline·editorial list 선호 | 화면마다 Card/리스트 혼재 | **부분 이탈** |

---

## 2. 정보구조 (실측)

### 2.1 공개
- `/splash` → 세션 분기
- `/login`, `/login/email`
- `/mypage/privacy-policy`, `/mypage/terms-of-service` (인증 전 열람)

### 2.2 온보딩 (Auth)
- `/onboarding/nickname` → `/onboarding/notification` → **`/project/new`**

### 2.3 앱 셸 (`AppLayout` + `TabBar`)
- `/home` — 진행 책·준비도·오늘 CTA
- `/library` — 프로젝트 목록 (`/projects` → redirect)
- `/mypage` — 설정·구독·완료 책 진입점

### 2.4 셸 밖 (풀스크린 플로우)
- 기록: mode → write(question/photo/free) → complete → detail/edit
- 책 제작: workspace · BookStageGuard(chapter/manuscript/cover/review) · publish
- 프로젝트: new/setup/complete · settings · workspace
- 설정·구독·탈퇴·알림 목록

---

## 3. 화면군 진단 요약

| 영역 | 주요 파일 | 강점 | 개선 필요 |
|------|-----------|------|-----------|
| Splash/Login | `SplashPage`, `LoginPage`, `EmailLoginPage` | 브랜드 카피·Magic Link LIVE | 명시 동의·OAuth 운영 설정 |
| Onboarding | Nickname/Notification | 스킵 가능·직행 첫 책 | UX 라이팅·진행 표시 약함 |
| Home | `HomePage` | readiness·Empty/Error/Loading 공통 | 정보 밀도·서재/기록 발견성 |
| Library | `ProjectsListPage` | 책 단위 목록 | 커버 그리드·상태 배지 일관성 |
| Record | `record/*` | 3모드 분리·PAGE 개념 | 작성기 immersion·모드 선택 마찰 |
| Book making | `book/*`, workspace | 단계 가드(`BookStageGuard`) | 다단계 진행 UI·미리보기 톤 |
| My/Paywall | Subscription/Settings | 기능 존재 | Paywall 설득력·요금 비교 UI |
| Global | `EmptyState`, `ErrorState`, `LoadingBlock`, `TabBar` | 공통 상태 컴포넌트 | 빈 화면·성공 모먼트 브랜드 강화 |

---

## 4. 핵심 사용자 여정 마찰

1. **가입 → 첫 책:** 제품상 올바름(`/project/new`)이나, 홈 Empty와 첫 책 플로우의 톤·카피가 분리되어 있음.  
2. **일일 기록:** 홈 CTA → mode → write — 단계가 길어 “오늘 한 장” 습관에 마찰.  
3. **책 제작:** readiness 잠금은 제품 핵심이나, 잠금 이유·다음 행동의 시각적 설명이 약함.  
4. **탭 IA:** 기록·원고가 탭에 없어 “어디에 쓰지?” 학습 비용.  
5. **브랜드:** Editorial 의도와 일부 wellness/일기 앱 톤이 혼재할 여지 (일기 앱 레퍼런스와 차별 필요).

---

## 5. 디자인 토큰 실측 (`tailwind.config.js`)

- Ink `#3B352D`, Surface `#F7F2E8`, Sage `#7C8D78`, Terracotta `#C87959`
- Font: Noto Sans KR / Noto Serif KR
- `max-w-phone: 430px`, `radius` btn 14 / card 18, shadow `paper`
- **유지 권고:** 리뉴얼은 토큰 확장·컴포넌트 정합에 집중 (브랜드 색 전면 교체 비권장)

---

## 6. 진단 결론

현행 MY CHAPTER는 **기능·가드·데이터 모델이 앞서 있고, 시각·IA 일관성·발견성이 뒤처진 상태**다.  
리뉴얼 Phase 1의 과제는 API/스키마 변경이 아니라 **“책 만드는 작업실” 언어로 홈·탭·기록·제작 단계를 재정렬**하는 것이다.
