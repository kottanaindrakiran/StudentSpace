-- Backfill Projects into Posts table
-- This ensures existing projects appear in the Home Feed

INSERT INTO public.posts (
    user_id,
    caption,
    media_url,
    media_urls,
    post_type,
    created_at
)
SELECT 
    p.user_id,
    p.project_title || E'\n\n' || COALESCE(p.description, ''),
    p.zip_file_url,
    ARRAY[p.zip_file_url], -- Store as array for media_urls
    'project',
    p.created_at
FROM 
    public.projects p
WHERE 
    NOT EXISTS (
        SELECT 1 FROM public.posts post 
        WHERE post.user_id = p.user_id 
        AND post.post_type = 'project'
        AND post.media_url = p.zip_file_url
    );
