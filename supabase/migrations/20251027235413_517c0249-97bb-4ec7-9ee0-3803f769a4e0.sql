-- Add guest session tracking
CREATE TABLE IF NOT EXISTS guest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Guest',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  host_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT valid_guest_id CHECK (guest_id ~ '^guest_[a-z0-9]{8}$')
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_guest_sessions_guest_id ON guest_sessions(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_expires ON guest_sessions(expires_at);

-- Add is_guest flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE;

-- Update conversations to track if it's a guest conversation
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_guest_chat BOOLEAN DEFAULT FALSE;

-- RLS Policies for guest_sessions
ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own guest sessions" ON guest_sessions;
CREATE POLICY "Users can view their own guest sessions"
ON guest_sessions FOR SELECT
USING (auth.uid() = host_user_id);

DROP POLICY IF EXISTS "Users can create guest sessions" ON guest_sessions;
CREATE POLICY "Users can create guest sessions"
ON guest_sessions FOR INSERT
WITH CHECK (auth.uid() = host_user_id);

-- Update messages RLS to allow guest messages
DROP POLICY IF EXISTS "Allow guest messages in guest conversations" ON messages;
CREATE POLICY "Allow guest messages in guest conversations"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id AND c.is_guest_chat = TRUE
  )
);

-- Allow guests to read messages in their conversations
DROP POLICY IF EXISTS "Guests can view messages in guest conversations" ON messages;
CREATE POLICY "Guests can view messages in guest conversations"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id AND c.is_guest_chat = TRUE
  )
);

-- Cleanup function for expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_guest_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM guest_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;