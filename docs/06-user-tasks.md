# MyChapter — 직접 해야 하는 일 (비개발자 가이드)

> **대상:** 서비스 운영·출시를 직접 진행하는 담당자  
> **전제:** 코드 구현은 Cursor AI가 완료했으며, 아래 항목은 **외부 서비스 계정·설정·업로드**가 필요합니다.

---

## 1. 우선순위 요약

| 순서 | 할 일 | 예상 난이도 | 없으면 |
|------|--------|-------------|--------|
| 1 | Supabase 프로젝트 생성 + 마이그레이션 | ★★☆ | 앱이 동작하지 않음 |
| 2 | `.env.local` 환경 변수 입력 | ★☆☆ | 로그인·DB 연결 불가 |
| 3 | Supabase Auth (Kakao/Google/이메일) 설정 | ★★☆ | 로그인 불가 |
| 4 | Edge Function 배포 + API Key | ★★★ | AI 질문·챕터 생성 불가 |
| 5 | Vercel 웹 배포 | ★★☆ | 웹·약관 URL 없음 |
| 6 | Firebase (푸시 알림) | ★★★ | 알림 푸시 불가 (앱 내 알림은 가능) |
| 7 | Android Studio 빌드 + Play Console | ★★★★ | 스토어 출시 불가 |
| 8 | Play Billing 상품 등록 | ★★★ | 실제 결제 불가 |

상세 Supabase 절차는 **`docs/09-supabase-setup.md`** 를 따르세요.

---

## 2. Supabase (필수)

### 2.1 프로젝트 생성

1. [supabase.com](https://supabase.com) 가입
2. **New project** → 이름 `mychapter`, 리전 **Seoul(ap-northeast-2)** 권장
3. DB 비밀번호 안전하게 보관

### 2.2 마이그레이션 적용

AI가 SQL 파일을 준비해 두었습니다. **아래 중 편한 방법 하나**를 선택하세요.

**방법 A — Supabase Dashboard (비개발자 추천)**

1. Dashboard → **SQL Editor** → **New query**
2. 아래 파일 내용을 **번호 순서대로** 붙여넣고 **Run**:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_triggers.sql`
   - `supabase/migrations/004_notifications_insert.sql`
   - `supabase/migrations/005_cron_daily_reminder.sql` *(주석만 있음, Cron은 2.5 참고)*

**방법 B — Supabase CLI (개발자 도움 시)**

```bash
supabase login
supabase link --project-ref <프로젝트-ref>
supabase db push
```

### 2.3 API 키 복사

Dashboard → **Settings** → **API**:

| 항목 | 용도 |
|------|------|
| Project URL | `VITE_SUPABASE_URL` |
| anon public key | `VITE_SUPABASE_ANON_KEY` |
| service_role key | Edge Function 시크릿 *(클라이언트에 넣지 마세요)* |

### 2.4 Authentication 설정

Dashboard → **Authentication** → **Providers**:

| Provider | 설정 |
|----------|------|
| **Email** | Enable, Magic Link 사용 |
| **Google** | Client ID / Secret (Google Cloud Console) |
| **Kakao** | Supabase 커스텀 OAuth 또는 Kakao Developers 연동 |

**Redirect URLs** (Authentication → URL Configuration):

```
http://localhost:5173/home
https://mychapter.app/home
com.mychapter.app://home
```

### 2.5 Edge Function 시크릿

Dashboard → **Edge Functions** → **Secrets**:

| Secret | 설명 |
|--------|------|
| `ANTHROPIC_API_KEY` | Claude API (AI 질문·챕터) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role 키 |
| `BILLING_DEV_BYPASS` | `true` *(테스트 결제용, 출시 전 false)* |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Play 결제 검증 *(출시 시)* |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | FCM 푸시 *(푸시 사용 시)* |
| `FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID |
| `CRON_SECRET` | 일일 알림 Cron 인증용 임의 문자열 |

### 2.6 Edge Function 배포

개발자에게 아래 배포를 요청하거나, Supabase CLI로 진행:

```bash
supabase functions deploy generate-question
supabase functions deploy generate-freewriting-hint
supabase functions deploy generate-chapter
supabase functions deploy regenerate-chapter
supabase functions deploy verify-subscription
supabase functions deploy delete-account
supabase functions deploy send-daily-reminder
```

### 2.7 일일 알림 Cron

Dashboard → **Integrations** → **Cron** (또는 pg_cron):

- **Schedule:** `*/1 * * * *` (매 분)
- **URL:** `https://<project-ref>.supabase.co/functions/v1/send-daily-reminder`
- **Header:** `Authorization: Bearer <CRON_SECRET>`

---

## 3. 로컬 환경 변수 (필수)

프로젝트 루트에 `.env.local` 파일 생성 (`.env.example` 참고):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_PRIVACY_POLICY_URL=https://mychapter.app/legal/privacy.html
VITE_TERMS_URL=https://mychapter.app/legal/terms.html
VITE_BILLING_DEV_MODE=true
VITE_APP_URL=https://mychapter.app
```

로컬 테스트:

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

---

## 4. Vercel 웹 배포 (필수)

1. [vercel.com](https://vercel.com) 가입 → GitHub 저장소 연결
2. **Environment Variables**에 `.env.local`과 동일한 `VITE_*` 값 입력
3. Deploy

배포 후 확인:

- `https://<도메인>/` → 스플래시/로그인
- `https://<도메인>/legal/privacy.html` → 개인정보처리방침
- `https://<도메인>/legal/terms.html` → 이용약관

커스텀 도메인 `mychapter.app` 연결은 Vercel → Domains에서 설정.

---

## 5. Firebase — 푸시 알림 (선택, 앱 출시 시 권장)

1. [Firebase Console](https://console.firebase.google.com) → 프로젝트 생성
2. **Android 앱 추가** — 패키지명 `com.mychapter.app`
3. `google-services.json` 다운로드
4. 파일을 `android/app/google-services.json`에 복사 *(개발자 또는 AI에게 요청 가능)*
5. Firebase → **서비스 계정** → JSON 키 → Supabase Secret `FIREBASE_SERVICE_ACCOUNT_JSON`에 등록

---

## 6. Android 앱 빌드 & Play Store (출시 시)

### 6.1 본인이 할 수 있는 것

- [Google Play Console](https://play.google.com/console) 개발자 등록 (1회 $25)
- 스토어 설명 작성 → `store/play-store-listing.ko.txt` 참고
- 스크린샷 4~8장 촬영 (폰 또는 에뮬레이터)
- 개인정보처리방침·이용약관 URL 입력
- 내부 테스트 트랙에 테스터 이메일 등록

### 6.2 개발자/지인 도움이 필요한 것

- Android Studio 설치 및 JDK 설정
- `npm run cap:sync` → `npm run cap:android`
- **서명 키(keystore)** 생성 *(한 번 잃어버리면 업데이트 불가 — 반드시 백업)*
- AAB 빌드 → Play Console 업로드

### 6.3 Play Billing (Pro 구독)

Play Console → **수익 창출** → **구독** 생성:

| 항목 | 값 |
|------|-----|
| Product ID | `mychapter_pro_monthly` |
| 가격 | 월 5,900원 |

Google Play Developer API + 서비스 계정 연동 → Supabase `verify-subscription`에 JSON 등록.

---

## 7. Anthropic (Claude API) — AI 기능 (필수)

1. [console.anthropic.com](https://console.anthropic.com) 가입
2. API Key 발급
3. Supabase Secret `ANTHROPIC_API_KEY`에 등록

---

## 8. OAuth 앱 등록 (로그인)

### Google

1. [Google Cloud Console](https://console.cloud.google.com)
2. OAuth 2.0 클라이언트 ID (Web + Android)
3. Supabase Google Provider에 Client ID/Secret 입력

### Kakao

1. [Kakao Developers](https://developers.kakao.com)
2. 앱 생성 → REST API 키, Redirect URI 설정
3. Supabase 또는 커스텀 OAuth 연동

---

## 9. 출시 전 체크리스트

### 계정·인프라

- [ ] Supabase 마이그레이션 001~004 적용 완료
- [ ] `.env.local` / Vercel 환경 변수 설정
- [ ] Edge Function 7개 배포
- [ ] Anthropic API Key 등록

### 기능 테스트 (직접 또는 테스터)

- [ ] 카카오/Google/이메일 로그인
- [ ] 프로젝트 생성 → 첫 기록 → 홈 진행률 확인
- [ ] 기록 10개 후 챕터 생성 (또는 수동 생성 버튼)
- [ ] Pro 업그레이드 (개발 모드: `VITE_BILLING_DEV_MODE=true`)
- [ ] 계정 삭제 후 재가입

### Play 심사 필수

- [ ] 앱 내 계정 삭제 (S-W1) 동작
- [ ] 개인정보처리방침 URL 공개
- [ ] 이용약관 URL 공개
- [ ] 인앱결제 (Pro) — 출시 시 실결제 연동

---

## 10. 역할 분담 요약

| 구분 | 담당 |
|------|------|
| 코드·화면·API·마이그레이션 SQL | Cursor AI (완료) |
| Supabase 프로젝트 생성·SQL 실행 | **본인** |
| API Key·OAuth·Firebase·Play Console | **본인** (+ 1회 빌드는 개발자 도움 권장) |
| 스토어 문구·스크린샷·심사 제출 | **본인** |
| 운영·고객 응대·약관 수정 | **본인** |

---

## 11. 막혔을 때

| 증상 | 확인 |
|------|------|
| 로그인 안 됨 | Supabase Redirect URL, OAuth 키 |
| AI 질문 안 나옴 | Edge Function 배포, `ANTHROPIC_API_KEY` |
| 빈 화면만 나옴 | `.env.local` URL/Key 확인 |
| 푸시 안 옴 | `google-services.json`, Firebase Secret, Cron |
| 결제 안 됨 | Play 상품 ID `mychapter_pro_monthly`, Billing Secret |

개발 진행 현황은 **`docs/07-dev-progress.md`** 를 참고하세요.
