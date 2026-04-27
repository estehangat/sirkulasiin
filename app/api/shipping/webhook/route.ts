import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { normalizeDeliveryStatus, verifyWebhookSignature } from "@/lib/biteship";

export const dynamic = "force-dynamic";

// POST /api/shipping/webhook
// Biteship POST update status pengiriman ke endpoint ini.
// Body shape umum:
// {
//   "event": "order.status",
//   "order_id": "5e7e7d2da4c52h6e2c34gjhg2",
//   "courier_waybill_id": "0012345678",
//   "status": "allocated" | "picking_up" | "picked" | "dropping_off" | "delivered" | ...,
//   "history": [...],
//   "courier_tracking_id": "..."
// }

export async function POST(req: Request) {
  // Baca raw body untuk HMAC verification
  const rawBody = await req.text();

  // ─ Installation validation ───────────────────────────────────────
  // Biteship dashboard kirim test request dengan body kosong / non-JSON
  // saat instalasi webhook. Kita harus respond 200 OK supaya validasi lolos.
  if (!rawBody || !rawBody.trim()) {
    return NextResponse.json({ ok: true, ping: true });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    // Bukan JSON valid → anggap ping/probe → tetap respond OK
    return NextResponse.json({ ok: true, ping: true });
  }

  // Body kosong object {} juga dianggap ping
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ ok: true, ping: true });
  }

  // ─ Signature verification (hanya untuk request real) ─────────────
  const signatureHeader =
    req.headers.get("x-biteship-signature") ||
    req.headers.get("biteship-signature");

  if (!verifyWebhookSignature(rawBody, signatureHeader)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  const orderId =
    (payload.order_id as string) ||
    (payload.id as string) ||
    ((payload.data as Record<string, unknown> | undefined)?.id as string);
  const waybillId =
    (payload.courier_waybill_id as string) ||
    (payload.waybill_id as string) ||
    "";
  const trackingId =
    (payload.courier_tracking_id as string) ||
    (payload.tracking_id as string) ||
    "";
  const rawStatus = (payload.status as string) || "";

  if (!orderId && !waybillId && !trackingId) {
    return NextResponse.json(
      { ok: false, error: "Missing order_id/waybill/tracking_id" },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabaseClient();
  const query = supabase
    .from("orders")
    .select("id, status, awb, shipping_order_id, shipping_tracking_id");

  let lookup;
  if (orderId) {
    lookup = await query.eq("shipping_order_id", orderId).maybeSingle();
  } else if (trackingId) {
    lookup = await query.eq("shipping_tracking_id", trackingId).maybeSingle();
  } else {
    lookup = await query.eq("awb", waybillId).maybeSingle();
  }

  const { data: order, error: lookupError } = lookup;

  if (lookupError) {
    console.error("[biteship/webhook] lookup error:", lookupError);
    return NextResponse.json({ ok: false, error: "DB lookup failed" }, { status: 500 });
  }

  if (!order) {
    console.warn("[biteship/webhook] order tidak ditemukan:", { orderId, waybillId, trackingId });
    // Return 200 supaya Biteship tidak retry storm untuk test event
    return NextResponse.json({ ok: true, skipped: true });
  }

  const normalized = normalizeDeliveryStatus(rawStatus);
  const history =
    (payload.history as unknown[]) ||
    (payload.tracking_history as unknown[]) ||
    [];

  const updates: Record<string, unknown> = {
    delivery_status: normalized,
    delivery_history: history,
  };

  // Update AWB kalau Biteship baru kasih waybill_id sekarang
  if (waybillId && !order.awb) {
    updates.awb = waybillId;
  }

  // Auto-promote order.status saat first in_transit / picked_up
  if (
    (normalized === "in_transit" || normalized === "picked_up") &&
    order.status === "paid_escrow"
  ) {
    updates.status = "shipped";
    updates.shipped_at = new Date().toISOString();
    updates.pickup_status = "picked_up";
    updates.pickup_at = new Date().toISOString();
  }

  // Tidak auto-complete saat delivered — buyer konfirmasi manual demi safety escrow.

  const { error: updateError } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", order.id);

  if (updateError) {
    console.error("[biteship/webhook] update error:", updateError);
    return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    deliveryStatus: normalized,
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "biteship-webhook" });
}
