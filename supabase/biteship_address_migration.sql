-- ============================================
-- SirkulasiIn: Biteship Address Migration
-- Ganti sistem alamat berbasis RajaOngkir (province_id, city_id, dst)
-- dengan sistem area_id Biteship yang konsisten dari ongkir → create order.
-- Jalankan di Supabase SQL Editor.
-- ============================================

-- ═══════════════════════════════════════════
-- 1. Tambahkan kolom Biteship area di profiles
--    Kolom lama (province_id, city_id, dll) DIBIARKAN agar profile
--    yang sudah terisi tidak hilang. Boleh dihapus manual setelah
--    semua user re-input alamat baru.
-- ═══════════════════════════════════════════
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS shipping_area_id    TEXT,
  ADD COLUMN IF NOT EXISTS shipping_area_name  TEXT,
  ADD COLUMN IF NOT EXISTS shipping_postal     TEXT;

-- ═══════════════════════════════════════════
-- 2. Snapshot area Biteship per order
--    Saat checkout, simpan area_id+postal asal & tujuan supaya
--    saat seller create resi tidak perlu mapping ulang.
-- ═══════════════════════════════════════════
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_origin_area_id        TEXT,
  ADD COLUMN IF NOT EXISTS shipping_origin_postal         TEXT,
  ADD COLUMN IF NOT EXISTS shipping_destination_area_id   TEXT,
  ADD COLUMN IF NOT EXISTS shipping_destination_postal    TEXT;

-- ═══════════════════════════════════════════
-- 3. Update RPC rpc_place_order untuk terima area_id snapshot
-- ═══════════════════════════════════════════
CREATE OR REPLACE FUNCTION rpc_place_order(
  p_listing_id                       UUID,
  p_seller_id                        UUID,
  p_shipping_name                    TEXT,
  p_shipping_phone                   TEXT,
  p_shipping_address                 TEXT,
  p_shipping_notes                   TEXT DEFAULT NULL,
  p_total_price                      INTEGER DEFAULT 0,
  p_shipping_cost                    INTEGER DEFAULT 0,
  p_shipping_courier                 TEXT DEFAULT NULL,
  p_shipping_service                 TEXT DEFAULT NULL,
  p_shipping_etd                     TEXT DEFAULT NULL,
  p_shipping_origin_area_id          TEXT DEFAULT NULL,
  p_shipping_origin_postal           TEXT DEFAULT NULL,
  p_shipping_destination_area_id     TEXT DEFAULT NULL,
  p_shipping_destination_postal      TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_buyer_id   UUID;
  v_order_id   UUID;
BEGIN
  v_buyer_id := auth.uid();
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM marketplace_listings
    WHERE id = p_listing_id AND status = 'published'
  ) THEN
    RAISE EXCEPTION 'Listing not available';
  END IF;

  UPDATE marketplace_listings
  SET status = 'reserved', reserved_at = NOW()
  WHERE id = p_listing_id AND status = 'published';

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
    shipping_origin_area_id,
    shipping_origin_postal,
    shipping_destination_area_id,
    shipping_destination_postal,
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
    p_shipping_origin_area_id,
    p_shipping_origin_postal,
    p_shipping_destination_area_id,
    p_shipping_destination_postal,
    'pending_payment'
  )
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;
