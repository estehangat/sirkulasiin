import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { seller_id } = await req.json();
  if (!seller_id || seller_id === user.id) {
    return NextResponse.json({ error: "Invalid seller_id" }, { status: 400 });
  }

  // Normalise pair sehingga participant1 selalu UUID terkecil (canonical order)
  const [p1, p2] = [user.id, seller_id].sort();

  // Cari room yang sudah ada
  const { data: existing } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("participant1", p1)
    .eq("participant2", p2)
    .maybeSingle();

  if (existing) return NextResponse.json({ room_id: existing.id, is_new: false });

  // Buat room baru
  const { data: created, error } = await supabase
    .from("chat_rooms")
    .insert({ participant1: p1, participant2: p2 })
    .select("id")
    .single();

  if (error || !created) {
    console.error("create chat room error:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }

  return NextResponse.json({ room_id: created.id, is_new: true });
}
