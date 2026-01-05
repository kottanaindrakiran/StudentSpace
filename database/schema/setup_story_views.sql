-- 1. Create 'story_views' table
CREATE TABLE IF NOT EXISTS public.story_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
    viewer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, viewer_id)
);

-- 2. Enable RLS
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Allow users to record their own view
CREATE POLICY "Users can record their own views" 
ON public.story_views FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = viewer_id);

-- Allow story owners to see who viewed their story
CREATE POLICY "Story owners can see viewers" 
ON public.story_views FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.stories 
        WHERE id = story_views.story_id 
        AND user_id = auth.uid()
    )
);

-- Allow users to see their own views (optional, good for debugging)
CREATE POLICY "Users can see their own views" 
ON public.story_views FOR SELECT 
TO authenticated 
USING (auth.uid() = viewer_id);
