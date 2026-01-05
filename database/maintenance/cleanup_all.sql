-- DANGER: This script will DELETE ALL DATA from the application.
-- Run this in Supabase Dashboard > SQL Editor to reset the database.

DO $$
BEGIN
    RAISE NOTICE 'Starting full cleanup...';

    -- 1. Delete ALL Storage Objects (Avatars & Documents)
    -- This removes files from 'avatars' and 'verification-documents' buckets
    DELETE FROM storage.objects;
    RAISE NOTICE 'Deleted all storage objects';

    -- 2. Delete ALL Application Data (Order matters for Foreign Keys)
    -- We use DELETE instead of TRUNCATE to avoid permission issues with RLS in some setups,
    -- but usually TRUNCATE cascade is better. managing via DELETE for safety here.
    
    DELETE FROM public.comments;
    DELETE FROM public.likes;
    DELETE FROM public.messages;
    DELETE FROM public.follows;
    DELETE FROM public.posts;
    DELETE FROM public.projects;
    RAISE NOTICE 'Deleted all content (posts, comments, etc.)';

    -- 3. Delete ALL User Profiles
    DELETE FROM public.users;
    RAISE NOTICE 'Deleted all user profiles';

    -- 4. Delete ALL Auth Users (The actual accounts)
    DELETE FROM auth.users;
    RAISE NOTICE 'Deleted all auth accounts';

    RAISE NOTICE 'Full cleanup complete. Ready for fresh testing.';
END $$;
