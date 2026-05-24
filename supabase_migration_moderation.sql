-- Migration: AI moderation columns on listings table
-- Run this in Supabase SQL Editor

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS moderation_flags    TEXT[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS moderation_reason   TEXT      DEFAULT '',
  ADD COLUMN IF NOT EXISTS moderation_risk     TEXT      DEFAULT 'low';

-- Add 'pending_review' as a valid status (if using an enum, alter it)
-- If status is a plain TEXT column, no change needed.

-- Index for admin queries on flagged listings
CREATE INDEX IF NOT EXISTS idx_listings_moderation_risk
  ON listings (moderation_risk)
  WHERE moderation_risk IN ('medium', 'high');

CREATE INDEX IF NOT EXISTS idx_listings_pending_review
  ON listings (status)
  WHERE status = 'pending_review';
