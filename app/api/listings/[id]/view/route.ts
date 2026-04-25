import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  await supabase.rpc("increment_listing_view", { listing_id: id });

  return NextResponse.json({ ok: true });
}
