-- ============================================
-- SirkulasiIn: Tabel Marketplace Listings
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Tabel marketplace_listings
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Pemilik listing (wajib login)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Relasi ke scan (opsional, jika dibuat dari hasil scan)
  scan_id UUID REFERENCES scan_history(id) ON DELETE SET NULL,

  -- Info listing
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,

  -- Harga
  price INTEGER NOT NULL,          -- dalam Rupiah
  currency TEXT DEFAULT 'IDR',
  ai_price_min INTEGER,            -- AI suggested harga minimum
  ai_price_max INTEGER,            -- AI suggested harga maximum

  -- Kategori
  category TEXT NOT NULL,           -- 'glass', 'plastic', 'paper', 'metal', 'textile', 'electronic', 'other'

  -- Data eco / dampak lingkungan
  carbon_saved TEXT,
  eco_points INTEGER DEFAULT 0,

  -- Status listing
  status TEXT DEFAULT 'draft',      -- 'draft', 'published', 'sold', 'archived'

  -- Lokasi penjual
  location TEXT
);

-- 2. Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON marketplace_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON marketplace_listings(created_at DESC);

-- 3. Function untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Row Level Security
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Semua orang bisa melihat listing yang published
CREATE POLICY "Listing published bisa dilihat semua orang"
  ON marketplace_listings FOR SELECT
  USING (status = 'published');

-- User bisa melihat semua listing miliknya sendiri (termasuk draft)
CREATE POLICY "User bisa melihat listing sendiri"
  ON marketplace_listings FOR SELECT
  USING (auth.uid() = user_id);

-- Hanya user yang sudah login bisa membuat listing
CREATE POLICY "User login bisa membuat listing"
  ON marketplace_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User hanya bisa mengupdate listing miliknya
CREATE POLICY "User bisa update listing sendiri"
  ON marketplace_listings FOR UPDATE
  USING (auth.uid() = user_id);

-- User hanya bisa menghapus listing miliknya
CREATE POLICY "User bisa hapus listing sendiri"
  ON marketplace_listings FOR DELETE
  USING (auth.uid() = user_id);
