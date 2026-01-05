-- Setup 'verification-documents' bucket
-- Note: This bucket should be PRIVATE (public = false) because it contains sensitive ID docs.
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Policies for verification-documents
-- Note: We use "DROP POLICY IF EXISTS" to avoid conflicts, but if you get an error about "ownership",
-- it might be because a policy exists that you didn't create. In that case, you can ignore the drop
-- and just ensure the CREATE matches, or run this as a superuser.

DROP POLICY IF EXISTS "Users can view their own docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own docs" ON storage.objects;

-- SELECT: Only owner can view
CREATE POLICY "Users can view their own docs" ON storage.objects
FOR SELECT TO authenticated
USING ( bucket_id = 'verification-documents' AND auth.uid() = owner );

-- INSERT: Authenticated users can upload
CREATE POLICY "Users can upload their own docs" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'verification-documents' );

-- UPDATE: Owner can update
CREATE POLICY "Users can update their own docs" ON storage.objects
FOR UPDATE TO authenticated
USING ( bucket_id = 'verification-documents' AND auth.uid() = owner );

-- DELETE: Owner can delete
CREATE POLICY "Users can delete their own docs" ON storage.objects
FOR DELETE TO authenticated
USING ( bucket_id = 'verification-documents' AND auth.uid() = owner );
