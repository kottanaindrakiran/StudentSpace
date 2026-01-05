-- Add shared_user_id to messages table for profile sharing
ALTER TABLE public.messages
ADD COLUMN shared_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Update constraint to ensure a message shares only one thing (optional, good for data integrity)
-- Note: Postgres constraints can be tricky to update if existing data violates, but here we just added columns.
-- We can add a check constraint if we want, but for now just adding the column is sufficient.
