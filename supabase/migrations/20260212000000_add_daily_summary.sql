-- Create daily_completion_summary table
CREATE TABLE IF NOT EXISTS daily_completion_summary (
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    completion_percentage INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, date)
);

-- Index for fast range queries
CREATE INDEX IF NOT EXISTS idx_daily_summary_user_date ON daily_completion_summary(user_id, date);
