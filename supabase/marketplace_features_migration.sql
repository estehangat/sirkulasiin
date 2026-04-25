-- ============================================
-- SirkulasiIn: Marketplace Features Migration
-- (view_count + favorites)
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Tambah kolom view_count ke marketplace_listings
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_listings_view_count ON marketplace_listings(view_count DESC);

-- 2. RPC function untuk increment view (atomic, aman concurrent)
CREATE OR REPLACE FUNCTION increment_listing_view(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE marketplace_listings
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = listing_id AND status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Tabel user_favorites
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing ON user_favorites(listing_id);

-- 4. RLS favorites
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User bisa lihat favorites sendiri"
  ON user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "User login bisa tambah favorite"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User bisa hapus favorite sendiri"
  ON user_favorites FOR DELETE
  USING (auth.uid() = user_id);

