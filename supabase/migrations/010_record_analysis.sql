-- Structured AI analysis for long-term personalization and semantic book composition.

CREATE TABLE IF NOT EXISTS public.record_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL UNIQUE REFERENCES public.records(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  summary TEXT,
  themes JSONB NOT NULL DEFAULT '[]'::jsonb,
  people JSONB NOT NULL DEFAULT '[]'::jsonb,
  places JSONB NOT NULL DEFAULT '[]'::jsonb,
  emotions JSONB NOT NULL DEFAULT '[]'::jsonb,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  conflict TEXT,
  change TEXT,
  insight TEXT,
  goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT,
  schema_version INT NOT NULL DEFAULT 1,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_record_analysis_project
  ON public.record_analysis(project_id, analyzed_at DESC);

CREATE INDEX IF NOT EXISTS idx_record_analysis_user
  ON public.record_analysis(user_id, analyzed_at DESC);

ALTER TABLE public.record_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS record_analysis_select_own ON public.record_analysis;
CREATE POLICY record_analysis_select_own ON public.record_analysis
FOR SELECT USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS record_analysis_insert_own ON public.record_analysis;
CREATE POLICY record_analysis_insert_own ON public.record_analysis
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.projects p
    JOIN public.records r ON r.project_id = p.id
    WHERE p.id = project_id
      AND p.user_id = auth.uid()
      AND r.id = record_id
      AND r.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS record_analysis_update_own ON public.record_analysis;
CREATE POLICY record_analysis_update_own ON public.record_analysis
FOR UPDATE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS record_analysis_delete_own ON public.record_analysis;
CREATE POLICY record_analysis_delete_own ON public.record_analysis
FOR DELETE USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

DROP TRIGGER IF EXISTS record_analysis_updated_at ON public.record_analysis;
CREATE TRIGGER record_analysis_updated_at
  BEFORE UPDATE ON public.record_analysis
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
