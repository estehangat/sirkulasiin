-- ============================================================
-- SirkulasiIn: Chat System Migration
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tabel chat_rooms (satu room per pasangan user)
CREATE TABLE IF NOT EXISTS chat_rooms (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  -- Satu room unik per pasangan user (order-independent via check)
  CONSTRAINT uq_chat_room_pair UNIQUE (participant1, participant2)
);

CREATE INDEX IF NOT EXISTS idx_chatroom_p1 ON chat_rooms(participant1);
CREATE INDEX IF NOT EXISTS idx_chatroom_p2 ON chat_rooms(participant2);

-- 2. Tabel chat_messages
-- type: 'text' | 'product_card' | 'barter_card'
-- metadata (JSONB) untuk card:
--   product_card: { listing_id, title, price, image_url, carbon_saved }
--   barter_card:  { listing_id, listing_title, offered_item_name,
--                   offered_item_description, cash_addition, message }
CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id     UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL DEFAULT 'text'
              CHECK (type IN ('text', 'product_card', 'barter_card')),
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chatmsg_room ON chat_messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chatmsg_sender ON chat_messages(sender_id);

-- 3. RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- chat_rooms: hanya participant yang bisa SELECT
CREATE POLICY "chatroom_select" ON chat_rooms
  FOR SELECT TO authenticated
  USING (auth.uid() = participant1 OR auth.uid() = participant2);

-- chat_rooms: siapa pun authenticated bisa INSERT (create new room)
CREATE POLICY "chatroom_insert" ON chat_rooms
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = participant1 OR auth.uid() = participant2);

-- chat_messages: hanya anggota room bisa SELECT
CREATE POLICY "chatmsg_select" ON chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms r
      WHERE r.id = room_id
        AND (r.participant1 = auth.uid() OR r.participant2 = auth.uid())
    )
  );

-- chat_messages: hanya anggota room bisa INSERT
CREATE POLICY "chatmsg_insert" ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_rooms r
      WHERE r.id = room_id
        AND (r.participant1 = auth.uid() OR r.participant2 = auth.uid())
    )
  );

-- 4. Aktifkan Supabase Realtime untuk chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
