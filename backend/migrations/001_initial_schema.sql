-- AI Campus Opp Database Schema Migration
-- Run this in Supabase SQL Editor
-- Creates: profiles, opportunities, opportunity_matches, pipeline tables with RLS

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PROFILES TABLE
-- One profile per authenticated user (id matches Supabase Auth user ID)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  skills JSONB DEFAULT '[]'::jsonb,
  interests JSONB DEFAULT '[]'::jsonb,
  eligibility JSONB DEFAULT '{}'::jsonb,
  raw_resume_text TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster profile lookups
CREATE INDEX idx_profiles_updated_at ON profiles(updated_at DESC);

-- RLS: Users can only access their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. OPPORTUNITIES TABLE
-- Stores all opportunities (live-fetched + seed + user-submitted)
-- ============================================================
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('devpost', 'mlh', 'eventbrite', 'seed', 'user-submitted')),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hackathon', 'internship', 'competition', 'scholarship', 'workshop', 'other')),
  deadline DATE,
  eligibility JSONB DEFAULT '{}'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  raw_text TEXT,
  external_url TEXT,
  description TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_opportunities_source ON opportunities(source);
CREATE INDEX idx_opportunities_type ON opportunities(type);
CREATE INDEX idx_opportunities_deadline ON opportunities(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_opportunities_fetched_at ON opportunities(fetched_at DESC);
CREATE INDEX idx_opportunities_source_deadline ON opportunities(source, deadline) WHERE deadline IS NOT NULL;

-- RLS: Public read access for all authenticated users
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view opportunities"
  ON opportunities FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert user-submitted opportunities"
  ON opportunities FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND source = 'user-submitted'
  );

-- Note: Devpost/MLH/seed opportunities are inserted via service role (backend), not directly by users

-- ============================================================
-- 3. OPPORTUNITY_MATCHES TABLE
-- Caches ranked results with skill-gap analysis per user
-- ============================================================
CREATE TABLE opportunity_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  reason TEXT,
  matched_skills JSONB DEFAULT '[]'::jsonb,
  missing_skills JSONB DEFAULT '[]'::jsonb,
  urgency TEXT CHECK (urgency IN ('urgent', 'soon', 'normal', 'closed')),
  days_left INTEGER,
  ranked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, opportunity_id)
);

-- Indexes for ranking queries
CREATE INDEX idx_opportunity_matches_user ON opportunity_matches(user_id);
CREATE INDEX idx_opportunity_matches_score ON opportunity_matches(user_id, score DESC);
CREATE INDEX idx_opportunity_matches_urgency ON opportunity_matches(user_id, urgency);

-- RLS: Users can only access their own matches
ALTER TABLE opportunity_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches"
  ON opportunity_matches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own matches"
  ON opportunity_matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own matches"
  ON opportunity_matches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own matches"
  ON opportunity_matches FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. PIPELINE TABLE
-- Tracks user's application pipeline: Saved → Preparing → Applied → Result
-- ============================================================
CREATE TABLE pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('saved', 'preparing', 'applied', 'result')),
  notes TEXT,
  result_details JSONB, -- e.g., { outcome: 'won', prize: '$5000', date: '2026-09-15' }
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, opportunity_id)
);

-- Indexes for pipeline queries
CREATE INDEX idx_pipeline_user ON pipeline(user_id);
CREATE INDEX idx_pipeline_user_status ON pipeline(user_id, status);
CREATE INDEX idx_pipeline_updated_at ON pipeline(user_id, updated_at DESC);

-- RLS: Users can only access their own pipeline items
ALTER TABLE pipeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pipeline"
  ON pipeline FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pipeline items"
  ON pipeline FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pipeline items"
  ON pipeline FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pipeline items"
  ON pipeline FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. HELPER FUNCTIONS
-- ============================================================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables that need it
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunity_matches_updated_at
  BEFORE UPDATE ON opportunity_matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_updated_at
  BEFORE UPDATE ON pipeline
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. SEED DATA (optional - run separately if needed)
-- ============================================================
-- Seed opportunities are inserted via backend service on startup,
-- not via SQL migration, to allow dynamic refresh from Devpost/MLH.

-- ============================================================
-- VERIFICATION QUERIES (run after migration to confirm)
-- ============================================================
-- SELECT * FROM profiles LIMIT 1;
-- SELECT * FROM opportunities LIMIT 5;
-- SELECT * FROM opportunity_matches LIMIT 5;
-- SELECT * FROM pipeline LIMIT 5;
-- SELECT tablename, policyname, permissive FROM pg_policies WHERE schemaname = 'public';