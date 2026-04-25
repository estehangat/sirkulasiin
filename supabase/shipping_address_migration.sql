-- ============================================
-- SirkulasiIn: Shipping Address Migration
-- Tambahkan kolom alamat terstruktur (RajaOngkir),
-- berat barang di listing, dan info ongkir di orders.
-- Jalankan di Supabase SQL Editor
-- ============================================

-- ═══════════════════════════════════════════
-- 1. Alamat terstruktur di profiles
-- ═══════════════════════════════════════════
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS province_id   INTEGER,
  ADD COLUMN IF NOT EXISTS province_name TEXT,
  ADD COLUMN IF NOT EXISTS city_id       INTEGER,
  ADD COLUMN IF NOT EXISTS city_name     TEXT,
  ADD COLUMN IF NOT EXISTS district_id   TEXT,
  ADD COLUMN IF NOT EXISTS district_name TEXT,
  ADD COLUMN IF NOT EXISTS village_id    TEXT,
  ADD COLUMN IF NOT EXISTS village_name  TEXT,
  ADD COLUMN IF NOT EXISTS postal_code   TEXT,
  ADD COLUMN IF NOT EXISTS full_address  TEXT;

-- ═══════════════════════════════════════════
-- 2. Berat barang di marketplace_listings
--    (wajib ada; default 1000g untuk listing lama)
-- ═══════════════════════════════════════════
ALTER TABLE marketplace_listings
  ADD COLUMN IF NOT EXISTS weight_grams INTEGER NOT NULL DEFAULT 1000;

-- ═══════════════════════════════════════════
-- 3. Info ongkir di orders
-- ═══════════════════════════════════════════
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_cost    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_courier TEXT,
  ADD COLUMN IF NOT EXISTS shipping_service TEXT,
  ADD COLUMN IF NOT EXISTS shipping_etd     TEXT;

-- ═══════════════════════════════════════════
-- 4. Update RPC rpc_place_order untuk shipping
--    (ganti parameter dan simpan ke orders)
-- ═══════════════════════════════════════════
CREATE OR REPLACE FUNCTION rpc_place_order(
  p_listing_id       UUID,
  p_seller_id        UUID,
  p_shipping_name    TEXT,
  p_shipping_phone   TEXT,
  p_shipping_address TEXT,
  p_shipping_notes   TEXT DEFAULT NULL,
  p_total_price      INTEGER DEFAULT 0,
  p_shipping_cost    INTEGER DEFAULT 0,
  p_shipping_courier TEXT DEFAULT NULL,
  p_shipping_service TEXT DEFAULT NULL,
  p_shipping_etd     TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_buyer_id   UUID;
  v_order_id   UUID;
BEGIN
  -- Dapatkan user ID dari session
  v_buyer_id := auth.uid();
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Pastikan listing masih published
  IF NOT EXISTS (
    SELECT 1 FROM marketplace_listings
    WHERE id = p_listing_id AND status = 'published'
  ) THEN
    RAISE EXCEPTION 'Listing not available';
  END IF;

  -- Tandai listing sebagai reserved
  UPDATE marketplace_listings
  SET status = 'reserved', reserved_at = NOW()
  WHERE id = p_listing_id AND status = 'published';

  -- Buat order
  INSERT INTO orders (
    buyer_id,
    listing_id,
    seller_id,
    shipping_name,
    shipping_phone,
    shipping_address,
    shipping_notes,
    total_price,
    shipping_cost,
    shipping_courier,
    shipping_service,
    shipping_etd,
    status
  ) VALUES (
    v_buyer_id,
    p_listing_id,
    p_seller_id,
    p_shipping_name,
    p_shipping_phone,
    p_shipping_address,
    p_shipping_notes,
    p_total_price,
    p_shipping_cost,
    p_shipping_courier,
    p_shipping_service,
    p_shipping_etd,
    'pending_payment'
  )
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;
