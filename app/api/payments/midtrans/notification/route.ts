import { NextRequest, NextResponse } from "next/server";
import {
  syncOrderWithMidtransStatus,
  verifyAndNormalizeNotification,
  type MidtransTransactionStatus,
} from "@/lib/midtrans";

export const runtime = "nodejs";

export async function GET() {
  // Some Midtrans features may probe the URL. Keep this endpoint "always 200" for reachability checks.
  return NextResponse.json({ ok: true });
}

function tryParseNotificationBody(raw: string) {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    // Some Midtrans systems/integrations may send form-encoded body.
    const params = new URLSearchParams(raw);
    const entries = Array.from(params.entries());
    if (!entries.length) return null;
    return Object.fromEntries(entries);
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const parsed = tryParseNotificationBody(raw);
    const payload = (parsed || {}) as MidtransTransactionStatus;

    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ received: true, ignored: true, reason: "unparseable_body" });
    }

    const orderId = typeof payload.order_id === "string" ? payload.order_id : "";
    const isOurOrderId = orderId.startsWith("SIRK-");

    // Midtrans dashboard "Test Notification" uses a synthetic order_id that doesn't map to our DB.
    // Respond 200 unconditionally so Midtrans can validate reachability.
    if (orderId.startsWith("payment_notif_test_")) {
      return NextResponse.json({ received: true, test: true });
    }

    // If this isn't an order we know how to reconcile, acknowledge without processing.
    // This prevents Midtrans recurring/other notification settings from being flagged as failing.
    if (!isOurOrderId) {
      return NextResponse.json({ received: true, ignored: true, reason: "non_app_order_id" });
    }

    const verifiedPayload = await verifyAndNormalizeNotification(payload);

    if (!verifiedPayload) {
      // Only reject our own order IDs. (Should never happen unless server key mismatch.)
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const result = await syncOrderWithMidtransStatus(verifiedPayload);

    if (!result.ok) {
      // Midtrans "Test Notification" uses a synthetic `order_id` that won't exist in our DB.
      // Respond 200 so the endpoint is considered reachable, while keeping real errors visible in logs.
      console.warn("Midtrans notification ignored:", {
        order_id: payload.order_id,
        transaction_status: payload.transaction_status,
        status_code: payload.status_code,
        error: result.error,
      });
      return NextResponse.json({ received: true, ignored: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Midtrans notification error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
