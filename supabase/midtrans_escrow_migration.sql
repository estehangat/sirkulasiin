-- ============================================
-- SirkulasiIn: Midtrans + Escrow Migration
-- ============================================

ALTER TABLE marketplace_listings
  ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMPTZ;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS payment_token TEXT,
  ADD COLUMN IF NOT EXISTS payment_redirect_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT,
  ADD COLUMN IF NOT EXISTS payment_expired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS midtrans_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS midtrans_raw JSONB,
  ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS escrow_held_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escrow_released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payout_reference TEXT,
  ADD COLUMN IF NOT EXISTS payout_amount INTEGER,
  ADD COLUMN IF NOT EXISTS payout_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS payout_bank_code TEXT,
  ADD COLUMN IF NOT EXISTS payout_account_number TEXT,
  ADD COLUMN IF NOT EXISTS payout_account_name TEXT,
  ADD COLUMN IF NOT EXISTS payout_channel TEXT DEFAULT 'bank';

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_reference
  ON orders(payment_reference)
  WHERE payment_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_escrow_status ON orders(escrow_status);
CREATE INDEX IF NOT EXISTS idx_orders_payout_status ON orders(payout_status);

CREATE OR REPLACE FUNCTION rpc_place_order(
  p_listing_id UUID,
  p_seller_id UUID,
  p_shipping_name TEXT,
  p_shipping_phone TEXT,
  p_shipping_address TEXT,
  p_shipping_notes TEXT,
  p_total_price INTEGER
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_buyer_id UUID := auth.uid();
  v_order_id UUID;
  v_listing_status TEXT;
BEGIN
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_buyer_id = p_seller_id THEN
    RAISE EXCEPTION 'Anda tidak bisa membeli listing Anda sendiri.';
  END IF;

  SELECT status INTO v_listing_status
  FROM marketplace_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF v_listing_status != 'published' THEN
    RAISE EXCEPTION 'Listing ini sudah tidak tersedia atau sedang diproses pembeli lain.';
  END IF;

  INSERT INTO orders (
    buyer_id, listing_id, seller_id,
    shipping_name, shipping_phone, shipping_address, shipping_notes,
    total_price, status, payment_provider, escrow_status, payout_status, payout_amount
  ) VALUES (
    v_buyer_id, p_listing_id, p_seller_id,
    p_shipping_name, p_shipping_phone, p_shipping_address, p_shipping_notes,
    p_total_price, 'pending_payment', 'midtrans', 'pending', 'pending', p_total_price
  ) RETURNING id INTO v_order_id;

  UPDATE marketplace_listings
  SET status = 'reserved', reserved_at = NOW(), updated_at = NOW()
  WHERE id = p_listing_id;

  RETURN v_order_id;
END;
$$;
