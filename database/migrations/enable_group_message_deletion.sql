-- Drop policies if they already exist to avoid errors
DROP POLICY IF EXISTS "Users can delete their own group messages" ON public.group_messages;
DROP POLICY IF EXISTS "Admins can delete any group message" ON public.group_messages;

-- Allow users to delete their own group messages
CREATE POLICY "Users can delete their own group messages"
ON public.group_messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- Allow Group Admins to delete any message in their group
CREATE POLICY "Admins can delete any group message"
ON public.group_messages
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.groups
        WHERE id = group_id
        AND created_by = auth.uid()
    )
);
