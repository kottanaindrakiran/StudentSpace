-- Create story_likes table
CREATE TABLE IF NOT EXISTS public.story_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(story_id, user_id)
);

-- Enable RLS
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view story likes"
    ON public.story_likes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can like stories"
    ON public.story_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
    ON public.story_likes FOR DELETE
    USING (auth.uid() = user_id);
