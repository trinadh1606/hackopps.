-- Add is_group field to conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT FALSE;

-- Update existing conversations based on participant count
UPDATE conversations
SET is_group = (
  SELECT COUNT(*) > 2
  FROM participants
  WHERE participants.conversation_id = conversations.id
);

-- Add media fields to messages table (some already exist)
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'audio', 'video')),
ADD COLUMN IF NOT EXISTS media_alt_text TEXT;

-- Create storage buckets for media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('message-images', 'message-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('message-audio', 'message-audio', false, 10485760, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm']),
  ('message-videos', 'message-videos', false, 52428800, ARRAY['video/mp4', 'video/webm', 'video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for message-images bucket
CREATE POLICY "Users can view images in their conversations"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'message-images' AND
  EXISTS (
    SELECT 1 FROM messages m
    INNER JOIN participants p ON p.conversation_id = m.conversation_id
    WHERE m.media_url = storage.objects.name AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload images to their conversations"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage RLS policies for message-audio bucket
CREATE POLICY "Users can view audio in their conversations"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'message-audio' AND
  EXISTS (
    SELECT 1 FROM messages m
    INNER JOIN participants p ON p.conversation_id = m.conversation_id
    WHERE m.media_url = storage.objects.name AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload audio to their conversations"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage RLS policies for message-videos bucket
CREATE POLICY "Users can view videos in their conversations"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'message-videos' AND
  EXISTS (
    SELECT 1 FROM messages m
    INNER JOIN participants p ON p.conversation_id = m.conversation_id
    WHERE m.media_url = storage.objects.name AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload videos to their conversations"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add pinned_at and archived_at fields to conversations for better management
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;