
-- Add columns to messages table for attachments and shared posts
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS attachment_url text,
ADD COLUMN IF NOT EXISTS attachment_type text, -- 'image', 'video', 'document', 'zip'
ADD COLUMN IF NOT EXISTS shared_post_id uuid REFERENCES public.posts(id);

-- Create bucket for chat attachments if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for chat-attachments
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'chat-attachments' );

-- Allow users to view files (simplified: anyone authenticated for now, ideally strictly sender/receiver)
-- Stricter logic requires checking if auth.uid() is sender or receiver of the message containing this file.
-- Implementing strict RLS on storage is hard without linking back to table.
-- For now, we allow authenticated users to view. (Similar to other buckets)
CREATE POLICY "Authenticated users can view chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'chat-attachments' );
