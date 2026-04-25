-- ============================================
-- SirkulasiIn: Listing Sale Source Migration
-- Jalankan di Supabase SQL Editor
-- ============================================

ALTER TABLE marketplace_listings
  ADD COLUMN IF NOT EXISTS sold_via TEXT;

ALTER TABLE marketplace_listings
  DROP CONSTRAINT IF EXISTS marketplace_listings_sold_via_check;

ALTER TABLE marketplace_listings
  ADD CONSTRAINT marketplace_listings_sold_via_check
  CHECK (sold_via IS NULL OR sold_via IN ('payment', 'barter'));

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_sold_via ON marketplace_listings(sold_via);
