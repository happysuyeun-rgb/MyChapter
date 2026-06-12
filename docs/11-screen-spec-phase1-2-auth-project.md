# MyChapter — 화면별 기능명세서 (Phase 1~2: 인증·온보딩·프로젝트)

> **기준 문서:** 화면설계서 v1.1, 착수 프롬프트 v2.0  
> **대응 구현:** `src/pages/splash/`, `auth/`, `onboarding/`, `project/`, `mypage/LegalPage.tsx`  
> **작성일:** 2026-06-12

---

## Phase 1~2 화면 목록

| ID | 화면명 | 경로 | 구현 파일 |
|----|--------|------|-----------|
| S-01 | 스플래시 | `/splash` | `SplashPage.tsx` |
| S-02 | 로그인 | `/login` | `LoginPage.tsx` |
| S-02e | 이메일 Magic Link | `/login/email` | `EmailLoginPage.tsx` |
| S-03 | 닉네임 | `/onboarding/nickname` | `NicknamePage.tsx` |
| S-04 | 알림 권한 | `/onboarding/notification` | `NotificationPage.tsx` |
| S-05 | 프로젝트 유형 | `/project/new` | `ProjectTypePage.tsx` |
| S-06 | 프로젝트 설정 | `/project/new/setup` | `ProjectSetupPage.tsx` |
| S-07 | 기록 방식 | `/project/new/mode` | `ProjectModePage.tsx` |
| S-08 | 생성 완료 | `/project/new/complete` | `ProjectCompletePage.tsx` |
| S-W2 | 개인정보처리방침 | `/mypage/privacy-policy` | `LegalPage.tsx` |
| S-W3 | 이용약관 | `/mypage/terms-of-service` | `LegalPage.tsx` |
| S-P1 | Pro Paywall | (오버레이) | `PaywallModal.tsx` |

**라우트 가드:** `AuthGuard`, `GuestGuard`, `OnboardingGuard` (`guards.tsx`)

---

## S-01 / 스플래시

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| 브랜드 로고 | 📖 + My**Chapter** |
| 태그라인 | 「오늘 한 줄이 언젠가 당신의 한 챕터가 됩니다」 |
| 로딩 인디케이터 | accent bar |
| fade-in 애니메이션 | 300ms opacity |

### 상태값

| Store / State | 필드 |
|---------------|------|
| `authStore` | `initialize()`, `session`, `profile`, `initialized` |
| 로컬 | `ready`, `fadeIn` |

### 사용자 액션 → 결과

| 조건 (1.5초 후) | 다음 화면 |
|-----------------|-----------|
| 세션 없음 | `/login` (S-02) |
| nickname 없음 | `/onboarding/nickname` (S-03) |
| onboarding 미완료 | `/onboarding/notification` (S-04) |
| onboarding 완료 | `/home` (S-09 또는 S-10) |

### API / Edge Function

| API | 시점 |
|-----|------|
| `supabase.auth.getSession()` | `authStore.initialize()` |
| `users` SELECT | 세션 있을 때 profile 로드 |
| `projects` COUNT | onboarding 완료 시 *(현재 분기 미사용)* |

### Free / Pro 제한 분기

- **없음**

### 에러 케이스

| 상황 | 동작 |
|------|------|
| Supabase 미설정 | placeholder URL — 로그인 실패 가능 |
| profile 로드 실패 | nickname null → S-03 |

### 설계(v1.1) 대비

- ⚠️ projects count=0 → S-09 분기 **미구현** (항상 `/home`)

---

## S-02 / 로그인

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| 카카오 버튼 | `#FEE500` OAuth |
| Google 버튼 | border 스타일 OAuth |
| 「이메일로 시작하기」 | `/login/email` 링크 |
| 약관 동의 문구 | S-W3, S-W2 링크 |

### 상태값

- **Zustand 없음** (GuestGuard만 사용)

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 카카오/Google 탭 | `signInWithOAuth` → Supabase Auth redirect |
| 이메일 링크 | S-02e |
| OAuth 성공 redirect | `/home` (웹) 또는 `com.mychapter.app://home` (앱) |

### API / Edge Function

| API | 설명 |
|-----|------|
| `supabase.auth.signInWithOAuth` | provider: `kakao` \| `google` |

**가입 후 자동 처리 (DB trigger 003):**

- `users` INSERT
- `subscriptions` INSERT (`plan: free`)

### Free / Pro 제한 분기

- **없음**

### 에러 케이스

| 상황 | 동작 |
|------|------|
| OAuth 미설정 | Supabase/Kakao/Google 콘솔 설정 필요 |
| redirect mismatch | Redirect URL 불일치 오류 |

---

## S-02e / 이메일 Magic Link

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `NavBar` | 「이메일로 시작하기」, ← |
| `Input` | email |
| 발송 완료 화면 | ✉️ + 수신 안내 |
| `Button` | 「로그인 링크 보내기」 |

### 상태값

| 로컬 | 필드 |
|------|------|
| `email`, `sent`, `loading` | |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 링크 발송 | `signInWithOtp` → sent UI |
| 메일 링크 클릭 | Supabase Auth → `/home` redirect |
| ← | 이전 (S-02) |

### API / Edge Function

```typescript
supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: `${origin}/home` },
})
```

### Free / Pro 제한 분기

- **없음**

### 에러 케이스

| 상황 | 동작 |
|------|------|
| 빈 이메일 | 버튼 disabled |
| OTP 발송 실패 | sent=true로 전환 *(에러 UI 없음)* |

---

## S-03 / 닉네임 (온보딩 1/2)

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `ProgressBar` | 50% |
| `Input` | 닉네임 2~10자 |
| `Button` | 「다음」 |

### 상태값

| Store / State | 필드 |
|---------------|------|
| `authStore` | `user`, `setProfile` |
| 로컬 | `nickname`, `error`, `loading` |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 「다음」 (유효) | `users.nickname` UPDATE → S-04 |
| 유효성 | `/^[a-zA-Z0-9가-힣]{2,10}$/` |

### API / Edge Function

| API | 설명 |
|-----|------|
| `users` UPDATE | nickname |

### Free / Pro 제한 분기

- **없음**

### 에러 케이스

| 상황 | UI |
|------|-----|
| DB UPDATE 실패 | 「닉네임 저장에 실패했어요...」 |
| 형식 불일치 | 버튼 disabled |

---

## S-04 / 알림 권한 (온보딩 2/2)

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `ProgressBar` | 100% |
| 🔔 일러스트 + 설명 | |
| 「알림 허용하기」 | notification_enabled=true |
| 「나중에 설정할게요」 | notification_enabled=false |

### 상태값

| Store | 필드 |
|-------|------|
| `authStore` | `user`, `setProfile` |
| 로컬 | `loading` |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 알림 허용 / 나중에 | `onboarding_completed=true` + notification 설정 |
| 완료 후 | **항상** `/project/new` (S-05) |

### API / Edge Function

| API | 필드 |
|-----|------|
| `users` UPDATE | `notification_enabled`, `onboarding_completed` |

**네이티브 푸시:** Capacitor `PushNotifications` — S-04 이후 홈/설정에서 `notification_enabled` true 시 등록 (`useNativeBridge`)

### Free / Pro 제한 분기

- **없음**

### 에러 케이스

| 상황 | 동작 |
|------|------|
| UPDATE 실패 | navigate는 진행 *(profile 미갱신 가능)* |

### 설계(v1.1) 대비

- ✅ MVP 온보딩 슬라이드 제외, S-03→S-04→S-05 직행

---

## S-W2 / 개인정보처리방침 · S-W3 / 이용약관

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `NavBar` | 제목, ← |
| `iframe` | 외부/정적 HTML 로드 |

### URL

| ID | env | 기본값 |
|----|-----|--------|
| S-W2 | `VITE_PRIVACY_POLICY_URL` | `/legal/privacy.html` |
| S-W3 | `VITE_TERMS_URL` | `/legal/terms.html` |

### 상태값

- **없음** (props: `title`, `url`)

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| ← | 이전 화면 |
| iframe 스크롤 | 약관 본문 읽기 |

### API / Edge Function

- **없음** (정적 페이지)

### Free / Pro 제한 분기

- **없음**

### 에러 케이스

| 상황 | 동작 |
|------|------|
| URL 404 | iframe 빈 화면 |
| S-02에서 GuestGuard 밖 접근 | AuthGuard 필요 — 로그인 페이지 링크는 GuestGuard 내 |

---

## S-05 / 프로젝트 유형 선택

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `NavBar` | 「새 책 프로젝트」 |
| 유형 Card × 5 | emotion, parenting, yearly, career, custom |
| `useProjectLimit` | Free 1개 제한 체크 |

### 상태값

| Store / Hook | 필드 |
|--------------|------|
| `projectStore` | `setDraft({ type, title, periodDays, frequency })` |
| `useProjectLimit` | `canCreate`, `loading`, `isPro`, `projectCount` |
| `paywallStore` | `showPaywall` (limit 시) |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 유형 Card 탭 | draft preset → `/project/new/setup` |
| Free + 프로젝트 1개 | `canCreate=false` → **S-P1** 자동 표시, Card disabled |

**유형별 기본값 (`PROJECT_TYPES`):**

| type | defaultTitle | period | frequency |
|------|--------------|--------|-----------|
| emotion | 감정 일기 | 100일 | week5 |
| parenting | 육아 기록 | 180일 | week5 |
| yearly | 2026년 기록 | 365일 | week3 |
| career | 커리어 성장기 | 100일 | week5 |
| custom | 나만의 책 | 100일 | week5 |

### API / Edge Function

| API | 시점 |
|-----|------|
| `getProjectCount()` | `useProjectLimit` |
| `getSubscriptionPlan()` | `useProjectLimit` |

### Free / Pro 제한 분기

| Free | Pro |
|------|-----|
| 프로젝트 **1개**까지 | 무제한 |
| 2번째 생성 시도 → S-P1 | 정상 진행 |

### 에러 케이스

| 상황 | 동작 |
|------|------|
| loading | 「로딩 중...」 |
| !canCreate | 카드 disabled + Paywall |

---

## S-06 / 프로젝트 설정

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `Input` | 책 제목 |
| `Chip` | 완성 목표 기간 (30/100/180/365일) |
| `Chip` | 기록 주기 (매일/주5/주3/주1) |
| `Chip` | 알림 시간 (07/12/18/21/22시) |
| AI 루틴 예측 Card | 기록 수, 페이지, 완성일 실시간 |

### 상태값

| Store | 필드 |
|-------|------|
| `projectStore` | `draft`, `setDraft` |
| `useMemo` | `calculateRoutine(periodDays, frequency)` |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| Chip/Input 변경 | draft 갱신 + 루틴 Card 재계산 |
| 「다음 — 기록 방식 선택」 | title 비어있지 않으면 S-07 |
| ← | S-05 |
| draft.type 없음 | `/project/new` replace |

### API / Edge Function

- **DB 저장 없음** — draft만 메모리 (Zustand)
- `calculateRoutine()` — `docs/04-business-rules.md` §1

**예시:** 100일 + 주 5회 → 72개 기록, ~86p

### Free / Pro 제한 분기

- **없음** (S-05에서 이미 통과)

### 에러 케이스

| 상황 | 동작 |
|------|------|
| title 빈값 | 「다음」 disabled |
| type 없음 | redirect S-05 |

---

## S-07 / 기록 방식 선택

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `ModeSelectCard` × 4 | question / photo / free / daily |
| 「프로젝트 시작!」 | DB INSERT |

### 상태값

| Store | 필드 |
|-------|------|
| `projectStore` | `draft`, `setCreatedProject`, `setActiveProject` |
| `authStore` | `user` |
| 로컬 | `selected` (RecordMode), `loading`, `error` |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 모드 선택 | `selected` 변경 |
| 「프로젝트 시작!」 | `createProject()` → `projects` INSERT → S-08 |

**record_mode 저장값:**

| UI | DB `record_mode` |
|----|------------------|
| 오늘의 질문 | `question` |
| 사진+캡션 | `photo` |
| 자유 일기 | `free` |
| 매일 선택 | `daily` |

### API / Edge Function

| API | 설명 |
|-----|------|
| `createProject(userId, draft)` | target_count, target_date, frequency 등 계산 후 INSERT |

### Free / Pro 제한 분기

- S-05에서 제한 — S-07 자체 분기 없음

### 에러 케이스

| 상황 | UI |
|------|-----|
| INSERT 실패 | 「프로젝트 생성에 실패했어요...」 |
| loading | 「생성 중...」 |

---

## S-08 / 프로젝트 생성 완료

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| 🎉 축하 | 제목, 목표일, target_count |
| 첫 AI 질문 Card | `generate-question` 결과 |
| 「지금 첫 기록 쓰기」 | S-13 |
| 「홈으로」 | S-10 |

### 상태값

| Store | 필드 |
|-------|------|
| `projectStore` | `createdProject`, `firstQuestion`, `setFirstQuestion`, `resetDraft` |
| `paywallStore` | `showPaywall` |
| 로컬 | `loading` |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| mount | `generateQuestion(createdProject.id)` |
| 「지금 첫 기록 쓰기」 | `resetDraft()` → `/record/write/question` |
| 「홈으로」 | `resetDraft()` → `/home` |
| createdProject 없음 | `/project/new` replace |

### API / Edge Function

| API | 설명 |
|-----|------|
| `generate-question` | 첫 질문 + `daily_questions` 캐시 |
| fallback | 질문 로드 실패 시 하드코딩 fallback 문구 표시 |

### Free / Pro 제한 분기

| Free | Pro |
|------|-----|
| AI 질문 월 10회 | 무제한 |
| `AI_LIMIT` → **S-P1** | 정상 |

### 에러 케이스

| 상황 | 동작 |
|------|------|
| AI_LIMIT | Paywall 표시, fallback 질문 표시 |
| createdProject null | redirect S-05 |
| loading | CTA disabled |

---

## S-P1 / Pro 업그레이드 (Phase 1~2 연동)

> 라우트 없음. `RootLayout` 하위 Modal.

### Phase 1~2 트리거

| 트리거 | 화면 |
|--------|------|
| 프로젝트 2개째 (Free) | S-05 진입 시 `useProjectLimit` |
| AI 질문 한도 | S-08 `generateQuestion` → AI_LIMIT |

### 주요 컴포넌트

- 혜택 목록 (PDF, AI 챕터, 프로젝트 무제한)
- 「월 5,900원 시작」→ `purchasePro()` + `verify-subscription`
- `pendingAction` — 결제 성공 후 실행

### 상태값

| Store | 필드 |
|-------|------|
| `paywallStore` | `isOpen`, `pendingAction`, `completePurchase` |
| `subscriptionStore` | `setPlan` |

---

## Phase 1~2 Guard 흐름

```
GuestGuard:  /login, /login/email  → session 있으면 /home
AuthGuard:   auth 필수 라우트      → session 없으면 /login
OnboardingGuard: AppLayout 탭      → onboarding 미완 → S-03/S-04
```

| Guard | 보호 대상 |
|-------|-----------|
| AuthGuard | S-03~S-08, 홈, 기록, 책, 마이 |
| GuestGuard | S-02, S-02e |
| OnboardingGuard | `/home`, `/records`, `/book`, `/mypage` |

---

## Phase 1~2 Store 요약

| Store | Phase 1~2 역할 |
|-------|----------------|
| `authStore` | session, profile, initialize, signOut |
| `projectStore` | draft, createdProject, firstQuestion, activeProject |
| `paywallStore` | S-05, S-08 Paywall |

---

## Phase 1~2 구현 갭 (v1.1 대비)

| # | 항목 | 설계 | 현재 |
|---|------|------|------|
| 1 | S-01 projects=0 | S-09 Empty | 항상 /home |
| 2 | S-04 네이티브 권한 | OS 알림 권한 다이얼로그 | DB 플래그만 (FCM은 홈 이후) |
| 3 | S-02e OTP 실패 UI | 에러 표시 | sent 전환만 |

---

## 관련 문서

- `docs/01-routing-and-flows.md` — Auth 분기
- `docs/04-business-rules.md` — AI 루틴, Free/Pro
- `docs/10-screen-spec-phase3-home-record.md` — Phase 3
