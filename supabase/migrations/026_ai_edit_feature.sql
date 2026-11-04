-- 026: AI edit usage tracking (R-06 / R-10, PD-017: Free 3 per month).
-- Must be applied before deploying the `edit-chapter` Edge Function.
ALTER TYPE ai_feature ADD VALUE IF NOT EXISTS 'ai_edit';
