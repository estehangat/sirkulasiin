-- ============================================================
-- SirkulasiIn: Eco Points System Migration
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tabel point_transactions (log setiap kejadian poin)
CREATE TABLE IF NOT EXISTS point_transactions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points       INTEGER NOT NULL,           -- positif = credit, negatif = debit
  source_type  TEXT NOT NULL,              -- 'scan' | 'tutorial' | 'redeem' | 'adjustment'
  source_id    UUID,                       -- FK opsional ke entitas asal
  description  TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT now(),
  -- Cegah double-counting: satu source hanya boleh tercatat sekali
  CONSTRAINT uq_point_source UNIQUE (source_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_pt_user ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pt_created ON point_transactions(created_at DESC);

-- 2. Tabel user_points (saldo kumulatif per user)
CREATE TABLE IF NOT EXISTS user_points (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  -- Saldo tidak boleh negatif
  CONSTRAINT chk_non_negative CHECK (total_points >= 0)
);

-- 3. RLS — user hanya bisa SELECT miliknya; INSERT/UPDATE diblokir langsung
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pt_select_own" ON point_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "up_select_own" ON user_points
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 4. RPC function: add_points_transaction (atomic, cegah saldo negatif)
CREATE OR REPLACE FUNCTION add_points_transaction(
  p_user_id     UUID,
  p_points      INTEGER,
  p_source_type TEXT,
  p_source_id   UUID,
  p_description TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER  -- run as owner, bypass RLS untuk mutasi
AS $$
BEGIN
  -- Cek apakah ini debit & apakah saldo mencukupi
  IF p_points < 0 THEN
    IF NOT EXISTS (SELECT 1 FROM user_points WHERE user_id = p_user_id) THEN
      RAISE EXCEPTION 'insufficient_points';
    END IF;

    IF (SELECT total_points FROM user_points WHERE user_id = p_user_id) + p_points < 0 THEN
      RAISE EXCEPTION 'insufficient_points';
    END IF;
  END IF;

  -- Insert transaksi (UNIQUE constraint akan blokir duplikat secara diam-diam)
  INSERT INTO point_transactions (user_id, points, source_type, source_id, description)
  VALUES (p_user_id, p_points, p_source_type, p_source_id, p_description)
  ON CONFLICT ON CONSTRAINT uq_point_source DO NOTHING;

  -- Jika tidak ada baris yang ter-insert (duplikat), keluar tanpa ubah saldo
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Upsert saldo
  INSERT INTO user_points (user_id, total_points, updated_at)
  VALUES (p_user_id, GREATEST(0, p_points), now())
  ON CONFLICT (user_id) DO UPDATE
    SET total_points = GREATEST(0, user_points.total_points + p_points),
        updated_at   = now();
END;
$$;

-- Grant execute ke authenticated users
GRANT EXECUTE ON FUNCTION add_points_transaction(UUID, INTEGER, TEXT, UUID, TEXT)
  TO authenticated;
