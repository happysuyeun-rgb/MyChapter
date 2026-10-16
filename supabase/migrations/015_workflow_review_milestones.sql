-- GAP-005: persist explicit review milestones; additive, no legacy cleanup.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS manuscript_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS final_review_completed_at TIMESTAMPTZ;
