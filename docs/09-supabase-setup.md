# MyChapter — Supabase 프로젝트 연결 & 마이그레이션 가이드

> **최종 갱신:** 2026-06-23  
> Supabase 프로젝트를 **새로 만든 뒤** 이 문서 순서대로 진행하세요.  
> SQL 파일은 이미 `supabase/migrations/`에 준비되어 있습니다.

---

## 1. 사전 준비

- [ ] Supabase 계정
- [ ] MyChapter 저장소 클론 또는 로컬 폴더
- [ ] (선택) [Supabase CLI](https://supabase.com/docs/guides/cli) 설치

---

## 2. Supabase 프로젝트 생성

1. [app.supabase.com](https://app.supabase.com) → **New project**
2. **Name:** `mychapter`
3. **Database password:** 강력한 비밀번호 (안전한 곳에 저장)
4. **Region:** Northeast Asia (Seoul) `ap-northeast-2`
5. 생성 완료까지 1~2분 대기

---

## 3. 마이그레이션 적용 (필수)

> ⚠️ **반드시 001 → 002 → 003 → 004 순서**로 실행하세요.

### 방법 A: SQL Editor (비개발자 추천)

Dashboard → **SQL Editor** → **New query**

각 파일 전체 내용을 복사해 Run:

| 순서 | 파일 | 내용 |
|------|------|------|
| 1 | `001_initial_schema.sql` 또는 `scripts/001_idempotent.sql` | 테이블·ENUM·인덱스 |
| 2 | `002_rls_policies.sql` 또는 `scripts/002_idempotent.sql` | Row Level Security |
| 3 | `003_triggers.sql` 또는 `scripts/003_idempotent.sql` | 가입 시 users/subscriptions 생성 |
| 4 | `004_notifications_insert.sql` 또는 `scripts/004_idempotent.sql` | 알림 INSERT + Storage |
| 5 | `005_cron_daily_reminder.sql` | Cron 안내 (주석만) |
| 6 | `006_published_pdfs_storage.sql` 또는 `scripts/006_idempotent.sql` | PDF Storage 버킷 |

> **"already exists" 오류**가 나면 `migrations/` 대신 `scripts/*_idempotent.sql` 을 사용하세요. (`09-supabase-setup.md` §10)

**성공 확인:** Table Editor에 아래 테이블이 보이면 OK

```
users, projects, records, chapters, daily_questions,
subscriptions, ai_usage, notifications, device_tokens,
published_books, record_drafts
```

### 방법 B: Supabase CLI

```bash
cd MyChapter
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

`project-ref`는 Dashboard URL에서 확인:  
`https://supabase.com/dashboard/project/abcdefghijklmnop`

---

## 4. Storage 확인

마이그레이션 004 적용 후:

Dashboard → **Storage** → `record-photos` 버킷 존재 확인 (private)

---

## 5. API 키 → 로컬 `.env.local`

Dashboard → **Settings** → **API**

프로젝트 루트에 `.env.local` 생성:

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_PRIVACY_POLICY_URL=https://mychapter.app/legal/privacy.html
VITE_TERMS_URL=https://mychapter.app/legal/terms.html
VITE_BILLING_DEV_MODE=true
VITE_APP_URL=https://mychapter.app
```

로컬 실행:

```bash
npm install
npm run dev
```

---

## 6. Authentication 설정

### 6.1 URL Configuration

**Authentication** → **URL Configuration**

| 항목 | 값 |
|------|-----|
| Site URL | `http://localhost:5173` (개발) / `https://mychapter.app` (운영) |
| Redirect URLs | 아래 전부 추가 |

```
http://localhost:5173/**
https://mychapter.app/**
com.mychapter.app://**
```

### 6.2 Providers

| Provider | 설정 |
|----------|------|
| Email | Enable, Confirm email (선택) |
| Google | Client ID + Secret |
| Kakao | Custom OAuth 또는 Supabase Kakao 플러그인 |

### 6.3 이메일 Magic Link

Email provider 활성화 시 `signInWithOtp` 사용 (코드 반영됨).

---

## 7. Edge Functions 배포

### 7.1 Secrets 등록

**Project Settings** → **Edge Functions** → **Secrets**

```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  (service_role, anon 아님)
BILLING_DEV_BYPASS=true
CRON_SECRET=임의의_긴_문자열
```

푸시 사용 시 추가:

```
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
FIREBASE_PROJECT_ID=your-firebase-project
```

Play 결제 출시 시:

```
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON={...}
GOOGLE_PLAY_PACKAGE_NAME=com.mychapter.app
```

### 7.2 배포 명령

```bash
supabase functions deploy generate-question
supabase functions deploy generate-freewriting-hint
supabase functions deploy generate-chapter
supabase functions deploy regenerate-chapter
supabase functions deploy verify-subscription
supabase functions deploy delete-account
supabase functions deploy send-daily-reminder
```

### 7.3 동작 테스트

Dashboard → **Edge Functions** → `generate-question` → Invoke (JWT 필요)

또는 앱에서 프로젝트 생성 후 S-08 첫 질문 생성 확인.

---

## 8. 일일 알림 Cron

**Integrations** → **Cron Jobs** → Create:

| 필드 | 값 |
|------|-----|
| Name | daily-reminder |
| Schedule | `*/1 * * * *` |
| HTTP Request URL | `https://<ref>.supabase.co/functions/v1/send-daily-reminder` |
| Method | POST |
| Headers | `Authorization: Bearer <CRON_SECRET>` |
| Body | `{}` |

Firebase 미설정 시에도 **앱 내 알림(inbox)** 은 DB에 쌓입니다.

---

## 9. 마이그레이션 파일 상세

### 001_initial_schema.sql

- ENUM: `project_type`, `record_mode`, `subscription_plan` 등
- 핵심 테이블 11개
- `users.id` → `auth.users` FK

### 002_rls_policies.sql

- 모든 테이블 RLS 활성화
- `auth.uid() = user_id` 기준 SELECT/INSERT/UPDATE/DELETE
- `subscriptions`: SELECT만 (UPDATE는 Edge Function service_role)

### 003_triggers.sql

- `on_auth_user_created`: 가입 시 `users` + `subscriptions(free)` 자동 생성
- `updated_at` 자동 갱신

### 004_notifications_insert.sql

- 사용자 본인 알림 INSERT 허용 (배지)
- `record-photos` Storage 버킷 + RLS

### 005_cron_daily_reminder.sql

- Cron 설정 메모 (실제 Job은 Dashboard에서 생성)

---

## 10. 문제 해결

| 오류 | 원인 | 해결 |
|------|------|------|
| **`type "project_type" already exists`** | 001을 **이전에 일부 실행**함 | §10.1 → `001_idempotent.sql` |
| **`policy "users_select_own" already exists`** | 002를 **이전에 일부 실행**함 | §10.2 → `002_idempotent.sql` 등 |
| `relation already exists` | 마이그레이션 중복 실행 | `check_migration_state.sql`로 확인 후 idempotent 스크립트 |
| 로그인 후 users 없음 | trigger 미적용 | 003 다시 실행 |
| RLS policy violation | 002 미적용 | 002 실행 |
| AI 401/500 | Function 미배포 | 7.2 배포 + Secrets |
| Storage upload 실패 | 004 미적용 | 004 실행 |

### 10.1 `type "project_type" already exists` (001 중단)

**원인:** `001_initial_schema.sql`을 Run했을 때 ENUM 타입은 만들어졌지만, 그 다음 문장에서 실패했거나 **같은 파일을 두 번** 실행한 경우입니다.

**해결:** `supabase/scripts/001_idempotent.sql` Run → 이후 §10.2 참고

### 10.2 `policy "users_select_own" already exists` (002 중단)

**원인:** `002_rls_policies.sql`을 **이전에 일부 또는 전체 실행**한 경우입니다. 001과 같은 패턴입니다.

**해결 (권장 순서):**

| 순서 | 파일 | 비고 |
|------|------|------|
| — | `migrations/002_rls_policies.sql` | **더 이상 실행하지 않음** |
| 1 | `scripts/002_idempotent.sql` | RLS 정책 (DROP IF EXISTS 후 재생성) |
| 2 | `scripts/003_idempotent.sql` | 가입 트리거, updated_at |
| 3 | `scripts/004_idempotent.sql` | 알림 INSERT + record-photos 버킷 |
| 4 | `scripts/006_idempotent.sql` | published-pdfs 버킷 |

**한 줄 요약:** `migrations/` 대신 `scripts/*_idempotent.sql` 을 **001 → 002 → 003 → 004 → 006** 순으로 사용하세요.

### 10.3 완전 초기화 (테스트 DB, 데이터 없을 때만)

```sql
-- ⚠️ public 스키마 데이터 전부 삭제. 프로덕션에서 사용 금지.
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

이후 `001_initial_schema.sql`을 처음부터 다시 실행합니다.

---

## 11. Supabase 프로젝트 추가 후 AI에게 요청할 수 있는 것

Supabase 프로젝트를 만든 뒤 Cursor에 아래처럼 요청하면 됩니다:

> "Supabase project ref는 `xxxxx`야. 마이그레이션 적용 확인하고 Edge Function 배포 도와줘."

또는:

> "`.env.local`에 URL 넣었어. 로그인 테스트 안 되는데 OAuth Redirect 확인해줘."

**본인이 직접 해야 하는 것:** Supabase 계정 생성, SQL Run 버튼 클릭, API Key 복사, OAuth 앱 등록.

---

## 갱신 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-23 | §10.1 `project_type already exists` 해결, `001_idempotent.sql` 추가 |
| 2026-06-23 | §10.2 RLS policy already exists, `002~006_idempotent.sql` 추가 |
