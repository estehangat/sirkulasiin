-- ============================================
-- SirkulasiIn: Admin RLS for Barter & Notifications
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Admin bisa melihat SEMUA barter offers
CREATE POLICY "Admin bisa lihat semua barter"
  ON barter_offers FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admin bisa melihat SEMUA notifications
CREATE POLICY "Admin bisa lihat semua notifications"
  ON public.notifications FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admin bisa menghapus notifications
CREATE POLICY "Admin bisa hapus notifications"
  ON public.notifications FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
