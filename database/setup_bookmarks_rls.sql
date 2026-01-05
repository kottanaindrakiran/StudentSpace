-- Setup Bookmarks Table and RLS
-- Ensures the 'Saved' feature works by allowing users to insert/delete their own bookmarks

-- 1. Create table if missing (idempotent)
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id) -- Prevent duplicate saves
);

-- 2. Enable RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can add their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can remove their own bookmarks" ON public.bookmarks;

-- 4. Create Policies

-- VIEW: Users can see only their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON public.bookmarks FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Users can save posts
CREATE POLICY "Users can add their own bookmarks"
ON public.bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can unsave posts
CREATE POLICY "Users can remove their own bookmarks"
ON public.bookmarks FOR DELETE
USING (auth.uid() = user_id);
