-- Storage bucket for published PDF books
INSERT INTO storage.buckets (id, name, public)
VALUES ('published-pdfs', 'published-pdfs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY published_pdfs_select_own ON storage.objects
  FOR SELECT USING (
    bucket_id = 'published-pdfs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY published_pdfs_delete_own ON storage.objects
  FOR DELETE USING (
    bucket_id = 'published-pdfs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
