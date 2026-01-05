-- Run this in Supabase Dashboard > SQL Editor
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'ik9846@srmist.edu.in';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User not found! (Maybe already deleted?)';
        RETURN;
    END IF;

    RAISE NOTICE 'Found User ID: %, Deleting...', target_user_id;

    -- 1. Delete Storage Objects
    BEGIN 
        DELETE FROM storage.objects WHERE owner = target_user_id; 
    EXCEPTION WHEN undefined_table THEN NULL; 
    END;

    -- 2. Delete App Data (Handling missing tables)
    BEGIN DELETE FROM public.comments WHERE user_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN DELETE FROM public.likes WHERE user_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN DELETE FROM public.posts WHERE user_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN DELETE FROM public.projects WHERE user_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN DELETE FROM public.messages WHERE sender_id = target_user_id OR receiver_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN DELETE FROM public.follows WHERE follower_id = target_user_id OR following_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
    
    -- 3. Delete Profile
    DELETE FROM public.users WHERE id = target_user_id;

    -- 4. Delete Account
    DELETE FROM auth.users WHERE id = target_user_id;
    
    RAISE NOTICE 'Successfully deleted user ik9846@srmist.edu.in';
END $$;
