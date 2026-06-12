# MyChapter — 화면별 기능명세서 (Phase 5: 마이·결제)

> **기준 문서:** 화면설계서 v1.1, 착수 프롬프트 v2.0  
> **대응 구현:** `src/pages/mypage/`, `src/components/features/paywall/`, `src/lib/billing.ts`  
> **작성일:** 2026-06-12

---

## Phase 5 화면 목록

| ID | 화면명 | 경로 | 구현 파일 |
|----|--------|------|-----------|
| S-23 | 마이페이지 | `/mypage` | `MyPage.tsx` |
| S-24 | 설정 | `/mypage/settings` | `SettingsPage.tsx` |
| S-24 (구독) | 구독 관리 | `/mypage/subscription` | `SubscriptionPage.tsx` |
| S-24 (완성책) | 완성한 책 목록 | `/mypage/completed-books` | `CompletedBooksPage.tsx` |
| S-W1 | 계정 삭제 | `/mypage/delete-account` | `DeleteAccountPage.tsx` |
| S-W2 | 개인정보처리방침 | `/mypage/privacy-policy` | `LegalPage.tsx` *(Phase 1~2)* |
| S-W3 | 이용약관 | `/mypage/terms-of-service` | `LegalPage.tsx` *(Phase 1~2)* |
| S-P1 | Pro Paywall | (오버레이) | `PaywallModal.tsx` |

**공통 레이아웃:** S-23은 `AppLayout` + TabBar. S-24·S-W1·완성책·구독·법적 페이지는 전체 화면 (`max-w-phone`).

---

## S-23 / 마이페이지

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `NavBar` | 제목 「마이페이지」, ⚙ → S-24 |
| 프로필 헤더 | 이모지, 닉네임, 이메일, Free/Pro `Badge` |
| 통계 Card × 3 | 기록 / 챕터 / 완성 책 수 |
| Streak 문구 | 연속 기록 N일 (streak > 0일 때만) |
| Pro 업그레이드 Card | Free만 표시 → S-P1 |
| 메뉴 리스트 | 완성한 책, 알림 설정, 구독 관리, 개인정보처리방침 |
| 로그아웃 | `signOut()` |

### 상태값

| Store / Hook | 필드 |
|--------------|------|
| `authStore` | `profile`, `user`, `signOut` |
| `useSubscription` | `isPro`, `plan` |
| `useUserStats` | `stats`, `loading` |
| `paywallStore` | `showPaywall` |

**`useUserStats` 집계:**

- `recordCount` — 사용자 전체 records
- `chapterCount` — 모든 프로젝트 chapters 합
- `bookCount` — `published_books` 존재 프로젝트 수
- `streak` — `calculateStreak(records)` (Asia/Seoul)

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| ⚙ 탭 | `/mypage/settings` (S-24) |
| 「완성한 책 목록」 | `/mypage/completed-books` |
| 「알림 설정」 | `/mypage/settings` *(설정 화면 상단 알림 섹션)* |
| 「구독 관리」 | `/mypage/subscription` |
| 「개인정보 처리방침」 | `/mypage/privacy-policy` (S-W2) |
| Pro Card CTA | S-P1 |
| 로그아웃 | Supabase signOut → GuestGuard → `/login` |

### API / Edge Function

| API | 설명 |
|-----|------|
| `listRecords(userId)` | 기록 수·스트릭 |
| `getProjects(userId)` | 프로젝트 목록 |
| `listChapters(projectId)` | 챕터 수 |
| `getPublishedBook(projectId)` | 완성 책 수 |
| `getSubscriptionPlan` | `useSubscription` 내부 refresh |

### Free / Pro 제한 분기

| UI | Free | Pro |
|----|------|-----|
| Badge | gray 「Free」 | orange 「Pro」 |
| Pro 업그레이드 Card | 표시 | **숨김** |
| 통계·메뉴 | 동일 | 동일 |

### 에러 케이스

| 상황 | 동작 |
|------|------|
| stats loading | 통계 `-` 표시 |
| profile null | 닉네임 「회원」, 이모지 🌿 |

### 설계(v1.1) 대비

- ⚠️ 「알림 설정」이 별도 `/mypage/notification-settings`가 아닌 S-24로 통합
- ⚠️ 이용약관(S-W3)은 S-23 메뉴에 없음 (S-24 앱 정보 섹션에서만)

---

## S-24 / 설정

### 주요 컴포넌트

| 섹션 | 항목 | 동작 |
|------|------|------|
| 알림 | 기록 알림 ON/OFF | `notification_enabled` 토글 |
| 알림 | 알림 시간 | select 07:00~22:00 |
| 계정 | 닉네임 | Modal → 2~10자 저장 |
| 계정 | 프로필 이모지 | Modal → 8종 선택 |
| 구독 | 현재 플랜 | Free/Pro → 구독 관리 이동 |
| 구독 | Pro 업그레이드 | Free만 → S-P1 |
| 앱 정보 | 이용약관 / 개인정보 / 버전 1.0.0 | S-W3, S-W2 |
| 하단 | 로그아웃 / 계정 삭제 | signOut, S-W1 |

**알림 시간 옵션:** `07:00`, `12:00`, `18:00`, `21:00`, `22:00`

**이모지 옵션:** 🌿 📖 ✨ 🌸 🌙 🔥 💫 🍀

### 상태값

| Store / State | 필드 |
|---------------|------|
| `authStore` | `profile`, `user`, `setProfile`, `signOut` |
| `useSubscription` | `isPro` |
| `paywallStore` | `showPaywall` |
| 로컬 | `nicknameOpen`, `emojiOpen`, `nickname`, `saving` |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 기록 알림 탭 | `updateNotificationSettings` → `setProfile` |
| 알림 시간 변경 | `notification_time` → `HH:00:00` 저장 |
| 닉네임 저장 | regex `^[a-zA-Z0-9가-힣]{2,10}$` 통과 시 UPDATE |
| 이모지 선택 | `updateProfileEmoji` → Modal 닫기 |
| 현재 플랜 탭 | `/mypage/subscription` |
| 계정 삭제 | `/mypage/delete-account` (S-W1) |

### API / Edge Function

| API | 설명 |
|-----|------|
| `updateNotificationSettings` | `users.notification_enabled`, `notification_time` |
| `updateNickname` | `users.nickname` |
| `updateProfileEmoji` | `users.profile_emoji` |

**푸시 연동 (Phase 6):**

- `send-daily-reminder` Cron이 `notification_enabled=true` 사용자 대상 FCM 발송
- 알림 시간은 DB 저장만 — Cron 스케줄과 별도 *(단일 Cron 시 전 사용자 동일 시각)*

### Free / Pro 제한 분기

| 기능 | Free | Pro |
|------|------|-----|
| 닉네임·이모지·알림 | ✅ | ✅ |
| Pro 업그레이드 링크 | 표시 | 숨김 |
| 현재 플랜 표시 | 「Free」 | 「Pro」 |

### 에러 케이스

| 상황 | 동작 |
|------|------|
| 닉네임 regex 불일치 | 저장 버튼 무반응 (disabled 아님) |
| UPDATE 실패 | throw — UI 에러 메시지 없음 |

### 설계(v1.1) 대비

- ⚠️ OS 알림 권한 다이얼로그 없음 (DB 플래그만 토글)
- ⚠️ Pro 「구독 관리」 Play Store 딥링크 없음 (구독 화면 안내 문구만)

---

## S-24 / 구독 관리 (`/mypage/subscription`)

### 주요 컴포넌트

| 상태 | UI |
|------|-----|
| Free | 현재 플랜 Card, Pro 혜택 목록, 「월 5,900원으로 시작」 CTA |
| Pro | 현재 플랜 + 다음 갱신일, Play 스토어 구독 관리 안내 Card |

**Pro 혜택 (표시):**

- PDF 출판 무제한
- AI 챕터 무제한
- 프로젝트 무제한
- Pro 전용 표지

### 상태값

| Store / State | 필드 |
|---------------|------|
| `authStore` | `user` |
| `useSubscription` | `isPro` |
| `paywallStore` | `showPaywall` |
| 로컬 | `expiresAt` |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| mount | `getSubscription` → `expires_at` 표시 |
| 「월 5,900원으로 시작」 (Free) | S-P1 |
| Pro 안내 | *(앱 내 버튼 없음 — Play 스토어 수동 이동)* |

### API / Edge Function

| API | 설명 |
|-----|------|
| `getSubscription(userId)` | `plan`, `started_at`, `expires_at` |
| `verify-subscription` | S-P1 결제 성공 시 *(간접)* |

**DB `subscriptions`:**

| 컬럼 | 용도 |
|------|------|
| `plan` | `free` \| `pro` |
| `expires_at` | Pro 갱신일 |
| `play_purchase_token` | Play 검증 토큰 |
| `play_order_id` | 주문 ID |

### Free / Pro 제한 분기

| UI | Free | Pro |
|----|------|-----|
| CTA | S-P1 | 없음 |
| 갱신일 | 숨김 | `expires_at` 표시 |
| Play 안내 | 숨김 | 표시 |

### 에러 케이스

| 상황 | 동작 |
|------|------|
| subscription row 없음 | plan `free` fallback |

### 설계(v1.1) 대비

- ❌ 「구독 복원」 버튼 없음
- ❌ Play Billing Library 네이티브 연동 미완 (`MyChapterBilling` bridge)
- ⚠️ 구독 해지/변경은 Play 스토어 외부 안내만

---

## S-24 / 완성한 책 목록 (`/mypage/completed-books`)

### 주요 컴포넌트

| 조건 | UI |
|------|-----|
| books=0 | `EmptyState variant="book"` |
| books≥1 | Card 리스트 — 표지 썸네일, 제목, 출판일, 페이지, 「보기」 |

### 상태값

| Store / State | 필드 |
|---------------|------|
| `authStore` | `user` |
| 로컬 | `books[]`, `loading` |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| mount | `listPublishedBooks(userId)` |
| 「보기」 | `/book` *(활성 프로젝트 탭 — 특정 책 상세 아님)* |

### API / Edge Function

| API | 설명 |
|-----|------|
| `listPublishedBooks` | `published_books` + `projects.title` JOIN |
| `COVER_TEMPLATES` | 표지 썸네일 스타일 |

### Free / Pro 제한 분기

- **없음** — 이미 출판된 책 목록 조회 (과거 Pro 출판분 포함)

### 에러 케이스

| 상황 | 동작 |
|------|------|
| loading | 「로딩 중...」 |
| empty | EmptyState |

### 설계(v1.1) 대비

- ⚠️ 「보기」가 PDF/HTML 다운로드·미리보기가 아닌 `/book` 이동
- ⚠️ 프로젝트별 필터·상세 화면 없음

---

## S-W1 / 계정 삭제

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| 경고 헤더 | ⚠️ 「정말 떠나시려고 하나요?」 |
| 삭제 데이터 Card | 기록·완성 책 영구 삭제, 구독 자동 해지 |
| 「계정 삭제」 | 확인 Modal 오픈 |
| 확인 Modal | 「계정 삭제」 텍스트 입력 → 「영구 삭제」 |
| 「취소」 | `navigate(-1)` |

### 상태값

| Store / State | 필드 |
|---------------|------|
| `authStore` | `signOut` |
| `subscriptionStore` | `reset` |
| 로컬 | `confirmOpen`, `confirmText`, `deleting`, `error` |

### 사용자 액션 → 결과

| 액션 | 결과 |
|------|------|
| 「계정 삭제」 | Modal 오픈 |
| confirmText = 「계정 삭제」 | 「영구 삭제」 활성 |
| 「영구 삭제」 | `deleteAccount()` → `resetSubscription()` → `signOut()` → `/login` |

### API / Edge Function

| API | 설명 |
|-----|------|
| `delete-account` Edge | Storage 사진 삭제 → `auth.admin.deleteUser` |

**Edge Function 처리 순서:**

1. `records.photo_url` 수집 → `record-photos` Storage remove
2. `auth.admin.deleteUser(user.id)` — CASCADE로 users·projects·records 등 삭제

### Free / Pro 제한 분기

- **없음** — Pro 구독 중이어도 동일 플로우 *(Play 구독 해지는 사용자 Play 스토어에서 별도)*

### 에러 케이스

| 상황 | 동작 |
|------|------|
| Edge 실패 | 「계정 삭제에 실패했어요...」 Modal 내 표시 |
| deleting | 버튼 「삭제 중...」, disabled |

### 설계(v1.1) 대비

| 설계 | 현재 |
|------|------|
| 탈퇴 전 PDF 일괄 다운로드 (선택) | ❌ 미구현 |
| 2차 확인 | ✅ 텍스트 입력 확인 |

---

## S-W2 / S-W3 (Phase 5 진입점)

> 상세 명세: `docs/11-screen-spec-phase1-2-auth-project.md`

| 진입 | 화면 |
|------|------|
| S-23 메뉴 | S-W2 개인정보처리방침 |
| S-24 앱 정보 | S-W2, S-W3 |

`LegalPage` — iframe으로 `VITE_PRIVACY_POLICY_URL` / `VITE_TERMS_URL` (fallback: `/legal/*.html`)

---

## S-P1 / Pro Paywall (Phase 5 연동)

> 라우트 없음. `RootLayout` → `PaywallModal` (z-index 60, bottom sheet)

### Phase 5 트리거

| 트리거 | 화면 | pendingAction |
|--------|------|---------------|
| Pro 업그레이드 Card | S-23 | ❌ 없음 |
| Pro 업그레이드 링크 | S-24 | ❌ 없음 |
| 「월 5,900원으로 시작」 | 구독 관리 | ❌ 없음 |
| billing 불가 (웹 prod) | S-P1 | 에러 「모바일 앱에서 결제해주세요.」 |

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| Bottom sheet | dimmed overlay + rounded-t-3xl |
| 혜택 목록 | PDF 출판, AI 챕터, 프로젝트 무제한 |
| CTA | 「월 5,900원 시작」 |
| 「나중에 하기」 | `closePaywall` |

### 상태값

| Store | 필드 |
|-------|------|
| `paywallStore` | `isOpen`, `pendingAction`, `showPaywall`, `closePaywall`, `completePurchase` |
| `subscriptionStore` | `setPlan` |
| `authStore` | `user` |
| 로컬 | `loading`, `error` |

### 결제 플로우

```
1. isBillingAvailable() 체크
   ├── Native: window.MyChapterBilling 존재
   └── Web: DEV 또는 VITE_BILLING_DEV_MODE=true

2. purchasePro()
   ├── Native: MyChapterBilling.purchase('mychapter_pro_monthly')
   └── Dev: dev_{uuid} 토큰 생성

3. verifyPurchase(token, productId, orderId)
   └── Edge verify-subscription
       ├── dev_ + BILLING_DEV_BYPASS → subscriptions UPDATE pro
       └── Google Play API 검증 → subscriptions UPDATE pro

4. setPlan('pro') → completePurchase() → pendingAction?.()
```

**상품 정보 (`constants/billing.ts`):**

| 항목 | 값 |
|------|-----|
| `PRO_PRODUCT_ID` | `mychapter_pro_monthly` |
| `PRO_PRICE_LABEL` | `월 5,900원` |

### API / Edge Function

| API | 설명 |
|-----|------|
| `purchasePro()` | `lib/billing.ts` |
| `verify-subscription` | Play 검증 + DB UPDATE |
| `verifyPurchase()` | 클라이언트 invoke 래퍼 |

**Edge 환경 변수:**

| 변수 | 용도 |
|------|------|
| `BILLING_DEV_BYPASS` | dev_ 토큰 허용 |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Play API |
| `GOOGLE_PLAY_PACKAGE_NAME` | 기본 `com.mychapter.app` |

### Free / Pro 제한 분기

- Paywall 자체는 Free 사용자 대상
- Pro 사용자는 S-23 Card·S-24 업그레이드 링크 숨김

### 에러 케이스

| 코드/상황 | 메시지 |
|-----------|--------|
| `WEB_UNAVAILABLE` / billing 불가 | 「모바일 앱에서 결제해주세요.」 |
| `NATIVE_UNAVAILABLE` | 「결제 모듈을 불러올 수 없어요...」 |
| `VERIFY_FAILED` / Edge error | 「결제 검증에 실패했어요.」 |
| `Dev billing not enabled` | Edge 403 |
| `Billing not configured` | Edge 503 |
| loading | 「결제 처리 중...」 |

### pendingAction (전 Phase)

Phase 5 진입점은 **pendingAction 미전달**.  
Phase 1~4에서도 대부분 `showPaywall()` 단독 호출 — 결제 후 사용자가 수동 재시도 필요.

설계(`docs/04-business-rules.md` §10) 예시:

- Pro 전환 후 PDF 출판 재시도
- Pro 전환 후 챕터 생성 재시도
- Pro 전환 후 프로젝트 생성 재시도

---

## Phase 5 Free / Pro 요약

| 기능 | Free | Pro |
|------|------|-----|
| 마이페이지·설정 | ✅ | ✅ |
| 알림 설정 | ✅ | ✅ |
| 완성 책 목록 조회 | ✅ | ✅ |
| Pro 업그레이드 UI | Card·링크 표시 | 숨김 |
| PDF 출판 | S-P1 *(Phase 4)* | ✅ |
| 챕터 4개+ | S-P1 *(Phase 4)* | ✅ |
| 프로젝트 2개+ | S-P1 *(Phase 1~2)* | ✅ |
| AI 질문 월 10회 | S-P1 *(Phase 1~2)* | ✅ |

---

## Phase 5 데이터 흐름

```
가입 (Phase 1)
    └── trigger 003 → subscriptions INSERT (plan: free)

S-P1 결제
    └── verify-subscription → subscriptions UPDATE (pro)
            └── subscriptionStore.setPlan('pro')
                    └── useSubscription.isPro = true

S-24 알림 설정
    └── users UPDATE → send-daily-reminder Cron (Phase 6)

S-20 출판 (Phase 4)
    └── published_books INSERT
            └── S-23 stats.bookCount, 완성책 목록

S-W1 탈퇴
    └── delete-account → Storage + auth.admin.deleteUser
            └── signOut → /login
```

---

## Phase 5 Store 요약

| Store | Phase 5 역할 |
|-------|--------------|
| `authStore` | profile, user, setProfile, signOut |
| `subscriptionStore` | plan, refreshPlan, setPlan, reset |
| `paywallStore` | S-23/24/구독 Paywall, pendingAction |
| `useSubscription` | isPro hook (마이·설정·구독) |
| `useUserStats` | S-23 통계·스트릭 |

---

## Phase 5 구현 갭 (v1.1 대비)

| # | 항목 | 설계 | 현재 |
|---|------|------|------|
| 1 | Play Billing 네이티브 | Billing Library + bridge | dev 토큰 / bridge 스텁 |
| 2 | pendingAction | 결제 후 자동 재시도 | Phase 5 포함 대부분 미전달 |
| 3 | 구독 복원 | Restore purchases | ❌ |
| 4 | Play 구독 관리 | 딥링크 또는 in-app | 안내 문구만 |
| 5 | S-24 OS 알림 권한 | 토글 시 권한 요청 | DB 플래그만 |
| 6 | 완성책 「보기」 | PDF/HTML 보기 | `/book` 이동 |
| 7 | S-W1 탈퇴 전 PDF | 선택적 일괄 다운로드 | ❌ |
| 8 | 웹 결제 | MVP 제외 | prod 웹에서 Paywall 차단 |
| 9 | Pro 만료 처리 | expires_at 기반 강등 | 클라이언트 plan 캐시만 *(서버 Cron 강등 없음)* |
| 10 | S-23 이용약관 | 메뉴 노출 | S-24에서만 |

---

## 관련 문서

- `docs/04-business-rules.md` — §9 탈퇴, §10 Paywall pendingAction
- `docs/03-edge-functions-api.md` — verify-subscription, delete-account
- `docs/06-user-tasks.md` — Play Console, Billing 환경 변수
- `docs/11-screen-spec-phase1-2-auth-project.md` — S-W2/W3, S-P1 Phase 1~2
- `docs/12-screen-spec-phase4-book.md` — S-P1 Phase 4 (출판·챕터)
- `docs/07-dev-progress.md` — Phase 5 현황
