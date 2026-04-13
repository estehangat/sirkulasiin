-- ============================================
-- SirkulasiIn: Barter System Migration
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Tambah kolom barter ke marketplace_listings
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS barter_enabled BOOLEAN DEFAULT false;
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS barter_with TEXT[];
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS barter_notes TEXT;

-- 2. Tabel barter_offers
CREATE TABLE IF NOT EXISTS barter_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Listing target barter
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,

  -- User yang mengajukan tawaran
  offerer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Barang yang ditawarkan
  offered_item_name TEXT NOT NULL,
  offered_item_description TEXT,
  offered_item_image_url TEXT,

  -- Tuker tambah (opsional, dalam Rupiah)
  cash_addition INTEGER DEFAULT 0,

  -- Pesan untuk penjual
  message TEXT,

  -- Status tawaran
  status TEXT DEFAULT 'pending',  -- 'pending', 'accepted', 'rejected', 'cancelled'

  -- Respons dari penjual
  seller_response TEXT
);

-- 3. Trigger auto-update updated_at
CREATE TRIGGER set_barter_offers_updated_at
  BEFORE UPDATE ON barter_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_barter_offers_listing_id ON barter_offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_barter_offers_offerer_id ON barter_offers(offerer_id);
CREATE INDEX IF NOT EXISTS idx_barter_offers_status ON barter_offers(status);
CREATE INDEX IF NOT EXISTS idx_listings_barter_enabled ON marketplace_listings(barter_enabled);

-- 5. Row Level Security
ALTER TABLE barter_offers ENABLE ROW LEVEL SECURITY;

-- Penjual bisa melihat tawaran untuk listing miliknya
CREATE POLICY "Seller bisa lihat tawaran listing sendiri"
  ON barter_offers FOR SELECT
  USING (
    listing_id IN (
      SELECT id FROM marketplace_listings WHERE user_id = auth.uid()
    )
  );

-- Offerer bisa melihat tawaran yang dibuatnya
CREATE POLICY "Offerer bisa lihat tawaran sendiri"
  ON barter_offers FOR SELECT
  USING (auth.uid() = offerer_id);

-- User login bisa membuat tawaran
CREATE POLICY "User login bisa buat tawaran"
  ON barter_offers FOR INSERT
  WITH CHECK (auth.uid() = offerer_id);

-- Offerer bisa update (cancel) tawaran sendiri
CREATE POLICY "Offerer bisa update tawaran sendiri"
  ON barter_offers FOR UPDATE
  USING (auth.uid() = offerer_id);

-- Seller bisa update (accept/reject) tawaran di listing miliknya
CREATE POLICY "Seller bisa respond tawaran"
  ON barter_offers FOR UPDATE
  USING (
    listing_id IN (
      SELECT id FROM marketplace_listings WHERE user_id = auth.uid()
    )
  );
