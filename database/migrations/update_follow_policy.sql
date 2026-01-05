-- Relax Follow Policy

-- The user wants to allow following "Same College" (not just same campus)
-- AND implies "Other College following" might be desired too.
-- To allow "Instagram-like" behavior where you can follow anyone, we should drop the strict "Same Campus" check on INSERT.
-- Chat will still remain restricted to "Mutual Follows".

-- 1. Drop the strict policy
DROP POLICY IF EXISTS "Users can follow same campus students" ON public.follows;

-- 2. Create a generic "Authenticated users can follow anyone" policy
-- OR if we want to restrict to "Same College" only:
--    AND u1.college = u2.college
-- But "add in profile other college following" suggests we might want to allow following *anyone*.
-- Let's stick to "Same College" first as explicitly requested ("add same college also").
-- Actually, if they want "Other College following", that means *Anyone*.
-- Let's make it OPEN for now (Authenticated users can follow authenticated users).

CREATE POLICY "Users can follow anyone"
ON public.follows FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = follower_id
    -- No stricter check on following_id's college/campus. 
    -- If we want to restrict later, we can add it back.
);

-- Ensure Mutual Follow Chat still works (it uses the 'follows' table, so logic remains same).
-- Verify Chat Policy (No change needed, it relies on existence of rows in 'follows').
