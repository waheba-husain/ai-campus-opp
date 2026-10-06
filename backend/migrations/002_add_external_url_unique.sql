-- Migration 002: Add unique constraint on external_url for deduplication
-- Run this in Supabase SQL Editor after 001_initial_schema.sql

-- Drop partial index if it exists
DROP INDEX IF EXISTS idx_opportunities_external_url_unique;

-- Add regular unique index on external_url (allows multiple NULLs, which is fine for user-submitted)
CREATE UNIQUE INDEX IF NOT EXISTS idx_opportunities_external_url_unique
  ON opportunities (external_url);

-- Verify
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'opportunities' AND indexname = 'idx_opportunities_external_url_unique';