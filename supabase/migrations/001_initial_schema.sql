-- MyChapter initial schema

CREATE TYPE project_type AS ENUM ('emotion', 'parenting', 'yearly', 'career', 'custom');
CREATE TYPE record_frequency AS ENUM ('daily', 'week5', 'week3', 'week1');
CREATE TYPE record_mode AS ENUM ('question', 'photo', 'free', 'daily');
CREATE TYPE record_mode_instance AS ENUM ('question', 'photo', 'free');
CREATE TYPE subscription_plan AS ENUM ('free', 'pro');
CREATE TYPE notification_type AS ENUM ('daily_question', 'badge', 'chapter_complete');
CREATE TYPE ai_feature AS ENUM (
  'question', 'freewriting_hint', 'chapter', 'caption_expand', 'chapter_regenerate'
);

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  profile_emoji TEXT NOT NULL DEFAULT '🌿',
  notification_enabled BOOLEAN NOT NULL DEFAULT true,
  notification_time TIME NOT NULL DEFAULT '21:00',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT nickname_length CHECK (
    nickname IS NULL OR (char_length(nickname) BETWEEN 2 AND 10)
  )
);

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type project_type NOT NULL,
  title TEXT NOT NULL,
  target_count INT NOT NULL,
  frequency record_frequency NOT NULL,
  notification_time TIME NOT NULL DEFAULT '21:00',
  record_mode record_mode NOT NULL DEFAULT 'question',
  cover_template_id TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  started_at DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  title TEXT NOT NULL,
  ai_content TEXT,
  user_content TEXT,
  record_ids UUID[] NOT NULL DEFAULT '{}',
  is_complete BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, chapter_number)
);

CREATE TABLE public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  record_number INT NOT NULL,
  mode record_mode_instance NOT NULL,
  question_text TEXT,
  title TEXT,
  content TEXT NOT NULL,
  photo_url TEXT,
  emotion_tags TEXT[] NOT NULL DEFAULT '{}',
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  is_draft BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT content_length CHECK (char_length(content) BETWEEN 1 AND 5000),
  UNIQUE (project_id, record_number)
);

CREATE TABLE public.daily_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, question_date)
);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  play_purchase_token TEXT,
  play_order_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feature ai_feature NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'android',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, fcm_token)
);

CREATE TABLE public.published_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  cover_template_id TEXT NOT NULL,
  page_count INT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.record_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  mode record_mode_instance NOT NULL,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_id, mode)
);

CREATE INDEX idx_projects_user ON public.projects(user_id);
CREATE INDEX idx_records_user_created ON public.records(user_id, created_at DESC);
CREATE INDEX idx_records_project ON public.records(project_id);
CREATE INDEX idx_chapters_project ON public.chapters(project_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_user_month ON public.ai_usage(user_id, created_at);
