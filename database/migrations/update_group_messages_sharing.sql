-- Add sharing columns to group_messages table
ALTER TABLE public.group_messages
ADD COLUMN IF NOT EXISTS shared_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS shared_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS shared_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Optional: Add constraint to ensure only one type of content is shared per message (clean data)
-- We won't enforce strict check for now to be flexible, but usually good practice.
