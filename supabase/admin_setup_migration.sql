-- ============================================
-- SirkulasiIn: Setup Admin Role & CMS Content
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Menambahkan kolom 'role' pada tabel user/profil yang ada
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Membuat tabel khusus untuk konten dinamis
CREATE TABLE IF NOT EXISTS public.site_content (
  id TEXT PRIMARY KEY,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

-- RLS (Open read untuk public, admin write hanya diatur di akses level aplikasi, tapi bisa diextend RLS-nya)
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Allow update by anyone (app checked)" ON public.site_content FOR UPDATE USING (true);
CREATE POLICY "Allow insert by anyone (app checked)" ON public.site_content FOR INSERT WITH CHECK (true);

-- 3. Inisiasi data default
INSERT INTO public.site_content (id, content) VALUES
('home_page', '{"hero_title": "Membawa Perubahan dengan Ekonomi Sirkular.", "hero_subtitle": "Ubah barang tidak terpakai menjadi nilai baru. Lakukan scan, barter, dan temukan opsi daur ulang dengan kecerdasan buatan"}'::jsonb),
('about_page', '{"mission_title": "Visi Misi SirkulasiIn", "mission_text": "SirkulasiIn hadir dengan tujuan untuk mengedukasi dan menyediakan platform transaksi barang bekas pakai guna mendukung Indonesia bebas sampah."}'::jsonb)
ON CONFLICT (id) DO NOTHING;
