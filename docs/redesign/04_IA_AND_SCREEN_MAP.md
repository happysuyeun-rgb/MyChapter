# 04. 개편 IA 및 화면 맵

> 라우트 path는 **유지**를 기본으로 한다. 변경은 라벨·그룹·Empty·진입점이다.  
> path 근거: `src/router/index.tsx` (01 감사와 동일).

---

## 1. 목표 IA (3탭 + 책 작업실)

```
App
├── Tab: 홈 (/home)              — Desk: 오늘 기록 · 준비도 · PAGE
├── Tab: 서재 (/library)         — 내 책(프로젝트) 선반  (/projects → /library)
├── Tab: 마이 (/mypage)          — 계정 · Pro · 설정 · 법적
│   ├── /mypage/settings
│   ├── /mypage/subscription
│   ├── /mypage/completed-books
│   └── /mypage/delete-account
└── Stack (탭 밖 · path 유지)
    ├── /splash, /login, /login/email
    ├── /onboarding/nickname → /onboarding/notification → /project/new
    ├── /project/new | /setup | /complete | /workspace | /settings
    ├── /record/mode → write/* → /record/complete · /records/:id
    ├── /book/* (chapter · manuscript · cover · review · publish)
    ├── /publication/:id
    └── /notifications
```

**서재 정의 (제품 고정)**  
서재 = **내가 쓰는 책(프로젝트)** 목록. 외부 도서 탐색 스토어가 아니다.

**탭 미포함 path (유지·딥링크)**  
`/records`, `/book` — TabBar에 넣지 않음. 발견성은 홈 Desk·작업실 진입으로 보완 (탭 확장 비권장).

---

## 2. 기존 라우트 ↔ 개편 IA 매핑

| 현행 path | 현행 역할 | 개편 IA 라벨 | 변경 유형 |
|-----------|-----------|--------------|-----------|
| `/home` | 홈 | Desk (작업실 홈) | 레이아웃·위젯 강화 |
| `/library` | 프로젝트 목록 | 서재 | Empty·커버·상태 배지 |
| `/mypage` | 마이 | 마이 | Pro·법적 섹션 정리 |
| `/login` · `/login/email` | 로그인 | 로그인 | 카피·동의 링크 |
| `/onboarding/nickname` | 닉네임 | 온보딩 | “첫 권” 내러티브 |
| `/onboarding/notification` | 알림 | 온보딩 | CTA → `/project/new` 유지 |
| `/project/new` (+setup/complete) | 책 만들기 | 새 책 | 폼 그룹핑 |
| `/project/workspace` | 워크스페이스 | **책 작업실** | 섹션: 기록/원고/표지/발행 |
| `/record/mode` · `write/*` | 기록 | 원고대·기록 | 모드 단축·공통 헤더 |
| `/record/complete` | 기록 완료 | 성공 | 다음 행동 CTA |
| `/book/manuscript` 등 | 제작 단계 | 원고·표지·검토 | 스테퍼 시각만 |
| `/book/publish/complete` | 발행 완료 | 발행 성공 | SuccessPanel |
| `/mypage/subscription` | 구독 | Pro | 대비 카드 (API 불변) |
| `/records`, `/book` | 목록·허브 | (탭 외) | 홈/작업실에서 진입 강화 |

`05_SCREEN_SPEC`에만 있고 라우터에 없거나 탭과 어긋난 항목은 **스펙 부채** (01 §1).

---

## 3. 정보 우선순위 (홈 Desk `/home`)

1. 오늘/이어쓰기 CTA  
2. 활성 책 준비도 (남은 조건)  
3. PAGE 한 줄  
4. 최근 기록 썸네일(선택)  
5. 부차 배너 **1개 이하**

밀리형 “추천 큐레이션 피드”는 **넣지 않음**.

---

## 4. 책 작업실 (`/project/workspace`) 섹션 제안

| 섹션 | 내용 | 잠금 표시 |
|------|------|-----------|
| 기록 | `/record/mode` 진입 · 최근 | 항상 |
| 준비도 | 일수·건수·게이트 | 항상 |
| 원고 | `/book/manuscript` | readiness |
| 표지 | `/book/cover` | entitlement |
| 발행 | review → publish | readiness + 정책 |

스테퍼는 **시각적 진행**만. 서버 readiness/entitlement·`BookStageGuard` 로직은 기존 유지.

---

## 5. 내비게이션

| 요소 | 현행 | 개편 |
|------|------|------|
| TabBar | 홈 / 내 서재 / 마이 | 라벨·아이콘만 Editorial 정렬 |
| 스택 헤더 | 화면별 | “책 맥락 + 단계” 통일 |
| 하단 CTA | 일부 | 기록 저장·다음 단계 primary **1개** |

---

## 6. 용어 사전 (카피 정렬)

| 쓰지 말 것 | 쓸 것 |
|------------|-------|
| 일기장 / 다이어리 앱 | 기록 · 원고 · 내 책 |
| 구독하고 무제한 읽기 | Pro 표지·발행 혜택 (**실제 혜택만**) |
| 서재 = 도서몰 | 서재 = 내가 만드는 책들 |
