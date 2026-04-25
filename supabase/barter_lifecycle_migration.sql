-- ============================================
-- SirkulasiIn: Barter Lifecycle Migration
-- Jalankan di Supabase SQL Editor
-- ============================================

ALTER TABLE barter_offers
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS offerer_shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS offerer_completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_barter_offers_accepted_at ON barter_offers(accepted_at DESC);
