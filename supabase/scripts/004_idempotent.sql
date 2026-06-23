-- MyChapter 004 — idempotent (부분 적용·재실행용)
-- 원본: migrations/004_notifications_insert.sql

DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;
CREATE POLICY notifications_insert_own ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('record-photos', 'record-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS record_photos_select_own ON storage.objects;
CREATE POLICY record_photos_select_own ON storage.objects
  FOR SELECT USING (
    bucket_id = 'record-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS record_photos_insert_own ON storage.objects;
CREATE POLICY record_photos_insert_own ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'record-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS record_photos_delete_own ON storage.objects;
CREATE POLICY record_photos_delete_own ON storage.objects
  FOR DELETE USING (
    bucket_id = 'record-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
