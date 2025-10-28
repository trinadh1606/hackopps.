-- Add is_demo column to conversations table
ALTER TABLE conversations ADD COLUMN is_demo BOOLEAN DEFAULT false;

-- Add index for filtering demo conversations
CREATE INDEX idx_conversations_is_demo ON conversations(is_demo) WHERE is_demo = true;