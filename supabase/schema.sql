-- MyTree Supabase schema
-- Run this in the Supabase SQL Editor after creating your project.

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_game_sessions_user ON public.game_sessions(user_id);

CREATE TABLE public.question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  question_id INTEGER NOT NULL,
  selected_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_question_attempts_user ON public.question_attempts(user_id);
CREATE INDEX idx_question_attempts_session ON public.question_attempts(session_id);

CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_feedback_user ON public.feedback(user_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Profiles: users can CRUD their own row
CREATE POLICY "Users select own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Game sessions
CREATE POLICY "Users select own sessions" ON public.game_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.game_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON public.game_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own sessions" ON public.game_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Question attempts
CREATE POLICY "Users select own attempts" ON public.question_attempts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own attempts" ON public.question_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own attempts" ON public.question_attempts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own attempts" ON public.question_attempts
  FOR DELETE USING (auth.uid() = user_id);

-- Feedback: users can submit but not read back (Brett reviews via the Supabase dashboard)
CREATE POLICY "Users insert own feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix drift: services/profile.js reads/writes first_name/last_name,
-- but the live DB was altered by hand without updating this file.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Leaderboard: aggregates question_attempts per user, ranked by total
-- correct answers, with percent accurate as the tiebreaker. SECURITY DEFINER
-- so authenticated users can read aggregate counts + names across all users,
-- despite question_attempts/profiles RLS being strictly auth.uid()-scoped.
-- Exposes ONLY display name + counts — no question-level data, no email, no avatar_url.
DROP FUNCTION IF EXISTS public.get_leaderboard(TIMESTAMPTZ);

CREATE FUNCTION public.get_leaderboard(window_start TIMESTAMPTZ DEFAULT NULL)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  total_correct BIGINT,
  accuracy NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    RANK() OVER (
      ORDER BY COUNT(*) FILTER (WHERE qa.is_correct) DESC,
               ROUND(COUNT(*) FILTER (WHERE qa.is_correct)::NUMERIC / COUNT(*) * 100) DESC
    ) AS rank,
    qa.user_id,
    COALESCE(NULLIF(TRIM(CONCAT(p.first_name, ' ', p.last_name)), ''), 'Anonymous') AS display_name,
    COUNT(*) FILTER (WHERE qa.is_correct) AS total_correct,
    ROUND(COUNT(*) FILTER (WHERE qa.is_correct)::NUMERIC / COUNT(*) * 100) AS accuracy
  FROM public.question_attempts qa
  JOIN public.profiles p ON p.id = qa.user_id
  WHERE window_start IS NULL OR qa.answered_at >= window_start
  GROUP BY qa.user_id, p.first_name, p.last_name
  ORDER BY total_correct DESC, accuracy DESC;
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard(TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(TIMESTAMPTZ) TO authenticated;


-- ============================================================
-- Auto-create profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS difficulty TEXT;


-- Delete the signed-in user's login record. Removing the auth user cascades to
-- profiles, game_sessions, question_attempts, and feedback.
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM auth.users WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;

-- Live 0-5 tree score, persisted so it can actually reset to 0 when a tree
-- completes. Previously derived from lifetime question_attempts, which could
-- never go back down once a player had enough net-correct answers.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_tree_score INTEGER NOT NULL DEFAULT 0;
