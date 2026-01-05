-- Make chat-attachments bucket public so getPublicUrl works
UPDATE storage.buckets
SET public = true
WHERE id = 'chat-attachments';

-- Ensure policies allow public access if needed, or keep it authenticated
-- For public buckets, usually we want public read access for the images to load in <img> tags cleanly
CREATE POLICY "Public Access to Chat Attachments"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'chat-attachments' );
