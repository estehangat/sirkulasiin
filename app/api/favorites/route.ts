import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// GET /api/favorites?listing_id=xxx — check if current user favorited
export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listing_id");
  if (!listingId) return NextResponse.json({ favorited: false });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ favorited: false });

  const { data } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  return NextResponse.json({ favorited: !!data });
}

// POST /api/favorites — toggle favorite
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listing_id } = await req.json();
  if (!listing_id) return NextResponse.json({ error: "Missing listing_id" }, { status: 400 });

  // Check if already favorited
  const { data: existing } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listing_id)
    .maybeSingle();

  if (existing) {
    await supabase.from("user_favorites").delete().eq("id", existing.id);
    return NextResponse.json({ favorited: false });
  }

  await supabase.from("user_favorites").insert({ user_id: user.id, listing_id });
  return NextResponse.json({ favorited: true });
}
