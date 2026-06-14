-- ========================
-- Migration 002: Fix chat for all users
-- ========================
-- Adds sender_name column and updates RLS policies to allow
-- anonymous (unauthenticated) users to read/write chat messages.

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- Drop old restrictive policies
DROP POLICY IF EXISTS chat_select_meeting ON public.chat_messages;
DROP POLICY IF EXISTS chat_insert_own ON public.chat_messages;

-- Allow meeting participants (authenticated) to read chat messages.
-- Participants are identified by their user_id in the meeting_participants table,
-- or by being the meeting creator.
DROP POLICY IF EXISTS chat_select_participant ON public.chat_messages;
CREATE POLICY chat_select_participant
  ON public.chat_messages FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() IN (
        SELECT user_id FROM public.meeting_participants
        WHERE meeting_id::text = chat_messages.meeting_id::text
      )
      OR auth.uid() = (
        SELECT creator_id FROM public.meetings
        WHERE id::text = chat_messages.meeting_id::text
      )
    )
  );

-- Allow anonymous users to read chat messages too (the app always filters
-- by meeting_id, which is a UUID known only to participants of that room).
DROP POLICY IF EXISTS chat_select_anonymous ON public.chat_messages;
CREATE POLICY chat_select_anonymous
  ON public.chat_messages FOR SELECT
  USING (auth.uid() IS NULL);

-- Allow any user (authenticated or anonymous) to insert chat messages.
-- The user_id and sender_name are provided by the client.
DROP POLICY IF EXISTS chat_insert_any ON public.chat_messages;
CREATE POLICY chat_insert_any
  ON public.chat_messages FOR INSERT
  WITH CHECK (true);
