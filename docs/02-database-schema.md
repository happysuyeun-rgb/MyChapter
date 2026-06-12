# MyChapter — 데이터베이스 스키마

> Supabase PostgreSQL · 마이그레이션 파일명 기준

---

## 1. ER 개요

```
auth.users ──1:1── users
users ──1:N── projects
users ──1:N── records (via project)
users ──1:1── subscriptions
users ──1:N── notifications
users ──1:N── ai_usage
users ──1:N── device_tokens

projects ──1:N── records
projects ──1:N── chapters
projects ──1:N── daily_questions
projects ──0:1── published_books
```

---

## 2. 테이블 정의

### `users` (public.users)

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  profile_emoji TEXT DEFAULT '🌿',
  notification_enabled BOOLEAN DEFAULT true,
  notification_time TIME DEFAULT '21:00',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT nickname_length CHECK (
    nickname IS NULL OR (char_length(nickname) BETWEEN 2 AND 10)
  )
);
```

### `projects`

```sql
CREATE TYPE project_type AS ENUM (
  'emotion', 'parenting', 'yearly', 'career', 'custom'
);

CREATE TYPE record_frequency AS ENUM (
  'daily', 'week5', 'week3', 'week1'
);

CREATE TYPE record_mode AS ENUM (
  'question', 'photo', 'free', 'daily'
);

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type project_type NOT NULL,
  title TEXT NOT NULL,
  target_count INT NOT NULL,           -- 목표 기록 수 (S-06 AI 계산값)
  frequency record_frequency NOT NULL,
  notification_time TIME DEFAULT '21:00',
  record_mode record_mode NOT NULL DEFAULT 'question',
  cover_template_id TEXT,              -- 'cover_01' ~ 'cover_04'
  is_completed BOOLEAN DEFAULT false,
  started_at DATE DEFAULT CURRENT_DATE,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_projects_user ON public.projects(user_id);
```

### `records`

```sql
CREATE TYPE record_mode_instance AS ENUM (
  'question', 'photo', 'free'
);

CREATE TABLE public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  record_number INT NOT NULL,          -- 프로젝트 내 #N
  mode record_mode_instance NOT NULL,
  question_text TEXT,                  -- question 모드
  title TEXT,                          -- free 모드 (nullable → 날짜 자동)
  content TEXT NOT NULL,
  photo_url TEXT,                      -- Storage path
  emotion_tags TEXT[] DEFAULT '{}',
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  is_draft BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT content_length CHECK (char_length(content) BETWEEN 1 AND 5000)
);

CREATE UNIQUE INDEX idx_records_project_number
  ON public.records(project_id, record_number);
CREATE INDEX idx_records_user_created
  ON public.records(user_id, created_at DESC);
```

### `chapters`

```sql
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  title TEXT NOT NULL,
  ai_content TEXT,                     -- AI 최초 생성 (보관)
  user_content TEXT,                   -- 사용자 편집본
  record_ids UUID[] NOT NULL DEFAULT '{}',
  is_complete BOOLEAN DEFAULT false,
  sort_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_chapters_project_number
  ON public.chapters(project_id, chapter_number);

-- 미리보기/PDF용 표현식
-- display_content = COALESCE(user_content, ai_content)
```

### `daily_questions`

```sql
CREATE TABLE public.daily_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, question_date)
);
```

### `subscriptions`

```sql
CREATE TYPE subscription_plan AS ENUM ('free', 'pro');

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  plan subscription_plan DEFAULT 'free',
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  play_purchase_token TEXT,
  play_order_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `ai_usage`

```sql
CREATE TYPE ai_feature AS ENUM (
  'question', 'freewriting_hint', 'chapter', 'caption_expand', 'chapter_regenerate'
);

CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feature ai_feature NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_usage_user_month
  ON public.ai_usage(user_id, created_at);
```

### `notifications`

```sql
CREATE TYPE notification_type AS ENUM (
  'daily_question', 'badge', 'chapter_complete'
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
```

### `device_tokens`

```sql
CREATE TABLE public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  platform TEXT DEFAULT 'android',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, fcm_token)
);
```

### `published_books`

```sql
CREATE TABLE public.published_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  cover_template_id TEXT NOT NULL,
  page_count INT,
  published_at TIMESTAMPTZ DEFAULT now()
);
```

### `record_drafts` (임시저장)

```sql
CREATE TABLE public.record_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  mode record_mode_instance NOT NULL,
  payload JSONB NOT NULL,              -- { question_text, content, title, emotion_tags, photo_url }
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, project_id, mode)
);
```

---

## 3. RLS 요약

모든 테이블: `auth.uid() = user_id` (projects는 `user_id`, records는 `user_id`)

```sql
-- 예: records
CREATE POLICY "records_select_own" ON records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "records_insert_own" ON records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "records_update_own" ON records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "records_delete_own" ON records FOR DELETE USING (auth.uid() = user_id);
```

Edge Functions는 `service_role`로 구독 검증·Cron만 사용.

---

## 4. 트리거

### 4.1 신규 가입 → users + subscriptions

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id) VALUES (NEW.id);
  INSERT INTO public.subscriptions (user_id, plan) VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4.2 record INSERT 후처리 (DB Function, Edge에서 호출 또는 Trigger)

`on_record_insert`에서 수행:

1. `record_number` = `MAX(record_number)+1` (프로젝트별)
2. 미할당 기록을 현재 진행 중 챕터에 연결 (없으면 대기)
3. `COUNT % 10 = 0` → `pg_net` 또는 클라이언트가 `generate-chapter` 호출

---

## 5. Storage 버킷

| 버킷 | 경로 | RLS |
|------|------|-----|
| `record-photos` | `{user_id}/{project_id}/{record_id}.webp` | 본인만 read/write |
| `published-pdfs` | `{user_id}/{project_id}/book.pdf` | 본인만 read |

이미지 업로드 시 클라이언트에서 WebP 리사이즈 (max 1200px) 후 업로드.

---

## 6. Seed 데이터 (`004_seed_data.sql`)

### 감정 태그 (기본 칩)

```sql
-- constants/emotionTags.ts 로도 관리, DB seed는 선택
-- 따뜻함, 반가움, 기쁨, 평온, 슬픔, 불안, 분노, 무기력, 복잡함, 차분함, 설렘, 감사
```

### 프로젝트 유형 메타

| type | label | default_title | default_period | default_frequency |
|------|-------|---------------|----------------|-------------------|
| emotion | 감정 성장기 | 나의 100일 감정 여행 | 100일 | week5 |
| parenting | 육아 성장북 | 우리 아이 성장 기록 | 365일 | week3 |
| yearly | 올해의 나 | 2026년, 나의 이야기 | 365일 | week1 |
| career | 퇴사와 도전 | 새로운 시작의 기록 | 100일 | week5 |
| custom | 직접 정의하기 | 나만의 책 | 100일 | week5 |

### 표지 템플릿

| id | Free | 이름 |
|----|------|------|
| cover_01 | ✓ | 클래식 다크 |
| cover_02 | ✓ | 포레스트 그린 |
| cover_03 | Pro | 웜 오렌지 |
| cover_04 | Pro | 미드나잇 퍼플 |
