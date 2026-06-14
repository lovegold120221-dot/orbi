-- Orbit Meeting — Seed / Setup Script
-- Run this in the Supabase SQL Editor to set up the full schema.
-- Handles idempotent creation (IF NOT EXISTS on all tables).

-- =============================================
-- 1. SCHEMA (Tables + Triggers + RLS)
-- =============================================

-- Run the full migration
\i supabase/migrations/001_schema.sql

-- =============================================
-- 2. DEMO DATA (optional — delete for production)
-- =============================================

-- Insert a demo profile if the test user already exists in auth.users
-- (This is handled automatically by the on_auth_user_created trigger
--  for real signups, but useful for testing.)
--
-- INSERT INTO public.profiles (id, name, theme, default_language, voice)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Test User', 'dark', 'en', 'Orus')
-- ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. VERIFICATION
-- =============================================

-- Run these queries to verify the setup:
--
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
-- ORDER BY table_name;
--
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
--
-- \d+ public.profiles
