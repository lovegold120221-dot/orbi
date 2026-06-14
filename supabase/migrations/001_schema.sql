-- Orbit Meeting — Full Database Schema
-- Run this in your Supabase SQL Editor or via supabase migration.
-- Safe to re-run: drops existing objects via CASCADE, then recreates.

-- ========================
-- 0. CLEANUP (safe to re-run)
-- ========================
-- CASCADE drops all policies, triggers, indexes on the table automatically.
-- Drop tables in dependency order (children first, then parents).
-- Drop functions last (not schema-bound).

DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.recordings CASCADE;
DROP TABLE IF EXISTS public.meeting_participants CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ========================
-- 1. PROFILES (extends auth.users)
-- ========================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT '',
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
  default_language TEXT DEFAULT 'en',
  voice TEXT DEFAULT 'Orus',
  mic_device_id TEXT,
  speaker_device_id TEXT,
  auto_join_audio BOOLEAN DEFAULT false,
  noise_suppression BOOLEAN DEFAULT true,
  cam_device_id TEXT,
  mirror_video BOOLEAN DEFAULT true,
  camera_off_on_join BOOLEAN DEFAULT false,
  video_background TEXT DEFAULT 'none',
  show_captions BOOLEAN DEFAULT true,
  mute_original_audio BOOLEAN DEFAULT true,
  translate_audio_playback BOOLEAN DEFAULT true,
  recording_save_path TEXT DEFAULT '',
  recording_auto_start BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile row when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at for profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ========================
-- 2. MEETINGS
-- ========================

CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT DEFAULT 'Orbit Meeting',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'active', 'ended')),
  room_name TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER on_meeting_updated
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ========================
-- 3. MEETING PARTICIPANTS
-- ========================

CREATE TABLE public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(meeting_id, user_id)
);

-- ========================
-- 4. RECORDINGS
-- ========================

CREATE TABLE public.recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_name TEXT,
  file_path TEXT,
  file_size BIGINT,
  duration_seconds INTEGER,
  recording_type TEXT DEFAULT 'local'
    CHECK (recording_type IN ('local', 'server')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 5. CHAT MESSAGES (persistent)
-- ========================

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- ROW LEVEL SECURITY
-- ========================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- PROFILES: users can read/update only their own row
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- MEETINGS: creator owns the meeting; participants can read
CREATE POLICY "meetings_select_participant"
  ON public.meetings FOR SELECT
  USING (
    auth.uid() = creator_id
    OR auth.uid() IN (
      SELECT user_id FROM public.meeting_participants WHERE meeting_id = meetings.id
    )
  );

CREATE POLICY "meetings_insert_own"
  ON public.meetings FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "meetings_update_own"
  ON public.meetings FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "meetings_delete_own"
  ON public.meetings FOR DELETE
  USING (auth.uid() = creator_id);

-- MEETING PARTICIPANTS: only see your own participations
CREATE POLICY "mp_select_own"
  ON public.meeting_participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "mp_insert_own"
  ON public.meeting_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mp_update_own"
  ON public.meeting_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- RECORDINGS: only see your own recordings
CREATE POLICY "recordings_select_own"
  ON public.recordings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "recordings_insert_own"
  ON public.recordings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recordings_delete_own"
  ON public.recordings FOR DELETE
  USING (auth.uid() = user_id);

-- CHAT MESSAGES: participants of the meeting can read; sender can insert
CREATE POLICY "chat_select_meeting"
  ON public.chat_messages FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.meeting_participants
      WHERE meeting_id = chat_messages.meeting_id
    )
    OR auth.uid() = (
      SELECT creator_id FROM public.meetings
      WHERE id = chat_messages.meeting_id
    )
  );

CREATE POLICY "chat_insert_own"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ========================
-- INDEXES
-- ========================

CREATE INDEX IF NOT EXISTS idx_meetings_creator ON public.meetings(creator_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON public.meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_user ON public.meeting_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_meeting ON public.recordings(meeting_id);
CREATE INDEX IF NOT EXISTS idx_recordings_user ON public.recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_meeting ON public.chat_messages(meeting_id);
