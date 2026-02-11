-- Enable RLS for all tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE adhkar ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- 1. Groups Policies
DROP POLICY IF EXISTS "Users can select own groups" ON groups;
CREATE POLICY "Users can select own groups" ON groups FOR SELECT
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own groups" ON groups;
CREATE POLICY "Users can insert own groups" ON groups FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own groups" ON groups;
CREATE POLICY "Users can update own groups" ON groups FOR UPDATE
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own groups" ON groups;
CREATE POLICY "Users can delete own groups" ON groups FOR DELETE
USING (auth.uid()::text = user_id);

-- 2. Adhkar Policies
DROP POLICY IF EXISTS "Users can select own adhkar" ON adhkar;
CREATE POLICY "Users can select own adhkar" ON adhkar FOR SELECT
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own adhkar" ON adhkar;
CREATE POLICY "Users can insert own adhkar" ON adhkar FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own adhkar" ON adhkar;
CREATE POLICY "Users can update own adhkar" ON adhkar FOR UPDATE
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own adhkar" ON adhkar;
CREATE POLICY "Users can delete own adhkar" ON adhkar FOR DELETE
USING (auth.uid()::text = user_id);

-- 3. Daily Logs Policies
-- Add user_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_logs' AND column_name = 'user_id') THEN
        ALTER TABLE daily_logs ADD COLUMN user_id TEXT;
    END IF;
END $$;

DROP POLICY IF EXISTS "Users can select own logs" ON daily_logs;
CREATE POLICY "Users can select own logs" ON daily_logs FOR SELECT
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own logs" ON daily_logs;
CREATE POLICY "Users can insert own logs" ON daily_logs FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own logs" ON daily_logs;
CREATE POLICY "Users can update own logs" ON daily_logs FOR UPDATE
USING (auth.uid()::text = user_id);
