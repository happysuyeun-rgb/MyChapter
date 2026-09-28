-- Security/performance hardening after DB v2 cutover.
-- Keeps behavior unchanged while addressing current Supabase advisor warnings.

ALTER FUNCTION public.set_updated_at()
  SET search_path = public;

ALTER FUNCTION public.set_project_readiness_defaults()
  SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

CREATE INDEX IF NOT EXISTS idx_ai_usage_project_id
  ON public.ai_usage(project_id);

CREATE INDEX IF NOT EXISTS idx_chapters_user_id
  ON public.chapters(user_id);

CREATE INDEX IF NOT EXISTS idx_record_drafts_project_id
  ON public.record_drafts(project_id);

-- Legacy-only indexes are intentionally deferred:
-- daily_questions.user_id and records.chapter_id will be removed with the legacy tables/columns.

-- Optimize DB v2 RLS policies by evaluating auth.uid() once per statement.
DROP POLICY IF EXISTS publications_select_own ON public.publications;
CREATE POLICY publications_select_own ON public.publications
FOR SELECT USING (
  (select auth.uid()) = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS record_analysis_select_own ON public.record_analysis;
CREATE POLICY record_analysis_select_own ON public.record_analysis
FOR SELECT USING (
  (select auth.uid()) = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS record_analysis_insert_own ON public.record_analysis;
CREATE POLICY record_analysis_insert_own ON public.record_analysis
FOR INSERT WITH CHECK (
  (select auth.uid()) = user_id
  AND EXISTS (
    SELECT 1
    FROM public.projects p
    JOIN public.records r ON r.project_id = p.id
    WHERE p.id = record_analysis.project_id
      AND p.user_id = (select auth.uid())
      AND r.id = record_analysis.record_id
      AND r.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS record_analysis_update_own ON public.record_analysis;
CREATE POLICY record_analysis_update_own ON public.record_analysis
FOR UPDATE
USING (
  (select auth.uid()) = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = (select auth.uid())
  )
)
WITH CHECK (
  (select auth.uid()) = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS record_analysis_delete_own ON public.record_analysis;
CREATE POLICY record_analysis_delete_own ON public.record_analysis
FOR DELETE USING (
  (select auth.uid()) = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS chapter_records_select_own ON public.chapter_records;
CREATE POLICY chapter_records_select_own ON public.chapter_records
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.projects p ON p.id = c.project_id
    JOIN public.records r ON r.id = record_id AND r.project_id = c.project_id
    WHERE c.id = chapter_id
      AND p.user_id = (select auth.uid())
      AND r.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS chapter_records_insert_own ON public.chapter_records;
CREATE POLICY chapter_records_insert_own ON public.chapter_records
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.projects p ON p.id = c.project_id
    JOIN public.records r ON r.id = record_id AND r.project_id = c.project_id
    WHERE c.id = chapter_id
      AND p.user_id = (select auth.uid())
      AND r.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS chapter_records_update_own ON public.chapter_records;
CREATE POLICY chapter_records_update_own ON public.chapter_records
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.projects p ON p.id = c.project_id
    WHERE c.id = chapter_id AND p.user_id = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.projects p ON p.id = c.project_id
    JOIN public.records r ON r.id = record_id AND r.project_id = c.project_id
    WHERE c.id = chapter_id
      AND p.user_id = (select auth.uid())
      AND r.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS chapter_records_delete_own ON public.chapter_records;
CREATE POLICY chapter_records_delete_own ON public.chapter_records
FOR DELETE USING (
  EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.projects p ON p.id = c.project_id
    WHERE c.id = chapter_id AND p.user_id = (select auth.uid())
  )
);
