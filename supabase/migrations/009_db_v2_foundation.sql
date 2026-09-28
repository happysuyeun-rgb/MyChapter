-- MY CHAPTER DB v2 foundation.
-- Additive migration: keeps legacy project fields until application cutover is complete.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS author_name TEXT,
  ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS readiness_min_days INT,
  ADD COLUMN IF NOT EXISTS readiness_min_records INT,
  ADD COLUMN IF NOT EXISTS readiness_target_days INT,
  ADD COLUMN IF NOT EXISTS readiness_target_records INT,
  ADD COLUMN IF NOT EXISTS readiness_policy_version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS selected_cover_id TEXT;

-- Preserve existing author / cover choices where possible.
UPDATE public.projects p
SET
  author_name = COALESCE(p.author_name, u.nickname),
  selected_cover_id = COALESCE(p.selected_cover_id, p.cover_template_id)
FROM public.users u
WHERE u.id = p.user_id
  AND (p.author_name IS NULL OR p.selected_cover_id IS NULL);

-- Snapshot the current readiness policy onto existing books.
UPDATE public.projects
SET
  readiness_min_days = CASE type::text
    WHEN 'growth' THEN 60
    WHEN 'life_story' THEN 90
    WHEN 'career' THEN 60
    WHEN 'parenting' THEN 30
    WHEN 'relationships' THEN 30
    WHEN 'travel' THEN 7
    WHEN 'hobby' THEN 30
    WHEN 'learning' THEN 30
    WHEN 'yearly' THEN 60
    ELSE 30
  END,
  readiness_min_records = CASE type::text
    WHEN 'growth' THEN 30
    WHEN 'life_story' THEN 40
    WHEN 'career' THEN 30
    WHEN 'parenting' THEN 30
    WHEN 'relationships' THEN 25
    WHEN 'travel' THEN 10
    WHEN 'hobby' THEN 20
    WHEN 'learning' THEN 20
    WHEN 'yearly' THEN 30
    ELSE 20
  END,
  readiness_target_days = CASE type::text
    WHEN 'growth' THEN 90
    WHEN 'life_story' THEN 180
    WHEN 'career' THEN 90
    WHEN 'parenting' THEN 90
    WHEN 'relationships' THEN 90
    WHEN 'travel' THEN 15
    WHEN 'hobby' THEN 60
    WHEN 'learning' THEN 90
    WHEN 'yearly' THEN 100
    ELSE 60
  END,
  readiness_target_records = CASE type::text
    WHEN 'growth' THEN 40
    WHEN 'life_story' THEN 60
    WHEN 'career' THEN 40
    WHEN 'parenting' THEN 45
    WHEN 'relationships' THEN 40
    WHEN 'travel' THEN 15
    WHEN 'hobby' THEN 30
    WHEN 'learning' THEN 35
    WHEN 'yearly' THEN 40
    ELSE 30
  END
WHERE
  readiness_min_days IS NULL
  OR readiness_min_records IS NULL
  OR readiness_target_days IS NULL
  OR readiness_target_records IS NULL;

-- Guard against invalid readiness snapshots.
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_readiness_positive;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_readiness_positive CHECK (
    readiness_min_days IS NULL
    OR (
      readiness_min_days > 0
      AND readiness_min_records > 0
      AND readiness_target_days >= readiness_min_days
      AND readiness_target_records >= readiness_min_records
    )
  );

CREATE OR REPLACE FUNCTION public.set_project_readiness_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.readiness_min_days IS NULL THEN
    NEW.readiness_min_days := CASE NEW.type::text
      WHEN 'growth' THEN 60
      WHEN 'life_story' THEN 90
      WHEN 'career' THEN 60
      WHEN 'parenting' THEN 30
      WHEN 'relationships' THEN 30
      WHEN 'travel' THEN 7
      WHEN 'hobby' THEN 30
      WHEN 'learning' THEN 30
      WHEN 'yearly' THEN 60
      ELSE 30
    END;
  END IF;

  IF NEW.readiness_min_records IS NULL THEN
    NEW.readiness_min_records := CASE NEW.type::text
      WHEN 'growth' THEN 30
      WHEN 'life_story' THEN 40
      WHEN 'career' THEN 30
      WHEN 'parenting' THEN 30
      WHEN 'relationships' THEN 25
      WHEN 'travel' THEN 10
      WHEN 'hobby' THEN 20
      WHEN 'learning' THEN 20
      WHEN 'yearly' THEN 30
      ELSE 20
    END;
  END IF;

  IF NEW.readiness_target_days IS NULL THEN
    NEW.readiness_target_days := CASE NEW.type::text
      WHEN 'growth' THEN 90
      WHEN 'life_story' THEN 180
      WHEN 'career' THEN 90
      WHEN 'parenting' THEN 90
      WHEN 'relationships' THEN 90
      WHEN 'travel' THEN 15
      WHEN 'hobby' THEN 60
      WHEN 'learning' THEN 90
      WHEN 'yearly' THEN 100
      ELSE 60
    END;
  END IF;

  IF NEW.readiness_target_records IS NULL THEN
    NEW.readiness_target_records := CASE NEW.type::text
      WHEN 'growth' THEN 40
      WHEN 'life_story' THEN 60
      WHEN 'career' THEN 40
      WHEN 'parenting' THEN 45
      WHEN 'relationships' THEN 40
      WHEN 'travel' THEN 15
      WHEN 'hobby' THEN 30
      WHEN 'learning' THEN 35
      WHEN 'yearly' THEN 40
      ELSE 30
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_readiness_defaults ON public.projects;
CREATE TRIGGER projects_readiness_defaults
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_project_readiness_defaults();

-- Existing books that already satisfy the snapshot become sticky-ready.
UPDATE public.projects p
SET ready_at = COALESCE(p.ready_at, now())
WHERE p.ready_at IS NULL
  AND (CURRENT_DATE - COALESCE(p.started_at, p.created_at::date) + 1) >= p.readiness_min_days
  AND (
    SELECT count(*)
    FROM public.records r
    WHERE r.project_id = p.id
      AND r.is_draft = false
  ) >= p.readiness_min_records;

-- Once a record makes a book ready, keep ready_at permanently.
CREATE OR REPLACE FUNCTION public.mark_project_ready_after_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_draft = false THEN
    UPDATE public.projects p
    SET ready_at = COALESCE(p.ready_at, now())
    WHERE p.id = NEW.project_id
      AND p.ready_at IS NULL
      AND (CURRENT_DATE - COALESCE(p.started_at, p.created_at::date) + 1) >= p.readiness_min_days
      AND (
        SELECT count(*)
        FROM public.records r
        WHERE r.project_id = p.id
          AND r.is_draft = false
      ) >= p.readiness_min_records;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS records_mark_project_ready ON public.records;
CREATE TRIGGER records_mark_project_ready
  AFTER INSERT OR UPDATE OF is_draft ON public.records
  FOR EACH ROW EXECUTE FUNCTION public.mark_project_ready_after_record();

CREATE INDEX IF NOT EXISTS idx_projects_user_archived_created
  ON public.projects(user_id, archived_at, created_at DESC);
