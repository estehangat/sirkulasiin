-- ============================================
-- SirkulasiIn: Want-To-Buy (WTB) Migration
-- Papan permintaan publik: user post "dicari",
-- seller lain menawarkan barang via offer terstruktur,
-- deal dibayar buyer lewat Midtrans escrow (orders.listing_id = NULL).
-- Jalankan di Supabase SQL Editor. Idempotent.
-- ============================================

-- ═══════════════════════════════════════════
-- 1. TABEL wtb_requests (post "Saya cari X")
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS wtb_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Pembuat permintaan (= buyer saat deal)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL
    CHECK (category IN ('glass', 'plastic', 'paper', 'metal', 'textile', 'electronic', 'other')),
  budget_max INTEGER NOT NULL CHECK (budget_max > 0),
  city TEXT NOT NULL,

  -- open → in_checkout (offer di-accept, menunggu bayar) → fulfilled (paid)
  -- closed = ditutup manual, expired = lewat expires_at
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_checkout', 'fulfilled', 'closed', 'expired')),

  accepted_offer_id UUID, -- FK ditambah setelah wtb_offers dibuat
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

DROP TRIGGER IF EXISTS set_wtb_requests_updated_at ON wtb_requests;
CREATE TRIGGER set_wtb_requests_updated_at
  BEFORE UPDATE ON wtb_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_wtb_requests_user_id ON wtb_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_wtb_requests_status ON wtb_requests(status);
CREATE INDEX IF NOT EXISTS idx_wtb_requests_category ON wtb_requests(category);
CREATE INDEX IF NOT EXISTS idx_wtb_requests_open ON wtb_requests(expires_at) WHERE status = 'open';

-- ═══════════════════════════════════════════
-- 2. TABEL wtb_offers (tawaran barang dari seller)
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS wtb_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  wtb_id UUID NOT NULL REFERENCES wtb_requests(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Barang ad-hoc (tanpa listing marketplace)
  item_name TEXT NOT NULL,
  item_description TEXT,
  item_image_url TEXT,
  price INTEGER NOT NULL CHECK (price > 0),
  weight_grams INTEGER NOT NULL DEFAULT 1000,
  message TEXT,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),

  -- Satu seller hanya boleh 1 offer aktif per WTB
  CONSTRAINT uq_wtb_offer_per_seller UNIQUE (wtb_id, seller_id)
);

DROP TRIGGER IF EXISTS set_wtb_offers_updated_at ON wtb_offers;
CREATE TRIGGER set_wtb_offers_updated_at
  BEFORE UPDATE ON wtb_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_wtb_offers_wtb_id ON wtb_offers(wtb_id);
CREATE INDEX IF NOT EXISTS idx_wtb_offers_seller_id ON wtb_offers(seller_id);
CREATE INDEX IF NOT EXISTS idx_wtb_offers_status ON wtb_offers(status);

-- FK balik: WTB menunjuk offer yang di-accept
ALTER TABLE wtb_requests
  DROP CONSTRAINT IF EXISTS fk_wtb_accepted_offer;
ALTER TABLE wtb_requests
  ADD CONSTRAINT fk_wtb_accepted_offer
  FOREIGN KEY (accepted_offer_id) REFERENCES wtb_offers(id) ON DELETE SET NULL;

-- ═══════════════════════════════════════════
-- 3. ORDERS: dukung transaksi WTB (tanpa listing)
-- ═══════════════════════════════════════════
ALTER TABLE orders ALTER COLUMN listing_id DROP NOT NULL;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS wtb_offer_id UUID REFERENCES wtb_offers(id) ON DELETE SET NULL;

-- Order harus berasal dari listing ATAU offer WTB
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_source_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_source_check
  CHECK (listing_id IS NOT NULL OR wtb_offer_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_orders_wtb_offer_id ON orders(wtb_offer_id) WHERE wtb_offer_id IS NOT NULL;

-- ═══════════════════════════════════════════
-- 4. CHAT: tipe bubble baru 'wtb_card'
-- ═══════════════════════════════════════════
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_type_check;
ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_type_check
  CHECK (type IN ('text', 'product_card', 'barter_card', 'wtb_card'));

-- metadata wtb_card: { wtb_id, wtb_title, offer_id, item_name,
--                      item_description, item_image_url, price, message }

-- ═══════════════════════════════════════════
-- 5. RLS
-- ═══════════════════════════════════════════
ALTER TABLE wtb_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wtb_offers ENABLE ROW LEVEL SECURITY;

-- Papan WTB publik: semua bisa baca
CREATE POLICY "WTB bisa dibaca semua orang"
  ON wtb_requests FOR SELECT
  USING (true);

CREATE POLICY "User login bisa buat WTB"
  ON wtb_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pemilik bisa update WTB sendiri"
  ON wtb_requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Pemilik bisa hapus WTB sendiri"
  ON wtb_requests FOR DELETE
  USING (auth.uid() = user_id);

-- Offer: seller lihat miliknya, pemilik WTB lihat semua offer di post-nya
CREATE POLICY "Seller bisa lihat offer sendiri"
  ON wtb_offers FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Pemilik WTB bisa lihat offer masuk"
  ON wtb_offers FOR SELECT
  USING (
    wtb_id IN (SELECT id FROM wtb_requests WHERE user_id = auth.uid())
  );

CREATE POLICY "User login bisa buat offer"
  ON wtb_offers FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Seller bisa update offer sendiri"
  ON wtb_offers FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Pemilik WTB bisa respond offer"
  ON wtb_offers FOR UPDATE
  USING (
    wtb_id IN (SELECT id FROM wtb_requests WHERE user_id = auth.uid())
  );

-- ═══════════════════════════════════════════
-- 6. RPC rpc_place_wtb_order
--    Dipanggil dari checkout WTB setelah offer di-accept.
--    Atomic: validasi lock (offer accepted + WTB in_checkout milik caller)
--    → buat order escrow pending_payment dengan listing_id NULL.
-- ═══════════════════════════════════════════
CREATE OR REPLACE FUNCTION rpc_place_wtb_order(
  p_offer_id                       UUID,
  p_shipping_name                  TEXT,
  p_shipping_phone                 TEXT,
  p_shipping_address               TEXT,
  p_shipping_notes                 TEXT DEFAULT NULL,
  p_total_price                    INTEGER DEFAULT 0,
  p_shipping_cost                  INTEGER DEFAULT 0,
  p_shipping_courier               TEXT DEFAULT NULL,
  p_shipping_service               TEXT DEFAULT NULL,
  p_shipping_etd                   TEXT DEFAULT NULL,
  p_shipping_origin_area_id        TEXT DEFAULT NULL,
  p_shipping_origin_postal         TEXT DEFAULT NULL,
  p_shipping_destination_area_id   TEXT DEFAULT NULL,
  p_shipping_destination_postal    TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_buyer_id  UUID;
  v_order_id  UUID;
  v_offer     wtb_offers%ROWTYPE;
  v_wtb       wtb_requests%ROWTYPE;
BEGIN
  v_buyer_id := auth.uid();
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Kunci offer + WTB (cegah double checkout)
  SELECT * INTO v_offer FROM wtb_offers WHERE id = p_offer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer tidak ditemukan';
  END IF;

  SELECT * INTO v_wtb FROM wtb_requests WHERE id = v_offer.wtb_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permintaan tidak ditemukan';
  END IF;

  IF v_wtb.user_id <> v_buyer_id THEN
    RAISE EXCEPTION 'Hanya pembuat permintaan yang bisa checkout';
  END IF;

  IF v_offer.status <> 'accepted' OR v_wtb.status <> 'in_checkout' THEN
    RAISE EXCEPTION 'Offer ini sudah tidak bisa di-checkout';
  END IF;

  -- Idempotency: kalau sudah ada order aktif untuk offer ini, pakai yang ada
  SELECT id INTO v_order_id
  FROM orders
  WHERE wtb_offer_id = p_offer_id
    AND status = 'pending_payment'
  LIMIT 1;

  IF v_order_id IS NOT NULL THEN
    RETURN v_order_id;
  END IF;

  INSERT INTO orders (
    buyer_id,
    listing_id,
    wtb_offer_id,
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
    status,
    payment_provider,
    escrow_status,
    payout_status,
    payout_amount
  ) VALUES (
    v_buyer_id,
    NULL,
    p_offer_id,
    v_offer.seller_id,
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
    'pending_payment',
    'midtrans',
    'pending',
    'pending',
    p_total_price
  )
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;

-- ═══════════════════════════════════════════
-- 7. Housekeeping WTB kedaluwarsa (lazy expiry)
--    Board sudah memfilter expires_at > NOW(). Jalankan manual / via pg_cron:
--    SELECT cron.schedule('wtb-expire', '0 * * * *', $$SELECT wtb_expire_stale()$$);
-- ═══════════════════════════════════════════
CREATE OR REPLACE FUNCTION wtb_expire_stale()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE wtb_requests
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'open' AND expires_at <= NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
