-- Re-apply policies to ensure cleanliness
-- No changes to schema, just confirming policies exists.
-- Sometimes ambiguous column names in RLS can cause issues?
-- "follower_id" and "following_id" are distinct.
-- "auth.uid()" is standard.

-- Let's drop and recreate the SELECT policy just in case of any weird state.
DROP POLICY IF EXISTS "Users can view who they follow and who follows them" ON public.follows;

CREATE POLICY "Users can view who they follow and who follows them"
ON public.follows FOR SELECT
TO authenticated
USING (
    auth.uid() = follower_id OR auth.uid() = following_id
);
