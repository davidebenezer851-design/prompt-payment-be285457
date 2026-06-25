
CREATE POLICY "att read authed" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'attachments');
CREATE POLICY "att insert own" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "att delete own" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]
  );
