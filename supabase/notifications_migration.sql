-- ============================================
-- SirkulasiIn: Tabel Notifikasi Terpadu
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Tabel notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Target user, NULL jika untuk sistem/admin tertentu (opsional)
  type TEXT NOT NULL CHECK (type IN ('system', 'transaction', 'scan', 'admin_alert', 'social', 'reward')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- URL navigasi saat diklik
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb -- Menyimpan ID terkait seperti transaction_id atau scan_id
);

-- 2. Aktifkan Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan RLS
-- Hapus policy lama jika ada untuk menghindari error duplikat
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notification status" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;

-- Pengguna hanya bisa melihat notifikasi miliknya sendiri
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

-- Pengguna bisa menandai notifikasi miliknya sebagai sudah dibaca
CREATE POLICY "Users can update their own notification status" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);

-- Izinkan sistem/user untuk menyisipkan notifikasi
CREATE POLICY "Anyone can insert notifications" 
  ON public.notifications FOR INSERT 
  WITH CHECK (true);

-- Admin bisa melihat semua notifikasi (Opsional, tergantung role sistem Anda)
-- Jika tabel profiles memiliki kolom role:
-- CREATE POLICY "Admins can view all" ON public.notifications FOR SELECT
-- USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Aktifkan Realtime untuk tabel ini
-- Cek dulu apakah tabel sudah ada di publikasi
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 5. Index untuk performa
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
