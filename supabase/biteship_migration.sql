-- ============================================
-- SirkulasiIn: Biteship Delivery Migration
-- ============================================
-- Migrasi dari Komship → Biteship.
-- Idempotent: aman dijalankan berulang.

-- ─── Drop kolom Komship lama (jika sudah dibuat) ─────────────────────────────
DROP INDEX IF EXISTS idx_orders_komship_order_no;
ALTER TABLE orders
  DROP COLUMN IF EXISTS komship_order_no,
  DROP COLUMN IF EXISTS komship_order_id,
  DROP COLUMN IF EXISTS komship_raw;

-- ─── Tambah kolom generic shipping provider ──────────────────────────────────
-- Naming generic supaya kalau swap provider lagi, schema tetap stabil.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_provider TEXT,           -- 'biteship' | 'komship' | dll
  ADD COLUMN IF NOT EXISTS shipping_order_id TEXT,           -- ID order di provider
  ADD COLUMN IF NOT EXISTS shipping_tracking_id TEXT,        -- tracking_id (Biteship-specific)
  ADD COLUMN IF NOT EXISTS shipping_raw JSONB,               -- raw response provider
  ADD COLUMN IF NOT EXISTS public_tracking_url TEXT;         -- URL public tracking

-- Pastikan kolom yang dipakai bersama juga ada (idempotent).
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS awb TEXT,
  ADD COLUMN IF NOT EXISTS awb_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pickup_status TEXT,
  ADD COLUMN IF NOT EXISTS pickup_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pickup_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT,
  ADD COLUMN IF NOT EXISTS delivery_history JSONB,
  ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_awb
  ON orders(awb)
  WHERE awb IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_shipping_order_id
  ON orders(shipping_order_id)
  WHERE shipping_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_shipping_tracking_id
  ON orders(shipping_tracking_id)
  WHERE shipping_tracking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_pickup_status
  ON orders(pickup_status)
  WHERE pickup_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_delivery_status
  ON orders(delivery_status)
  WHERE delivery_status IS NOT NULL;
