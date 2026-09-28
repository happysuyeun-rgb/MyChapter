-- Versioned publication snapshots.
-- Keeps published_books during transition so the current app continues to work.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'publication_status') THEN
    CREATE TYPE publication_status AS ENUM ('processing', 'published', 'failed');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  version INT NOT NULL,
  status publication_status NOT NULL DEFAULT 'processing',

  title_snapshot TEXT NOT NULL,
  subtitle_snapshot TEXT,
  author_snapshot TEXT NOT NULL,
  cover_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  toc_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,

  pdf_path TEXT,
  epub_path TEXT,
  page_count INT,

  error_code TEXT,
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,

  UNIQUE (project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_publications_user_published
  ON public.publications(user_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_publications_project_version
  ON public.publications(project_id, version DESC);

ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS publications_select_own ON public.publications;
CREATE POLICY publications_select_own ON public.publications
FOR SELECT USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

-- Existing one-row-per-project publications become version 1 snapshots.
INSERT INTO public.publications (
  project_id,
  user_id,
  version,
  status,
  title_snapshot,
  subtitle_snapshot,
  author_snapshot,
  cover_snapshot,
  toc_snapshot,
  pdf_path,
  page_count,
  created_at,
  published_at
)
SELECT
  pb.project_id,
  pb.user_id,
  1,
  'published'::publication_status,
  p.title,
  p.subtitle,
  COALESCE(p.author_name, u.nickname, '작가'),
  jsonb_build_object('template_id', pb.cover_template_id),
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'chapter_number', c.chapter_number,
          'title', c.title
        )
        ORDER BY c.sort_order
      )
      FROM public.chapters c
      WHERE c.project_id = pb.project_id
    ),
    '[]'::jsonb
  ),
  pb.pdf_url,
  pb.page_count,
  pb.published_at,
  pb.published_at
FROM public.published_books pb
JOIN public.projects p ON p.id = pb.project_id
JOIN public.users u ON u.id = pb.user_id
ON CONFLICT (project_id, version) DO NOTHING;
