-- SkateQuest Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create parks table
CREATE TABLE IF NOT EXISTS parks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for parks (public read)
ALTER TABLE parks ENABLE ROW LEVEL SECURITY;

-- Create policies for parks (everyone can read)
CREATE POLICY "Anyone can view parks"
  ON parks
  FOR SELECT
  USING (true);

-- Create spatial index for location queries
CREATE INDEX IF NOT EXISTS idx_parks_location ON parks(lat, lng);
CREATE INDEX IF NOT EXISTS idx_parks_name ON parks(name);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  park_id TEXT NOT NULL,
  park_name TEXT NOT NULL,
  park_location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, park_id)
);

-- Enable Row Level Security
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own favorites"
  ON favorites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_park_id ON favorites(park_id);
