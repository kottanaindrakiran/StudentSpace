-- Allow new post types in the check constraint
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_post_type_check;

ALTER TABLE public.posts
ADD CONSTRAINT posts_post_type_check
CHECK (post_type IN (
    'academic', 
    'event', 
    'campus-life', 
    'project', 
    'alumni',
    'college-days',
    'career-updates',
    'mentorship'
));
