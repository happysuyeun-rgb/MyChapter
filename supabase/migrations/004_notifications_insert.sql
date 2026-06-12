-- Allow users to insert their own badge notifications
CREATE POLICY notifications_insert_own ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage bucket for record photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('record-photos', 'record-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY record_photos_select_own ON storage.objects
  FOR SELECT USING (
    bucket_id = 'record-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY record_photos_insert_own ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'record-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY record_photos_delete_own ON storage.objects
  FOR DELETE USING (
    bucket_id = 'record-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
