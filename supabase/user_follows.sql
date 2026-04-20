-- Buat tabel follows
CREATE TABLE user_follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

-- Aktifkan Row Level Security
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Kebijakan: Siapa saja bisa melihat data follow
CREATE POLICY "Anyone can view follows" 
ON user_follows FOR SELECT 
USING (true);

-- Kebijakan: Pengguna hanya bisa mengikuti sebagai diri sendiri
CREATE POLICY "Users can follow others" 
ON user_follows FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

-- Kebijakan: Pengguna hanya bisa berhenti mengikuti sebagai diri sendiri
CREATE POLICY "Users can unfollow" 
ON user_follows FOR DELETE 
USING (auth.uid() = follower_id);
