-- ============================================
-- SirkulasiIn: Profiles & Orders Migration
-- Jalankan di Supabase SQL Editor
-- ============================================

-- ═══════════════════════════════════════════
-- 1. TABEL PROFILES (publik, bisa dibaca semua)
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  phone TEXT,
  location TEXT,       -- kota/provinsi
  address TEXT,        -- alamat lengkap untuk pengiriman
  bio TEXT,
  payout_bank_code TEXT,
  payout_account_number TEXT,
  payout_account_name TEXT,
  payout_channel TEXT DEFAULT 'bank',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Auto update updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════
-- 2. AUTO-CREATE PROFILE SAAT USER BARU REGISTER
-- ═══════════════════════════════════════════
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, username, avatar_url, phone, location)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'location', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pada auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════
-- 3. BACKFILL: Buat profile untuk user yang sudah ada
-- ═══════════════════════════════════════════
INSERT INTO profiles (id, full_name, username, avatar_url, phone, location)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
  COALESCE(raw_user_meta_data->>'username', ''),
  COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture', ''),
  COALESCE(raw_user_meta_data->>'phone', ''),
  COALESCE(raw_user_meta_data->>'location', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════
-- 4. RLS PROFILES
-- ═══════════════════════════════════════════
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Semua orang bisa baca profiles (publik)
CREATE POLICY "Profiles bisa dibaca semua orang"
  ON profiles FOR SELECT
  USING (true);

-- User hanya bisa update profile sendiri
CREATE POLICY "User bisa update profile sendiri"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- User bisa insert profile sendiri (untuk trigger)
CREATE POLICY "User bisa insert profile sendiri"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ═══════════════════════════════════════════
-- 5. TABEL ORDERS
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Pembeli
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Listing yang dibeli
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,

  -- Penjual (denormalisasi untuk query cepat)
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Info pengiriman
  shipping_name TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_notes TEXT,

  -- Harga
  total_price INTEGER NOT NULL,

  -- Status: pending_payment, paid, shipped, completed, cancelled
  status TEXT DEFAULT 'pending_payment'
);

-- Index
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing_id ON orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Auto update updated_at
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════
-- 6. RLS ORDERS
-- ═══════════════════════════════════════════
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Pembeli bisa lihat order sendiri
CREATE POLICY "Pembeli bisa lihat order sendiri"
  ON orders FOR SELECT
  USING (auth.uid() = buyer_id);

-- Penjual bisa lihat order di listing-nya
CREATE POLICY "Penjual bisa lihat order masuk"
  ON orders FOR SELECT
  USING (auth.uid() = seller_id);

-- User login bisa membuat order
CREATE POLICY "User login bisa buat order"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Pembeli bisa cancel order sendiri
CREATE POLICY "Pembeli bisa update order sendiri"
  ON orders FOR UPDATE
  USING (auth.uid() = buyer_id);

-- Penjual bisa update status order
CREATE POLICY "Penjual bisa update status order"
  ON orders FOR UPDATE
  USING (auth.uid() = seller_id);
