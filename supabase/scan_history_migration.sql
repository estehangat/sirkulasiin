-- Migration: Add user_id to scan_history
ALTER TABLE public.scan_history 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON public.scan_history(user_id);

-- Opsional: Terapkan RLS
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User bisa melihat scan history mereka sendiri"
ON public.scan_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "User login bisa insert scan history"
ON public.scan_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anon bisa insert untuk sementara jika diperlukan"
ON public.scan_history FOR INSERT
WITH CHECK (true); -- Hapus policy ini jika ingin strict hanya user login
