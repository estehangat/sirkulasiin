-- ============================================
-- SirkulasiIn: Payouts (Midtrans IRIS) Migration
-- Jalankan di Supabase SQL Editor
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS payout_bank_code TEXT,
  ADD COLUMN IF NOT EXISTS payout_account_number TEXT,
  ADD COLUMN IF NOT EXISTS payout_account_name TEXT,
  ADD COLUMN IF NOT EXISTS payout_channel TEXT DEFAULT 'bank';

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payout_reference TEXT,
  ADD COLUMN IF NOT EXISTS payout_amount INTEGER,
  ADD COLUMN IF NOT EXISTS payout_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_payout_status ON orders(payout_status);
