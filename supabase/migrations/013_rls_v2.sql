-- Strengthen child-resource ownership checks.
-- Policies are replaced rather than added because PostgreSQL permissive policies are OR-combined.

-- records
DROP POLICY IF EXISTS records_select_own ON public.records;
DROP POLICY IF EXISTS records_insert_own ON public.records;
DROP POLICY IF EXISTS records_update_own ON public.records;
DROP POLICY IF EXISTS records_delete_own ON public.records;

CREATE POLICY records_select_own ON public.records
FOR SELECT USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY records_insert_own ON public.records
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY records_update_own ON public.records
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

CREATE POLICY records_delete_own ON public.records
FOR DELETE USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

-- chapters
DROP POLICY IF EXISTS chapters_select_own ON public.chapters;
DROP POLICY IF EXISTS chapters_insert_own ON public.chapters;
DROP POLICY IF EXISTS chapters_update_own ON public.chapters;
DROP POLICY IF EXISTS chapters_delete_own ON public.chapters;

CREATE POLICY chapters_select_own ON public.chapters
FOR SELECT USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY chapters_insert_own ON public.chapters
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY chapters_update_own ON public.chapters
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

CREATE POLICY chapters_delete_own ON public.chapters
FOR DELETE USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

-- record_drafts
DROP POLICY IF EXISTS record_drafts_all_own ON public.record_drafts;

CREATE POLICY record_drafts_select_own ON public.record_drafts
FOR SELECT USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY record_drafts_insert_own ON public.record_drafts
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY record_drafts_update_own ON public.record_drafts
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

CREATE POLICY record_drafts_delete_own ON public.record_drafts
FOR DELETE USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

-- daily_questions remains legacy until application cutover.
DROP POLICY IF EXISTS daily_questions_select_own ON public.daily_questions;
DROP POLICY IF EXISTS daily_questions_insert_own ON public.daily_questions;

CREATE POLICY daily_questions_select_own ON public.daily_questions
FOR SELECT USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY daily_questions_insert_own ON public.daily_questions
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id AND p.user_id = auth.uid()
  )
);
