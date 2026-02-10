-- Add user_id column to groups and adhkar tables
ALTER TABLE groups ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE adhkar ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_adhkar_user_id ON adhkar(user_id);
