-- SkateQuest Mobile - Complete Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- 1. USER PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    spots_added INTEGER DEFAULT 0,
    challenges_completed INTEGER DEFAULT 0,
    crew_id UUID,
    crew_tag TEXT,
    trick_progress JSONB DEFAULT '{}',
    badges JSONB DEFAULT '[]',
    streak_days INTEGER DEFAULT 0,
    last_session_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles viewable by everyone"
ON public.profiles FOR SELECT TO public USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. SKATE SPOTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.skate_spots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
    type TEXT,
    tricks TEXT[],
    photo_url TEXT,
    video_url TEXT,
    description TEXT,
    added_by UUID REFERENCES public.profiles(id),
    rating NUMERIC(3, 2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.skate_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Spots viewable by everyone"
ON public.skate_spots FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can insert spots"
ON public.skate_spots FOR INSERT TO authenticated WITH CHECK (auth.uid() = added_by);

CREATE POLICY "Users can update their own spots"
ON public.skate_spots FOR UPDATE TO authenticated USING (auth.uid() = added_by);

CREATE INDEX IF NOT EXISTS idx_skate_spots_location ON public.skate_spots USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_skate_spots_added_by ON public.skate_spots(added_by);

-- =====================================================
-- 3. CHALLENGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spot_id UUID REFERENCES public.skate_spots(id) ON DELETE CASCADE,
    trick TEXT NOT NULL,
    description TEXT,
    xp_reward INTEGER DEFAULT 100,
    created_by UUID REFERENCES public.profiles(id),
    completed_by UUID[] DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenges viewable by everyone"
ON public.challenges FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can create challenges"
ON public.challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Challenge creators can update"
ON public.challenges FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_challenges_spot_id ON public.challenges(spot_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);

-- =====================================================
-- 4. CHALLENGE PROOFS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.challenge_proofs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    proof_url TEXT NOT NULL,
    proof_type TEXT CHECK (proof_type IN ('photo', 'video')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.challenge_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Proofs viewable by everyone"
ON public.challenge_proofs FOR SELECT TO public USING (true);

CREATE POLICY "Users can upload own proofs"
ON public.challenge_proofs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 5. TRICK CALLOUTS TABLE (P2P Challenges)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.trick_callouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenger_id UUID REFERENCES public.profiles(id) NOT NULL,
    challenger_username TEXT NOT NULL,
    target_id UUID REFERENCES public.profiles(id) NOT NULL,
    target_username TEXT NOT NULL,
    trick TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'declined')),
    proof_video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.trick_callouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view callouts they're in"
ON public.trick_callouts FOR SELECT TO authenticated 
USING (auth.uid() = challenger_id OR auth.uid() = target_id);

CREATE POLICY "Users can create callouts"
ON public.trick_callouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Target users can update callout"
ON public.trick_callouts FOR UPDATE TO authenticated USING (auth.uid() = target_id);

-- =====================================================
-- 6. CREWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tag TEXT UNIQUE NOT NULL CHECK (length(tag) >= 2 AND length(tag) <= 5),
    bio TEXT,
    founder_id UUID REFERENCES public.profiles(id) NOT NULL,
    founder_name TEXT NOT NULL,
    members UUID[] DEFAULT '{}',
    member_names TEXT[] DEFAULT '{}',
    total_xp INTEGER DEFAULT 0,
    challenges_completed INTEGER DEFAULT 0,
    spots_added INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Crews viewable by everyone"
ON public.crews FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can create crews"
ON public.crews FOR INSERT TO authenticated WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Crew members can update crew"
ON public.crews FOR UPDATE TO authenticated USING (auth.uid() = ANY(members));

CREATE POLICY "Crew founders can delete crew"
ON public.crews FOR DELETE TO authenticated USING (auth.uid() = founder_id);

CREATE INDEX IF NOT EXISTS idx_crews_tag ON public.crews(tag);

-- =====================================================
-- 7. SESSIONS TABLE (Skate Sessions)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in seconds
    spots_visited UUID[] DEFAULT '{}',
    tricks_attempted INTEGER DEFAULT 0,
    tricks_landed INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sessions"
ON public.sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own sessions"
ON public.sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own sessions"
ON public.sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- 8. EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    description TEXT,
    organizer_id UUID REFERENCES public.profiles(id),
    attendees UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events viewable by everyone"
ON public.events FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can create events"
ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = organizer_id);

-- =====================================================
-- 9. SHOPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    phone TEXT,
    website TEXT,
    description TEXT,
    photo_url TEXT,
    added_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shops viewable by everyone"
ON public.shops FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can add shops"
ON public.shops FOR INSERT TO authenticated WITH CHECK (auth.uid() = added_by);

-- =====================================================
-- 10. FAVORITES TABLE (already exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  park_id TEXT NOT NULL,
  park_name TEXT NOT NULL,
  park_location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, park_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own favorites"
ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own favorites"
ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own favorites"
ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_park_id ON public.favorites(park_id);

-- =====================================================
-- 11. TRICKS LIBRARY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tricks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
    category TEXT, -- 'Flip', 'Grind', 'Grab', etc.
    description TEXT,
    tutorial_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.tricks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tricks viewable by everyone"
ON public.tricks FOR SELECT TO public USING (true);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update user level based on XP
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.level = FLOOR(NEW.xp / 1000) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_level
BEFORE UPDATE OF xp ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_level();
