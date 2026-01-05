-- Run this in Supabase Dashboard > SQL Editor
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- 1. Get the User ID
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'ik9846@srmist.edu.in';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User not found!';
        RETURN;
    END IF;

    RAISE NOTICE 'Found User ID: %, Deleting...', target_user_id;

    -- 2. Delete Uploaded Files (Storage)
    -- This is the most common cause of "Database error" during deletion
    DELETE FROM storage.objects WHERE owner = target_user_id;

    -- 3. Delete App Data (Public Tables)
    DELETE FROM public.comments WHERE user_id = target_user_id;
    DELETE FROM public.likes WHERE user_id = target_user_id;
    DELETE FROM public.posts WHERE user_id = target_user_id;
    DELETE FROM public.projects WHERE user_id = target_user_id;
    DELETE FROM public.messages WHERE sender_id = target_user_id OR receiver_id = target_user_id;
    DELETE FROM public.follows WHERE follower_id = target_user_id OR following_id = target_user_id;
    
    -- 4. Delete Profile (Public Users)
    DELETE FROM public.users WHERE id = target_user_id;

    -- 5. Delete Account (Auth Users)
    DELETE FROM auth.users WHERE id = target_user_id;
    
    RAISE NOTICE 'Successfully deleted user ik9846@srmist.edu.in';
END $$;
