-- Create the verification-documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload their own verification documents
CREATE POLICY "Allow authenticated users to upload verification documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'verification-documents' AND auth.uid() = owner );

-- Policy to allow users to read their own documents (if needed, but mostly for backend)
CREATE POLICY "Allow users to read their own verification documents"
ON storage.objects
FOR SELECT
TO authenticated
USING ( bucket_id = 'verification-documents' AND auth.uid() = owner );

-- Policy for backend service role (full access) - usually implicit but good to be handled if needed
-- Note: Service role bypasses RLS, so this might not be strictly necessary if using service key.
