# MyChapter — 개발명세서

> **문서 버전:** 1.0  
> **작성일:** 2026-06-12  
> **서비스:** MyChapter — 일상 기록을 AI가 분석해 전자책으로 완성하는 Android 앱  
> **MVP 상태:** 코드 구현 Phase 0~6 완료, 인프라 연동·스토어 출시 대기

---

## 1. 서비스 개요

### 1.1 한 줄 설명

사용자가 매일 짧은 기록을 남기면, AI가 10개 단위로 챕터를 구성하고 Pro 사용자는 PDF(현재 HTML)로 책을 출판할 수 있는 서비스.

### 1.2 타깃 사용자

- 일기·육아·감정·커리어 등 주제별로 "한 권의 책"을 만들고 싶은 일반 사용자
- 매일 2~5분 기록 루틴을 원하는 사용자

### 1.3 핵심 가치

| 가치 | 설명 |
|------|------|
| 낮은 진입 장벽 | AI 질문으로 기록 시작 |
| 자동 챕터화 | 기록 10개 → AI 에세이 챕터 |
| 완성감 | 표지 선택 + 출판 |

---

## 2. 기술 스택

| 계층 | 기술 |
|------|------|
| 프론트엔드 | React 19, TypeScript, Vite 6 |
| 스타일 | Tailwind CSS 3 |
| 상태 관리 | Zustand 5 |
| 라우팅 | React Router 7 |
| 백엔드 | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| AI | Anthropic Claude (Edge Function 경유) |
| Android | Capacitor 7 (WebView) |
| 웹 배포 | Vercel (SPA) |
| 푸시 | Firebase Cloud Messaging + Capacitor Push Notifications |
| 결제 | Google Play Billing (verify-subscription Edge Function) |

---

## 3. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│  Client (Web / Android Capacitor)                       │
│  React SPA ──► Supabase JS Client (anon key)            │
└──────────────────────────┬──────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   Supabase Auth    PostgreSQL + RLS    Storage
         │                 │            record-photos
         │                 │
         ▼                 ▼
   Edge Functions ◄── service_role
   ├── generate-question      (Claude)
   ├── generate-freewriting-hint
   ├── generate-chapter
   ├── regenerate-chapter
   ├── verify-subscription    (Play API)
   ├── delete-account
   └── send-daily-reminder    (FCM + Cron)
```

### 3.1 설계 원칙

- AI API Key는 **서버(Edge Function)에만** 존재
- 클라이언트는 **anon key + RLS** 로 본인 데이터만 접근
- Android는 Capacitor WebView; 웹과 **동일 코드베이스**

---

## 4. 저장소 구조

```
MyChapter/
├── docs/                    설계·운영 문서
├── public/legal/            약관 HTML
├── src/
│   ├── components/          common, layout, features
│   ├── pages/               화면별 페이지
│   ├── stores/              Zustand
│   ├── lib/api/             Supabase API 래퍼
│   ├── hooks/
│   ├── utils/
│   ├── constants/
│   └── types/database.ts
├── supabase/
│   ├── migrations/          001~005 SQL
│   └── functions/           Edge Functions
├── android/                 Capacitor Android
├── store/                   Play 스토어 문구
├── capacitor.config.ts
├── vercel.json
└── package.json
```

---

## 5. 화면 명세 (Screen ID)

### 5.1 공개·인증

| ID | 경로 | 화면명 | 구현 |
|----|------|--------|------|
| S-01 | `/splash` | 스플래시 | ✅ |
| S-02 | `/login` | 소셜 로그인 | ✅ |
| S-02e | `/login/email` | 이메일 Magic Link | ✅ |

### 5.2 온보딩

| ID | 경로 | 화면명 | 구현 |
|----|------|--------|------|
| S-03 | `/onboarding/nickname` | 닉네임 | ✅ |
| S-04 | `/onboarding/notification` | 알림 권한 | ✅ |

### 5.3 프로젝트

| ID | 경로 | 화면명 | 구현 |
|----|------|--------|------|
| S-05 | `/project/new` | 유형 선택 | ✅ |
| S-06 | `/project/new/setup` | 제목·기간 | ✅ |
| S-07 | `/project/new/mode` | 기록 모드 | ✅ |
| S-08 | `/project/new/complete` | 생성 완료 | ✅ |

### 5.4 메인 탭

| ID | 경로 | 화면명 | 구현 |
|----|------|--------|------|
| S-09/10 | `/home` | 홈 / Empty | ✅ |
| S-11 | `/notifications` | 알림 목록 | ✅ |
| S-10b | `/projects` | 프로젝트 목록 (Pro) | ❌ |
| S-30 | `/records` | 기록 목록 | ✅ |
| S-17 | `/book` | 내 책 | ✅ |
| S-23 | `/mypage` | 마이페이지 | ✅ |

### 5.5 기록

| ID | 경로 | 화면명 | 구현 |
|----|------|--------|------|
| S-12 | `/record/mode` | 모드 선택 | ✅ |
| S-13 | `/record/write/question` | 질문 모드 | ✅ |
| S-14 | `/record/write/photo` | 사진 모드 | ✅ |
| S-15 | `/record/write/free` | 자유 일기 | ✅ |
| S-16 | `/record/complete` | 저장 완료 | ✅ |
| S-31 | `/records/:id` | 기록 상세 | ✅ |
| S-32 | — | 액션 시트 | ✅ (챕터 이동 ❌) |

### 5.6 책

| ID | 경로 | 화면명 | 구현 |
|----|------|--------|------|
| S-18 | `/book/chapter/:id` | 원고 미리보기 | ✅ |
| S-19 | `/book/chapter/:id/edit` | 원고 편집 | ✅ |
| S-20 | `/book/cover` | 표지 선택 | ✅ |
| S-21 | `/book/publish/complete` | 출판 완료 | ✅ |

### 5.7 마이·설정·법적

| ID | 경로 | 화면명 | 구현 |
|----|------|--------|------|
| S-24 | `/mypage/settings` | 설정 | ✅ |
| — | `/mypage/subscription` | 구독 관리 | ✅ |
| — | `/mypage/completed-books` | 완성한 책 | ✅ |
| S-W1 | `/mypage/delete-account` | 계정 삭제 | ✅ |
| S-W2 | `/mypage/privacy-policy` | 개인정보 WebView | ✅ |
| S-W3 | `/mypage/terms-of-service` | 이용약관 WebView | ✅ |
| S-P1 | Modal | Pro Paywall | ✅ |

---

## 6. 데이터베이스

> 상세 DDL: `docs/02-database-schema.md`  
> 마이그레이션: `supabase/migrations/001~004.sql`

### 6.1 ER 요약

```
auth.users ──1:1── users ──1:1── subscriptions
                ├──1:N── projects ──1:N── records
                │              └──1:N── chapters
                ├──1:N── notifications
                ├──1:N── device_tokens
                ├──1:N── ai_usage
                └──1:N── published_books
```

### 6.2 핵심 테이블

| 테이블 | 용도 |
|--------|------|
| `users` | 프로필, 알림 설정, 온보딩 플래그 |
| `projects` | 책 프로젝트 (유형, 목표 기록 수, 모드) |
| `records` | 일기 기록 (question/photo/free) |
| `chapters` | AI 원고 (`ai_content`, `user_content`) |
| `subscriptions` | free / pro |
| `published_books` | 출판 이력 |
| `daily_questions` | 오늘의 질문 캐시 |
| `notifications` | 인앱 알림 |
| `device_tokens` | FCM 토큰 |
| `ai_usage` | AI 사용량 (Free 월 10회 등) |

### 6.3 RLS

- 모든 테이블: `auth.uid() = user_id` (또는 users.id)
- Edge Function은 `service_role`로 제한 로직 처리

---

## 7. API · Edge Functions

> 상세: `docs/03-edge-functions-api.md`

| Function | Method | 입력 | 출력/동작 |
|----------|--------|------|-----------|
| `generate-question` | POST | `project_id` | 오늘의 질문 1개 |
| `generate-freewriting-hint` | POST | `project_id` | 자유 일기 힌트 |
| `generate-chapter` | POST | `project_id` | 미할당 기록 10개 → 챕터 |
| `regenerate-chapter` | POST | `chapter_id` | AI 재생성 |
| `verify-subscription` | POST | `purchase_token`, `product_id` | plan=pro |
| `delete-account` | POST | `confirm: true` | 사용자 삭제 |
| `send-daily-reminder` | POST | Cron | FCM + notifications |

### 7.1 클라이언트 API 모듈

| 파일 | 기능 |
|------|------|
| `projects.ts` | CRUD, 개수 |
| `records.ts` | CRUD, Storage, 챕터 트리거 |
| `chapters.ts` | 목록, 편집, 생성/재생성 |
| `questions.ts` | 오늘의 질문 |
| `books.ts` | 출판, HTML export |
| `subscriptions.ts` | 플랜, 결제 검증 |
| `notifications.ts` | 목록, 읽음 |
| `users.ts` | 프로필, 알림 설정 |
| `account.ts` | 탈퇴 |
| `deviceTokens.ts` | FCM 토큰 |

---

## 8. 비즈니스 규칙

> 상세: `docs/04-business-rules.md`

### 8.1 Free / Pro

| 기능 | Free | Pro |
|------|------|-----|
| 프로젝트 | 1개 | 무제한 |
| AI 질문 | 월 10회 | 무제한 |
| 챕터 | 3개/프로젝트 | 무제한 |
| PDF 출판 | 불가 | 가능 |
| 표지 | 2종 | 4종 |

### 8.2 챕터 생성

- `chapter_id IS NULL` + `is_draft=false` 기록 **10개** → `generate-chapter`
- Free: 완성 챕터 3개 초과 시 `CHAPTER_LIMIT` → Paywall

### 8.3 기록 유효성

| 모드 | 규칙 |
|------|------|
| question | content 10~2000자 |
| photo | 사진 필수, 캡션 1~100자 |
| free | content 10~5000자 |

### 8.4 Paywall 트리거 (S-P1)

1. PDF/출판 시도 (Free)
2. 프로젝트 2개째 생성
3. AI 질문 월 한도 초과
4. 챕터 4번째 생성 시도

---

## 9. 상태 관리 (Zustand)

| Store | 역할 |
|-------|------|
| `authStore` | session, user, profile |
| `projectStore` | activeProject, 생성 draft |
| `recordStore` | 편집 중 기록, draft |
| `bookStore` | 표지 선택, 출판 결과 |
| `paywallStore` | 모달, pendingAction |
| `subscriptionStore` | plan (free/pro) |

---

## 10. Android · 네이티브

| 항목 | 값 |
|------|-----|
| appId | `com.mychapter.app` |
| webDir | `dist` |
| 딥링크 | `com.mychapter.app://`, `https://mychapter.app` |
| 권한 | INTERNET, CAMERA, POST_NOTIFICATIONS, READ_MEDIA_IMAGES |

### 10.1 npm 스크립트

```bash
npm run cap:sync      # build + sync
npm run cap:android   # Android Studio 열기
npm run cap:run:android
```

### 10.2 Play Billing

- Product ID: `mychapter_pro_monthly`
- 네이티브: `window.MyChapterBilling.purchase(productId)` *(미구현, dev 모드 사용)*

---

## 11. 환경 변수

### 11.1 클라이언트 (`.env.local` / Vercel)

| 변수 | 필수 | 설명 |
|------|------|------|
| `VITE_SUPABASE_URL` | ✅ | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | anon public key |
| `VITE_PRIVACY_POLICY_URL` | ✅ | 개인정보 URL |
| `VITE_TERMS_URL` | ✅ | 이용약관 URL |
| `VITE_BILLING_DEV_MODE` | 개발 | `true` 시 모의 결제 |
| `VITE_APP_URL` | 권장 | `https://mychapter.app` |

### 11.2 Edge Function Secrets

| Secret | 용도 |
|--------|------|
| `ANTHROPIC_API_KEY` | Claude |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin DB |
| `BILLING_DEV_BYPASS` | 테스트 결제 |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Play 검증 |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | FCM |
| `FIREBASE_PROJECT_ID` | FCM |
| `CRON_SECRET` | Cron 인증 |

---

## 12. 배포

| 대상 | 방법 | 문서 |
|------|------|------|
| DB | SQL 마이그레이션 | `09-supabase-setup.md` |
| Edge Functions | `supabase functions deploy` | `09-supabase-setup.md` |
| Web | Vercel + `vercel.json` | `06-user-tasks.md` |
| Android | Capacitor + Play Console | `06-user-tasks.md` |

---

## 13. MVP 대비 갭 (미구현)

| 항목 | 현재 | 목표 |
|------|------|------|
| PDF | HTML 다운로드 | `generate-pdf` 서버 PDF |
| Play Billing | dev 토큰 | 네이티브 플러그인 |
| S-10b | placeholder | Pro 프로젝트 목록 |
| 챕터 드래그/기록 이동 | 없음 | S-17, S-32 |
| expand-caption | 없음 | 사진 AI 캡션 |

---

## 14. 문서 인덱스

| 번호 | 파일 | 내용 |
|------|------|------|
| 00 | `00-design-decisions.md` | 아키텍처 결정 |
| 01 | `01-routing-and-flows.md` | 라우팅·플로우 |
| 02 | `02-database-schema.md` | DB 상세 |
| 03 | `03-edge-functions-api.md` | API 상세 |
| 04 | `04-business-rules.md` | 비즈니스 규칙 |
| 05 | `05-implementation-plan.md` | Phase별 계획 |
| **06** | **`06-user-tasks.md`** | **본인이 할 일** |
| **07** | **`07-dev-progress.md`** | **AI 구현 현황** |
| **08** | **`08-development-specification.md`** | **본 문서 (개발명세서)** |
| **09** | **`09-supabase-setup.md`** | **Supabase·마이그레이션** |

---

## 15. 버전 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| 1.0 | 2026-06-12 | MVP 코드 Phase 0~6 완료, 운영 문서 추가 |
