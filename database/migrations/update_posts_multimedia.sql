-- Add media_urls column to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_urls text[];

-- Migrate existing media_url to media_urls[1]
UPDATE public.posts 
SET media_urls = ARRAY[media_url] 
WHERE media_url IS NOT NULL AND media_urls IS NULL;

-- Create policy for Project Files bucket if not exists (re-stating for safety)
-- Assuming 'project-files' bucket is already created or will be handled.
