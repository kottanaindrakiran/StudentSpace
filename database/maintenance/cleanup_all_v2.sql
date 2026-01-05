-- DANGER: This script will DELETE ALL DATA.
-- Robust version: It will not fail even if some tables are missing.

DO $$
BEGIN
    RAISE NOTICE 'Starting robust full cleanup...';

    -- 1. Delete ALL Storage Objects
    BEGIN 
        DELETE FROM storage.objects; 
    EXCEPTION WHEN OTHERS THEN 
        RAISE NOTICE 'Skipping storage cleanup (or bucket missing)'; 
    END;

    -- 2. Delete ALL Application Data (Handling missing tables)
    BEGIN DELETE FROM public.comments; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN DELETE FROM public.likes; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN DELETE FROM public.messages; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN DELETE FROM public.follows; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN DELETE FROM public.posts; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN DELETE FROM public.projects; EXCEPTION WHEN undefined_table THEN NULL; END;

    -- 3. Delete ALL User Profiles
    BEGIN DELETE FROM public.users; EXCEPTION WHEN undefined_table THEN NULL; END;

    -- 4. Delete ALL Auth Users (The actual accounts)
    -- This usually works as auth.users is a system table, but good to wrap it just in case of weird permissions
    BEGIN 
        DELETE FROM auth.users; 
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not delete all auth users (check permissions)';
    END;

    RAISE NOTICE 'Full cleanup complete. Ready for fresh setup.';
END $$;
