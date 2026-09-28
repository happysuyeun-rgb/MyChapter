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

CREATE INDEX IF NOT EXISTS idx_projects_user_archived_created
  ON public.projects(user_id, archived_at, created_at DESC);
