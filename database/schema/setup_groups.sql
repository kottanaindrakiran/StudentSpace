-- Create Groups Table
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('my-college', 'other-colleges')) NOT NULL,
    college TEXT, -- populated for 'my-college' type
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Group RLS Policies

-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS "View groups policy" ON public.groups;
DROP POLICY IF EXISTS "Create groups policy" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can update their groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can delete their groups" ON public.groups;

-- View Groups:
-- 'my-college': Visible if user.college matches group.college
-- 'other-colleges': Visible to everyone (or logic can be refined)
CREATE POLICY "View groups policy" ON public.groups
FOR SELECT
TO authenticated
USING (
  (type = 'my-college' AND college = (SELECT college FROM public.users WHERE id = auth.uid()))
  OR
  (type = 'other-colleges')
);

-- Create/Insert Groups:
CREATE POLICY "Authenticated users can create groups"
ON public.groups FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Update Groups:
CREATE POLICY "Admins can update their groups"
ON public.groups FOR UPDATE
USING (auth.uid() = created_by);

-- Delete Groups:
CREATE POLICY "Admins can delete their groups"
ON public.groups FOR DELETE
USING (auth.uid() = created_by);


-- Create Group Members Table
CREATE TABLE IF NOT EXISTS public.group_members (
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Group Members Policies

-- Drop existing policies
DROP POLICY IF EXISTS "View group members" ON public.group_members;
DROP POLICY IF EXISTS "Join group policy" ON public.group_members;
DROP POLICY IF EXISTS "Admins can add members" ON public.group_members;
DROP POLICY IF EXISTS "Admins can remove members" ON public.group_members;


-- View Members: Visible to all authenticated users (simplified for searchability)
CREATE POLICY "View group members" ON public.group_members
FOR SELECT
TO authenticated
USING (true);

-- Insert Members (Join or Add):
CREATE POLICY "Admins can add members" ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (
    -- Case 1: Admin adding someone (Creator of the group)
    EXISTS (
        SELECT 1 FROM public.groups
        WHERE id = group_id
        AND created_by = auth.uid()
    )
    OR
    -- Case 2: User joining themselves
    (
        user_id = auth.uid()
        AND EXISTS (
             SELECT 1 FROM public.groups g
             WHERE g.id = group_id
             AND (
                 (g.type = 'my-college' AND g.college = (SELECT college FROM public.users WHERE id = auth.uid()))
                 OR
                 g.type = 'other-colleges'
             )
        )
    )
);

-- Delete Members (Leave or Remove):
CREATE POLICY "Admins can remove members" ON public.group_members
FOR DELETE
TO authenticated
USING (
    -- Case 1: Admin removing someone
    EXISTS (
        SELECT 1 FROM public.groups
        WHERE id = group_id
        AND created_by = auth.uid()
    )
    OR
    -- Case 2: User leaving
    user_id = auth.uid()
);


-- Create Group Messages Table
CREATE TABLE IF NOT EXISTS public.group_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    type TEXT CHECK (type IN ('text', 'image', 'file')) DEFAULT 'text',
    media_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Group Messages Policies

-- Drop existing policies
DROP POLICY IF EXISTS "View group messages" ON public.group_messages;
DROP POLICY IF EXISTS "Send group messages" ON public.group_messages;

-- View: Only members can view messages
CREATE POLICY "View group messages" ON public.group_messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = group_id
        AND gm.user_id = auth.uid()
    )
);

-- Send: Only members can send
CREATE POLICY "Send group messages" ON public.group_messages
FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid()
    AND
    EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = group_id
        AND gm.user_id = auth.uid()
    )
);
