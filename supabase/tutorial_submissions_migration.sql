-- Tutorial Submissions: tracks user-submitted proof of completed tutorials
CREATE TABLE IF NOT EXISTS tutorial_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_id UUID NOT NULL REFERENCES recycle_tutorials(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  eco_points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_tutorial_submissions_user ON tutorial_submissions(user_id);

-- RLS policies
ALTER TABLE tutorial_submissions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own submissions
CREATE POLICY "Users can insert own submissions"
  ON tutorial_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own submissions
CREATE POLICY "Users can read own submissions"
  ON tutorial_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
