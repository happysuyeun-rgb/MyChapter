-- Expand MY CHAPTER project themes while preserving legacy project values.
-- Apply after the initial schema migration.

ALTER TYPE project_type ADD VALUE IF NOT EXISTS 'growth';
ALTER TYPE project_type ADD VALUE IF NOT EXISTS 'life_story';
ALTER TYPE project_type ADD VALUE IF NOT EXISTS 'relationships';
ALTER TYPE project_type ADD VALUE IF NOT EXISTS 'travel';
ALTER TYPE project_type ADD VALUE IF NOT EXISTS 'hobby';
ALTER TYPE project_type ADD VALUE IF NOT EXISTS 'learning';
