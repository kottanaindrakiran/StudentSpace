-- Setup Follows and Messages with Mutual Follow Constraint

-- 1. Create 'follows' table
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- 2. Enable RLS on 'follows'
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for 'follows'

-- Allow users to follow others (Insert)
-- Optional: Enforce same campus/college check here if desired, 
-- but usually UI enforcement is enough for "soft" rules. 
-- User requested "when same campus students can follow", which implies others *can't*.
-- Let's add a strict Policy check for same College & Campus to be safe/strict as requested.
DROP POLICY IF EXISTS "Users can follow same campus students" ON public.follows;
CREATE POLICY "Users can follow same campus students"
ON public.follows FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = follower_id
    AND EXISTS (
        SELECT 1 FROM public.users u1, public.users u2
        WHERE u1.id = follower_id
        AND u2.id = following_id
        AND u1.college = u2.college
        AND u1.campus = u2.campus
    )
);

-- Allow users to unfollow (Delete their own follow)
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow"
ON public.follows FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

-- Allow users to see who they follow and who follows them
DROP POLICY IF EXISTS "Users can view follows" ON public.follows;
CREATE POLICY "Users can view follows"
ON public.follows FOR SELECT
TO authenticated
USING (
    auth.uid() = follower_id OR auth.uid() = following_id
);


-- 4. Create/Update 'messages' table constraint (Mutual Follow)
-- We assume 'messages' might already exist from previous steps or manual setup.
-- If not, create it.
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS for Messages (Strict Mutual Follow)

-- Allow View: Sender or Receiver
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
CREATE POLICY "Users can view their messages"
ON public.messages FOR SELECT
TO authenticated
USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Allow Insert: Only if Mutual Follow exists
DROP POLICY IF EXISTS "Users can send messages if mutual follow" ON public.messages;
CREATE POLICY "Users can send messages if mutual follow"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
        -- Check if Sender follows Receiver
        SELECT 1 FROM public.follows f1
        WHERE f1.follower_id = sender_id AND f1.following_id = receiver_id
    )
    AND EXISTS (
        -- Check if Receiver follows Sender
        SELECT 1 FROM public.follows f2
        WHERE f2.follower_id = receiver_id AND f2.following_id = sender_id
    )
);
