-- Add bio and social links columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS github_link TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS linkedin_link TEXT;
