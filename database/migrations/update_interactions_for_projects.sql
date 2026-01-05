-- Add project_id to likes table
ALTER TABLE public.likes 
ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

-- Allow post_id to be null (if it isn't already, usually it's set to not null)
ALTER TABLE public.likes ALTER COLUMN post_id DROP NOT NULL;

-- Add constraint to ensure either post_id or project_id is present, but not both (optional, but good practice)
-- removing "not both" constraint for simplicity, just ensuring at least one.
ALTER TABLE public.likes ADD CONSTRAINT likes_target_check CHECK (
  (post_id IS NOT NULL AND project_id IS NULL) OR 
  (post_id IS NULL AND project_id IS NOT NULL)
);

-- Add project_id to comments table
ALTER TABLE public.comments 
ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

-- Allow post_id to be null
ALTER TABLE public.comments ALTER COLUMN post_id DROP NOT NULL;

-- Add constraint for comments
ALTER TABLE public.comments ADD CONSTRAINT comments_target_check CHECK (
  (post_id IS NOT NULL AND project_id IS NULL) OR 
  (post_id IS NULL AND project_id IS NOT NULL)
);

-- Update RLS policies if necessary (assuming existing policies cover "auth user can select/insert", they might rely on post existence)
-- Check existing policies on likes/comments via dashboard if possible, but usually generic "user can insert their own like" works.
