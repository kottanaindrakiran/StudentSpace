-- 1. Create 'stories' table
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT CHECK (media_type IN ('image', 'video')) NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- 2. Enable RLS on stories
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- 3. Create 'story-media' bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('story-media', 'story-media', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. RLS for 'stories' table
-- READ: Visible if (is_owner OR is_follower)
-- Note: "Mutuals" logic is complex in simple RLS. For now, "Followers" is standard. 
-- Refining to: Visible if you follow the author.
CREATE POLICY "Stories are visible to followers" 
ON public.stories FOR SELECT 
TO authenticated 
USING (
    auth.uid() = user_id -- Owner
    OR 
    EXISTS (
        SELECT 1 FROM public.follows 
        WHERE follower_id = auth.uid() 
        AND following_id = stories.user_id
    )
);

CREATE POLICY "Users can insert their own stories" 
ON public.stories FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" 
ON public.stories FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 5. RLS for 'story-media' bucket
CREATE POLICY "Public Read story-media" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'story-media');

CREATE POLICY "Auth Upload story-media" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'story-media' AND auth.uid() = owner);

CREATE POLICY "Auth Delete story-media" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'story-media' AND auth.uid() = owner);
