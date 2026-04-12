-- ============================================
-- SirkulasiIn: Tabel Recycle Tutorials
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Tabel recycle_tutorials
CREATE TABLE IF NOT EXISTS recycle_tutorials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES scan_history(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT DEFAULT 'Pemula',
  duration TEXT DEFAULT '10 Menit',
  eco_points INTEGER DEFAULT 100,
  tools JSONB,
  materials JSONB,
  steps JSONB NOT NULL,
  final_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index untuk lookup by scan_id
CREATE INDEX IF NOT EXISTS idx_recycle_tutorials_scan_id ON recycle_tutorials(scan_id);

-- 3. Row Level Security (open access untuk sementara)
ALTER TABLE recycle_tutorials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read tutorials" ON recycle_tutorials FOR SELECT USING (true);
CREATE POLICY "Allow public insert tutorials" ON recycle_tutorials FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update tutorials" ON recycle_tutorials FOR UPDATE USING (true);
