-- Add 'icon' column to 'adhkar' table if it doesn't exist
ALTER TABLE adhkar ADD COLUMN IF NOT EXISTS icon TEXT;

-- Also verify sort_order column
ALTER TABLE adhkar ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 999;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 999;
