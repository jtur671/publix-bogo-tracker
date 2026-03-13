-- Add user_id columns and RLS policies for auth

-- ============================================================
-- watchlist
-- ============================================================
ALTER TABLE watchlist
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill existing rows is not needed (fresh app).
-- Make user_id required going forward.
ALTER TABLE watchlist ALTER COLUMN user_id SET NOT NULL;

-- Drop old unique constraint and add user-scoped one
ALTER TABLE watchlist DROP CONSTRAINT IF EXISTS watchlist_keyword_key;
ALTER TABLE watchlist ADD CONSTRAINT watchlist_user_keyword_key UNIQUE (user_id, keyword);

CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);

-- RLS
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON watchlist;
DROP POLICY IF EXISTS "Allow all access to watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users manage own watchlist" ON watchlist;
CREATE POLICY "Users manage own watchlist" ON watchlist
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- settings
-- ============================================================
-- Convert settings from int PK single-row to uuid PK per-user
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE settings
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the old id column and use uuid
ALTER TABLE settings DROP COLUMN id;
ALTER TABLE settings ADD COLUMN id uuid DEFAULT gen_random_uuid() PRIMARY KEY;

ALTER TABLE settings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE settings ADD CONSTRAINT settings_user_id_key UNIQUE (user_id);

CREATE INDEX idx_settings_user_id ON settings(user_id);

-- RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON settings;
DROP POLICY IF EXISTS "Allow all access to settings" ON settings;
DROP POLICY IF EXISTS "Users manage own settings" ON settings;
CREATE POLICY "Users manage own settings" ON settings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- push_subscriptions
-- ============================================================
ALTER TABLE push_subscriptions
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON push_subscriptions;
DROP POLICY IF EXISTS "Allow all access to push_subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users manage own subscriptions" ON push_subscriptions;
CREATE POLICY "Users manage own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- shopping_trips (new table — localStorage only for MVP,
-- but create schema for future migration)
-- ============================================================
CREATE TABLE IF NOT EXISTS shopping_trips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_shopping_trips_user_id ON shopping_trips(user_id);

ALTER TABLE shopping_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own trips" ON shopping_trips
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- shopping_trip_items (new table)
-- ============================================================
CREATE TABLE IF NOT EXISTS shopping_trip_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES shopping_trips(id) ON DELETE CASCADE,
  name text NOT NULL,
  checked boolean DEFAULT false,
  checked_at timestamptz,
  has_bogo boolean DEFAULT false,
  added_at timestamptz DEFAULT now()
);

CREATE INDEX idx_shopping_trip_items_trip_id ON shopping_trip_items(trip_id);

ALTER TABLE shopping_trip_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own trip items" ON shopping_trip_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shopping_trips
      WHERE shopping_trips.id = shopping_trip_items.trip_id
        AND shopping_trips.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_trips
      WHERE shopping_trips.id = shopping_trip_items.trip_id
        AND shopping_trips.user_id = auth.uid()
    )
  );
