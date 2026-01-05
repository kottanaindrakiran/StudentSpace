-- Drop existing table to fix Schema references
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Create Notifications Table (Corrected References to public.users)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL, -- Recipient
    actor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL, -- Sender (Follower)
    type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'message')),
    title TEXT,
    content TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark read)"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger Function: Notify on Follow
CREATE OR REPLACE FUNCTION public.handle_new_follow()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, actor_id, type, title, content, link)
    VALUES (
        NEW.following_id,   -- Recipient is the person being followed
        NEW.follower_id,    -- Actor is the follower
        'follow',
        'New Follower',
        'started following you.',
        '/feed/profile/' || NEW.follower_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: After Follow Insert
DROP TRIGGER IF EXISTS on_follow_created ON public.follows;
CREATE TRIGGER on_follow_created
AFTER INSERT ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_follow();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
