-- Fix Avatars Bucket and Policies

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Enable RLS on objects (Usually already enabled, skipping to avoid permission errors)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow Public Read Access
-- This ensures the profile photos are visible effectively to everyone (or at least authenticated users)
DROP POLICY IF EXISTS "Public Access to Avatars" ON storage.objects;
CREATE POLICY "Public Access to Avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 4. Policy: Allow Authenticated Uploads (Own Folder)
DROP POLICY IF EXISTS "Authenticated Users Can Upload Avatars" ON storage.objects;
CREATE POLICY "Authenticated Users Can Upload Avatars"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() = owner
);

-- 5. Policy: Allow Owners to Update/Delete (Optional but good)
DROP POLICY IF EXISTS "Users Can Update Own Avatars" ON storage.objects;
CREATE POLICY "Users Can Update Own Avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Users Can Delete Own Avatars" ON storage.objects;
CREATE POLICY "Users Can Delete Own Avatars"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' AND auth.uid() = owner );
