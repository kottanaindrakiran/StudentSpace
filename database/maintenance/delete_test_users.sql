-- Run this in your Supabase Dashboard > SQL Editor

-- 1. Delete profiles from the public table
DELETE FROM public.users 
WHERE email LIKE '%@gmail.com';

-- 2. Delete the actual authentication accounts
-- This is required to allow you to sign up with the same email again
DELETE FROM auth.users 
WHERE email LIKE '%@gmail.com';
