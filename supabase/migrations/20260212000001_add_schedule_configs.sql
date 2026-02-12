-- Table to store the effective configuration (active items) for a user starting from a specific date.
-- This allows "Time Travel" for settings: seeing exactly what was active on a past date.
CREATE TABLE IF NOT EXISTS user_schedule_configs (
    user_id TEXT NOT NULL,
    valid_from DATE NOT NULL,
    active_group_ids JSONB DEFAULT '[]'::jsonb,
    active_dhikr_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, valid_from)
);

-- Index for finding the "effective" config (latest date <= query date)
CREATE INDEX IF NOT EXISTS idx_user_configs_lookup ON user_schedule_configs(user_id, valid_from DESC);

-- Add deleted_at to supporting tables for Soft Deletes instead of Hard Deletes
ALTER TABLE groups ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE adhkar ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
