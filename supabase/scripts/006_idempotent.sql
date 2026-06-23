-- MyChapter 006 — idempotent (부분 적용·재실행용)
-- 원본: migrations/006_published_pdfs_storage.sql

INSERT INTO storage.buckets (id, name, public)
VALUES ('published-pdfs', 'published-pdfs', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS published_pdfs_select_own ON storage.objects;
CREATE POLICY published_pdfs_select_own ON storage.objects
  FOR SELECT USING (
    bucket_id = 'published-pdfs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS published_pdfs_delete_own ON storage.objects;
CREATE POLICY published_pdfs_delete_own ON storage.objects
  FOR DELETE USING (
    bucket_id = 'published-pdfs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
