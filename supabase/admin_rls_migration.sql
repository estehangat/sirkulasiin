-- ============================================
-- SirkulasiIn: RBAC Security & Profiling Policies
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Memberikan hak eksklusif kepada pengguna ber-role 'admin' untuk menindak profil lain
-- Catatan: Pastikan kolom 'role' sudah ada di tabel public.profiles (telah dijalankan di script sebelumnya)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Kebijakan Ubah Role / Edit (Khusus Admin)
DROP POLICY IF EXISTS "Allow adm to update profiles" ON public.profiles;
CREATE POLICY "Allow adm to update profiles" 
ON public.profiles
FOR UPDATE 
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- 2. Kebijakan Hapus User (Khusus Admin)
DROP POLICY IF EXISTS "Allow adm to delete profiles" ON public.profiles;
CREATE POLICY "Allow adm to delete profiles" 
ON public.profiles
FOR DELETE 
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- 3. Memastikan semua pengguna tetap bisa membaca profil umum
DROP POLICY IF EXISTS "Allow public to read profiles" ON public.profiles;
CREATE POLICY "Allow public to read profiles" 
ON public.profiles
FOR SELECT 
USING (true);
