
-- Extend profiles with freelance fields
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('freelancer', 'employer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'freelancer',
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hourly_rate numeric,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS location text;

-- Anyone signed-in can read profiles (for browsing freelancers / employers)
DROP POLICY IF EXISTS "profiles readable by authed" ON public.profiles;
CREATE POLICY "profiles readable by authed" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- GIGS table (jobs posted by employers, or services offered by freelancers)
CREATE TABLE IF NOT EXISTS public.gigs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  budget_min numeric,
  budget_max numeric,
  currency text NOT NULL DEFAULT 'USD',
  type text NOT NULL DEFAULT 'job', -- 'job' (employer) or 'service' (freelancer)
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gigs TO authenticated;
GRANT ALL ON public.gigs TO service_role;

ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gigs viewable by authed" ON public.gigs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "gigs insert own" ON public.gigs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "gigs update own" ON public.gigs
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "gigs delete own" ON public.gigs
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TRIGGER gigs_set_updated BEFORE UPDATE ON public.gigs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- CONVERSATIONS (1:1 between two users)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conv_users_ordered CHECK (user_a < user_b),
  UNIQUE (user_a, user_b)
);

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv participants read" ON public.conversations
  FOR SELECT TO authenticated USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "conv participants insert" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

-- MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text,
  attachment_url text,
  attachment_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages participants read" ON public.messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id AND (auth.uid() = c.user_a OR auth.uid() = c.user_b))
  );
CREATE POLICY "messages send as self" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id AND (auth.uid() = c.user_a OR auth.uid() = c.user_b))
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Update handle_new_user to accept role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'freelancer')
  );
  RETURN NEW;
END; $$;
