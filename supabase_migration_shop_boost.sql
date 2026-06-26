-- Migration: Shop boosts + advertisement enhancements
-- Run this in Supabase SQL Editor

-- 1. Shop boosts table
CREATE TABLE IF NOT EXISTS shop_boosts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan         TEXT NOT NULL DEFAULT 'starter',
  start_date   TIMESTAMPTZ,
  end_date     TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'pending',
  amount_paid  INTEGER DEFAULT 0,
  admin_notes  TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Extend advertisements table with display metadata
ALTER TABLE advertisements
  ADD COLUMN IF NOT EXISTS link_url  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS title     TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS ad_type   TEXT DEFAULT 'banner';

-- 3. RLS on shop_boosts
ALTER TABLE shop_boosts ENABLE ROW LEVEL SECURITY;

-- Drop policies first to avoid conflicts on re-run
DROP POLICY IF EXISTS "Sellers can read own boosts"   ON shop_boosts;
DROP POLICY IF EXISTS "Sellers can insert own boosts" ON shop_boosts;
DROP POLICY IF EXISTS "Public can read active boosts" ON shop_boosts;

-- Sellers can see and insert their own boosts
CREATE POLICY "Sellers can read own boosts"
  ON shop_boosts FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert own boosts"
  ON shop_boosts FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Everyone can see active boosts (for FeaturedShopsSection)
CREATE POLICY "Public can read active boosts"
  ON shop_boosts FOR SELECT
  USING (status = 'active' AND end_date > NOW());

-- 4. Index for active boosts
CREATE INDEX IF NOT EXISTS idx_shop_boosts_active
  ON shop_boosts (status, end_date)
  WHERE status = 'active';
