-- ============================================
-- SirkulasiIn: Admin RLS for Orders & Listings
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Admin bisa melihat SEMUA orders
CREATE POLICY "Admin bisa lihat semua orders"
  ON orders FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admin bisa update SEMUA orders (force cancel, update status)
CREATE POLICY "Admin bisa update semua orders"
  ON orders FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admin bisa melihat SEMUA listings (termasuk draft, archived)
CREATE POLICY "Admin bisa lihat semua listings"
  ON marketplace_listings FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admin bisa update SEMUA listings (unpublish, archive)
CREATE POLICY "Admin bisa update semua listings"
  ON marketplace_listings FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
