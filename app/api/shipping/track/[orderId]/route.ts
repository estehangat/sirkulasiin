import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getTracking } from "@/lib/biteship";

export const dynamic = "force-dynamic";

// GET /api/shipping/track/:orderId
// Read-only tracking — tidak update DB. Untuk update DB pakai server action
// `syncTrackingAction` atau webhook.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, buyer_id, seller_id, shipping_tracking_id")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }

  if (order.buyer_id !== user.id && order.seller_id !== user.id) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  if (!order.shipping_tracking_id) {
    return NextResponse.json({ error: "Tracking belum tersedia" }, { status: 400 });
  }

  try {
    const tracking = await getTracking(order.shipping_tracking_id);
    return NextResponse.json({ ok: true, ...tracking });
  } catch (err) {
    console.error("[shipping/track] error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Tracking gagal" },
      { status: 502 }
    );
  }
}
