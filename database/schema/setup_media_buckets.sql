-- Setup 'post-media' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Setup 'project-files' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Enable RLS (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Reset Policies for post-media
DROP POLICY IF EXISTS "Public Access post-media" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload post-media" ON storage.objects;
DROP POLICY IF EXISTS "Auth update post-media" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete post-media" ON storage.objects;

CREATE POLICY "Public Access post-media" ON storage.objects FOR SELECT USING ( bucket_id = 'post-media' );
CREATE POLICY "Auth upload post-media" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'post-media' );
CREATE POLICY "Auth update post-media" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'post-media' AND auth.uid() = owner );
CREATE POLICY "Auth delete post-media" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'post-media' AND auth.uid() = owner );

-- Reset Policies for project-files
DROP POLICY IF EXISTS "Public Access project-files" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload project-files" ON storage.objects;
DROP POLICY IF EXISTS "Auth update project-files" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete project-files" ON storage.objects;

CREATE POLICY "Public Access project-files" ON storage.objects FOR SELECT USING ( bucket_id = 'project-files' );
CREATE POLICY "Auth upload project-files" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'project-files' );
CREATE POLICY "Auth update project-files" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'project-files' AND auth.uid() = owner );
CREATE POLICY "Auth delete project-files" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'project-files' AND auth.uid() = owner );
