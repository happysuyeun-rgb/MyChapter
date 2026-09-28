-- Normalized relationship between chapters and source records.
-- Legacy records.chapter_id and chapters.record_ids remain during transition.

CREATE TABLE IF NOT EXISTS public.chapter_records (
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  record_id UUID NOT NULL REFERENCES public.records(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  relevance_score REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (chapter_id, record_id)
);

CREATE INDEX IF NOT EXISTS idx_chapter_records_chapter_position
  ON public.chapter_records(chapter_id, position);

CREATE INDEX IF NOT EXISTS idx_chapter_records_record
  ON public.chapter_records(record_id);

-- First backfill the chapter record_ids array, preserving its order.
INSERT INTO public.chapter_records (chapter_id, record_id, position)
SELECT
  c.id,
  source.record_id,
  source.position::INT
FROM public.chapters c
CROSS JOIN LATERAL unnest(c.record_ids) WITH ORDINALITY AS source(record_id, position)
JOIN public.records r ON r.id = source.record_id AND r.project_id = c.project_id
ON CONFLICT (chapter_id, record_id) DO NOTHING;

-- Then recover any legacy records.chapter_id relationships missing from the array.
INSERT INTO public.chapter_records (chapter_id, record_id, position)
SELECT
  r.chapter_id,
  r.id,
  100000 + ROW_NUMBER() OVER (
    PARTITION BY r.chapter_id
    ORDER BY r.created_at ASC, r.id
  )::INT
FROM public.records r
JOIN public.chapters c ON c.id = r.chapter_id AND c.project_id = r.project_id
WHERE r.chapter_id IS NOT NULL
ON CONFLICT (chapter_id, record_id) DO NOTHING;

ALTER TABLE public.chapter_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chapter_records_select_own ON public.chapter_records;
CREATE POLICY chapter_records_select_own ON public.chapter_records
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.projects p ON p.id = c.project_id
    JOIN public.records r ON r.id = record_id AND r.project_id = c.project_id
    WHERE c.id = chapter_id
      AND p.user_id = auth.uid()
      AND r.user_id = auth.uid()
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
      AND p.user_id = auth.uid()
      AND r.user_id = auth.uid()
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
    WHERE c.id = chapter_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.projects p ON p.id = c.project_id
    JOIN public.records r ON r.id = record_id AND r.project_id = c.project_id
    WHERE c.id = chapter_id
      AND p.user_id = auth.uid()
      AND r.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS chapter_records_delete_own ON public.chapter_records;
CREATE POLICY chapter_records_delete_own ON public.chapter_records
FOR DELETE USING (
  EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.projects p ON p.id = c.project_id
    WHERE c.id = chapter_id AND p.user_id = auth.uid()
  )
);
