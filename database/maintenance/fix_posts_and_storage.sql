-- 1. Fix Post Type Constraint (Allow all categories)
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_post_type_check;

ALTER TABLE public.posts
ADD CONSTRAINT posts_post_type_check
CHECK (post_type IN ('academic', 'event', 'campus-life', 'project', 'alumni'));

-- 2. Ensure Storage Buckets Exist (Post Media & Project Files)
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', true) ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Storage Policies (Post Media)
DROP POLICY IF EXISTS "Public Access post-media" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload post-media" ON storage.objects;
DROP POLICY IF EXISTS "Auth update post-media" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete post-media" ON storage.objects;

CREATE POLICY "Public Access post-media" ON storage.objects FOR SELECT USING ( bucket_id = 'post-media' );
CREATE POLICY "Auth upload post-media" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'post-media' );
CREATE POLICY "Auth update post-media" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'post-media' AND auth.uid() = owner );
CREATE POLICY "Auth delete post-media" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'post-media' AND auth.uid() = owner );

-- 4. Storage Policies (Project Files)
DROP POLICY IF EXISTS "Public Access project-files" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload project-files" ON storage.objects;
DROP POLICY IF EXISTS "Auth update project-files" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete project-files" ON storage.objects;

CREATE POLICY "Public Access project-files" ON storage.objects FOR SELECT USING ( bucket_id = 'project-files' );
CREATE POLICY "Auth upload project-files" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'project-files' );
CREATE POLICY "Auth update project-files" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'project-files' AND auth.uid() = owner );
CREATE POLICY "Auth delete project-files" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'project-files' AND auth.uid() = owner );
