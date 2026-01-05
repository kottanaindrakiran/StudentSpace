-- Fix Post Deletion Issues (Comprehensive V2)

-- 1. Ensure RLS Policy for Deletion exists
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

CREATE POLICY "Users can delete their own posts"
    ON public.posts FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Likes: Cascade Delete
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'likes_post_id_fkey' AND table_name = 'likes') THEN
        ALTER TABLE public.likes DROP CONSTRAINT likes_post_id_fkey;
    END IF;
END $$;
ALTER TABLE public.likes ADD CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- 3. Comments: Cascade Delete
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'comments_post_id_fkey' AND table_name = 'comments') THEN
        ALTER TABLE public.comments DROP CONSTRAINT comments_post_id_fkey;
    END IF;
END $$;
ALTER TABLE public.comments ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- 4. Bookmarks: Cascade Delete
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'bookmarks_post_id_fkey' AND table_name = 'bookmarks') THEN
        ALTER TABLE public.bookmarks DROP CONSTRAINT bookmarks_post_id_fkey;
    END IF;
END $$;
ALTER TABLE public.bookmarks ADD CONSTRAINT bookmarks_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- 5. MESSAGES (Shared Posts): Set Null on Delete (CRITICAL FIX)
-- The error 409 is likely because a post is shared in a chat message
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'messages_shared_post_id_fkey' AND table_name = 'messages') THEN
        ALTER TABLE public.messages DROP CONSTRAINT messages_shared_post_id_fkey;
    END IF;
END $$;
-- Re-add with SET NULL so message affects are removed but chat remains
ALTER TABLE public.messages 
    DROP CONSTRAINT IF EXISTS messages_shared_post_id_fkey, -- Double check removal
    ADD CONSTRAINT messages_shared_post_id_fkey 
    FOREIGN KEY (shared_post_id) 
    REFERENCES public.posts(id) 
    ON DELETE SET NULL;
