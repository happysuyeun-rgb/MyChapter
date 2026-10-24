-- Local-only verification for 025 publication entitlement (active Pro vs expired).
-- Ephemeral Postgres only — never run against production.

\set ON_ERROR_STOP on

DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

DO $$ BEGIN
  CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.project_type AS ENUM (
    'growth','life_story','career','parenting','relationships',
    'travel','hobby','learning','yearly','custom','emotion'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  nickname text
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id uuid PRIMARY KEY REFERENCES public.users(id),
  plan public.subscription_plan NOT NULL DEFAULT 'free',
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id),
  type public.project_type NOT NULL DEFAULT 'custom',
  title text NOT NULL DEFAULT 't',
  subtitle text,
  author_name text,
  selected_cover_id text,
  cover_template_id text,
  started_at date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  ready_at timestamptz,
  manuscript_reviewed_at timestamptz,
  final_review_completed_at timestamptz,
  readiness_min_days int,
  readiness_min_records int,
  readiness_target_days int,
  readiness_target_records int
);

CREATE TABLE IF NOT EXISTS public.records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  is_draft boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  chapter_number int NOT NULL DEFAULT 1,
  title text NOT NULL DEFAULT 'c',
  sort_order int NOT NULL DEFAULT 1,
  user_content text,
  ai_content text
);

CREATE TABLE IF NOT EXISTS public.publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  user_id uuid NOT NULL REFERENCES public.users(id),
  version int NOT NULL DEFAULT 1,
  status text NOT NULL,
  processing_started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  title_snapshot text,
  subtitle_snapshot text,
  author_snapshot text,
  cover_snapshot jsonb,
  toc_snapshot jsonb,
  pdf_path text,
  page_count int,
  error_code text,
  error_message text,
  published_at timestamptz
);

-- Migration 025 is applied by the runner (cat 025.sql here) before continuing.

TRUNCATE public.publications, public.chapters, public.records, public.projects, public.subscriptions, public.users CASCADE;

INSERT INTO public.users(id, nickname) VALUES
  ('11111111-1111-1111-1111-111111111111', 'free'),
  ('22222222-2222-2222-2222-222222222222', 'active_pro'),
  ('33333333-3333-3333-3333-333333333333', 'expired_pro');

INSERT INTO public.subscriptions(user_id, plan, expires_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'free', NULL),
  ('22222222-2222-2222-2222-222222222222', 'pro', now() + interval '30 days'),
  ('33333333-3333-3333-3333-333333333333', 'pro', now() - interval '1 day');

-- Seed as service-role (auth.uid() null) so readiness/cover guards skip.
SELECT set_config('request.jwt.claim.sub', '', false);

INSERT INTO public.projects(
  id, user_id, type, title, selected_cover_id, ready_at, manuscript_reviewed_at, final_review_completed_at, started_at
) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'custom', 'Free Book', 'cover_01', now(), now(), now(), CURRENT_DATE),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '22222222-2222-2222-2222-222222222222', 'custom', 'Pro Book', 'cover_01', now(), now(), now(), CURRENT_DATE),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '33333333-3333-3333-3333-333333333333', 'custom', 'Expired Book', 'cover_01', now(), now(), now(), CURRENT_DATE),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '22222222-2222-2222-2222-222222222222', 'custom', 'Pro Book 2', 'cover_01', now(), now(), now(), CURRENT_DATE),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', '33333333-3333-3333-3333-333333333333', 'custom', 'Expired Book 2', 'cover_01', now(), now(), now(), CURRENT_DATE);

INSERT INTO public.chapters(project_id, title, user_content)
SELECT id, 'Ch1', 'body' FROM public.projects;

-- Regression: authenticated record insert + project title update still work.
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
INSERT INTO public.records(project_id, is_draft)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', false);
UPDATE public.projects SET title = 'Free Book Updated'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
  AND user_id = '11111111-1111-1111-1111-111111111111';
SELECT title AS free_project_title, (
  SELECT count(*) FROM public.records r WHERE r.project_id = p.id
) AS record_count
FROM public.projects p
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1';

CREATE OR REPLACE FUNCTION public.test_reserve(p_user uuid, p_project uuid, p_cover text)
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', p_user::text, true);
  RETURN private.reserve_book_publication(p_project, p_cover);
END;
$$;

-- 1) Free first publish OK
SELECT public.test_reserve(
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  'cover_01'
) AS free_first_ok;

UPDATE public.publications SET status='published', published_at=now()
WHERE user_id='11111111-1111-1111-1111-111111111111';

-- 2) Free second → PUBLICATION_LIMIT
DO $$
BEGIN
  BEGIN
    PERFORM public.test_reserve(
      '11111111-1111-1111-1111-111111111111',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      'cover_01'
    );
    RAISE EXCEPTION 'EXPECTED_PUBLICATION_LIMIT_FOR_FREE';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%PUBLICATION_LIMIT%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS free second → PUBLICATION_LIMIT';
  END;
END $$;

-- 3) Active Pro with prior published still OK on another book
INSERT INTO public.publications(project_id, user_id, version, status, published_at, title_snapshot, author_snapshot, cover_snapshot)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
  '22222222-2222-2222-2222-222222222222',
  1, 'published', now(), 'Pro Book', 'active_pro', '{"template_id":"cover_01"}'::jsonb
);

SELECT public.test_reserve(
  '22222222-2222-2222-2222-222222222222',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
  'cover_01'
) AS active_pro_second_ok;

-- 4) Expired Pro with prior published → PUBLICATION_LIMIT
INSERT INTO public.publications(project_id, user_id, version, status, published_at, title_snapshot, author_snapshot, cover_snapshot)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
  '33333333-3333-3333-3333-333333333333',
  1, 'published', now(), 'Expired Book', 'expired_pro', '{"template_id":"cover_01"}'::jsonb
);

DO $$
BEGIN
  BEGIN
    PERFORM public.test_reserve(
      '33333333-3333-3333-3333-333333333333',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
      'cover_01'
    );
    RAISE EXCEPTION 'EXPECTED_PUBLICATION_LIMIT_FOR_EXPIRED_PRO';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%PUBLICATION_LIMIT%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS expired Pro with history → PUBLICATION_LIMIT';
  END;
END $$;

DO $$
BEGIN
  IF private.user_has_active_pro('22222222-2222-2222-2222-222222222222') IS NOT TRUE THEN
    RAISE EXCEPTION 'active pro should be true';
  END IF;
  IF private.user_has_active_pro('33333333-3333-3333-3333-333333333333') IS NOT FALSE THEN
    RAISE EXCEPTION 'expired pro should be false';
  END IF;
  IF private.user_has_active_pro('11111111-1111-1111-1111-111111111111') IS NOT FALSE THEN
    RAISE EXCEPTION 'free should be false';
  END IF;
  RAISE NOTICE 'PASS user_has_active_pro Free/active/expired';
END $$;

SELECT 'ALL_PUBLICATION_ENTITLEMENT_CHECKS_PASSED' AS result;
