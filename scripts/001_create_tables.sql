-- Dhikr Groups table
CREATE TABLE IF NOT EXISTS dhikr_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'moon',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dhikr Items table
CREATE TABLE IF NOT EXISTS dhikr_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES dhikr_groups(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  target INTEGER NOT NULL DEFAULT 33,
  virtue TEXT NOT NULL DEFAULT '',
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily dhikr logs
CREATE TABLE IF NOT EXISTS dhikr_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dhikr_item_id UUID NOT NULL REFERENCES dhikr_items(id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(dhikr_item_id, date)
);

-- Enable RLS
ALTER TABLE dhikr_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE dhikr_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dhikr_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon full access (personal app, no auth)
CREATE POLICY "allow_all_groups" ON dhikr_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_items" ON dhikr_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_logs" ON dhikr_logs FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dhikr_items_group_id ON dhikr_items(group_id);
CREATE INDEX IF NOT EXISTS idx_dhikr_logs_date ON dhikr_logs(date);
CREATE INDEX IF NOT EXISTS idx_dhikr_logs_item_date ON dhikr_logs(dhikr_item_id, date);
