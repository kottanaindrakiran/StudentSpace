-- Add shared_project_id to messages table
ALTER TABLE public.messages
ADD COLUMN shared_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- Add constraint to ensure a message doesn't share both a post and a project (optional but clean)
ALTER TABLE public.messages ADD CONSTRAINT messages_share_check CHECK (
  (shared_post_id IS NULL OR shared_project_id IS NULL)
);
