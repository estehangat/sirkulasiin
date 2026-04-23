-- ============================================
-- SirkulasiIn: Kolom Status Aktif Pengguna
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Menambahkan kolom 'is_active' pada tabel profiles
-- Default true agar semua akun yang sudah ada tetap aktif
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
