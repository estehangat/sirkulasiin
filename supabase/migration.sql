-- ============================================
-- SirkulasiIn: Tabel Riwayat Scan
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Tabel scan_history
CREATE TABLE IF NOT EXISTS scan_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT,
  description TEXT,
  item_name TEXT NOT NULL,
  material TEXT,
  grade TEXT,
  weight TEXT,
  condition TEXT,
  recommendation TEXT NOT NULL,
  reason TEXT,
  market_sentiment TEXT,
  material_purity TEXT,
  circular_potential INTEGER DEFAULT 0,
  carbon_offset INTEGER DEFAULT 0,
  carbon_saved TEXT,
  potential_reward TEXT,
  estimated_price TEXT,
  recycle_options JSONB,
  upcycle_idea TEXT,
  upcycle_description TEXT,
  upcycle_image_url TEXT,
  hero_headline TEXT,
  hero_description TEXT
);

-- Migrasi: tambah kolom upcycle_image_url jika tabel sudah ada
ALTER TABLE scan_history ADD COLUMN IF NOT EXISTS upcycle_image_url TEXT;

-- 2. Row Level Security (open access untuk sementara)
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON scan_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON scan_history FOR INSERT WITH CHECK (true);

-- 3. Storage bucket untuk gambar scan
INSERT INTO storage.buckets (id, name, public)
VALUES ('scan-images', 'scan-images', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage policies
CREATE POLICY "Public read scan images" ON storage.objects
  FOR SELECT USING (bucket_id = 'scan-images');

CREATE POLICY "Public insert scan images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'scan-images');
