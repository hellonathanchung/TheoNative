-- =============================================================
-- Theo – complete baseline schema
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor)
-- =============================================================

-- ──────────────────────────────────────────────────────────────
-- profiles  (one row per auth.users row, created by trigger)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email         text NOT NULL,
  display_name  text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read profiles (needed for invite look-ups)
CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ──────────────────────────────────────────────────────────────
-- partnerships
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partnerships (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  invitee_email  text NOT NULL,
  invitee_id     uuid REFERENCES auth.users ON DELETE SET NULL,
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at     timestamptz DEFAULT now(),
  accepted_at    timestamptz,
  UNIQUE (inviter_id, invitee_email)
);

ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;

-- Users see partnerships they are part of
CREATE POLICY "Users can see own partnerships"
  ON public.partnerships FOR SELECT
  USING (
    inviter_id = auth.uid()
    OR invitee_id = auth.uid()
    OR invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create invites"
  ON public.partnerships FOR INSERT
  WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Invitees can update (accept/decline)"
  ON public.partnerships FOR UPDATE
  USING (
    invitee_id = auth.uid()
    OR invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    OR inviter_id = auth.uid()   -- inviter may cancel
  );

CREATE POLICY "Participants can delete"
  ON public.partnerships FOR DELETE
  USING (
    inviter_id = auth.uid()
    OR invitee_id = auth.uid()
    OR invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- ──────────────────────────────────────────────────────────────
-- contractions
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contractions (
  id          uuid NOT NULL,
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  start_time  bigint NOT NULL,
  end_time    bigint,
  duration    integer,
  intensity   integer,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (id, user_id)           -- composite PK matches the upsert onConflict
);

ALTER TABLE public.contractions ENABLE ROW LEVEL SECURITY;

-- Users manage their own contractions
CREATE POLICY "Users can manage own contractions"
  ON public.contractions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ✅ THE KEY FIX: partners can read each other's contractions
CREATE POLICY "Partners can read each other contractions"
  ON public.contractions FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.partnerships
      WHERE status = 'accepted'
        AND (
          (inviter_id = auth.uid() AND invitee_id = contractions.user_id)
          OR (invitee_id = auth.uid() AND inviter_id = contractions.user_id)
        )
    )
  );

-- Enable Realtime for the table (required for postgres_changes subscriptions)
ALTER PUBLICATION supabase_realtime ADD TABLE public.contractions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partnerships;
