-- ============================================
-- SirkulasiIn: Native Telemetry System
-- Jalankan di Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.page_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path TEXT NOT NULL,
    user_agent TEXT,
    device_type TEXT, -- (Mobile, Tablet, Desktop)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mengaktifkan pengamanan lapis baris RLS
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- 1. Mengizinkan publik (siapa pun yang masuk weh) untuk mencatat (insert) statistik kunjungannya
DROP POLICY IF EXISTS "Allow public insert on page_visits" ON public.page_visits;
CREATE POLICY "Allow public insert on page_visits" 
ON public.page_visits
FOR INSERT 
WITH CHECK (true);

-- 2. Membatasi kemampuan melihat data analitik hanya kepada admin
DROP POLICY IF EXISTS "Allow admin read page_visits" ON public.page_visits;
CREATE POLICY "Allow admin read page_visits" 
ON public.page_visits
FOR SELECT 
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );
