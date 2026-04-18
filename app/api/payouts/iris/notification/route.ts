import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

function normalizeIrisDisbursementStatus(raw?: string | null) {
  const s = (raw || "").toLowerCase();
  if (!s) return null;
  if (s === "completed" || s === "success") return "paid_out";
  if (s === "requested") return "requested";
  if (s === "approved") return "approved";
  if (s === "processing") return "processing";
  if (s === "rejected") return "rejected";
  if (s === "failed") return "failed";
  if (s === "queued" || s === "pending") return s;
  return "unknown";
}

async function readBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return request.json().catch(() => null);
  }

  const text = await request.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function GET() {
  // Health check / probe
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const payload = await readBody(request);
  if (!payload) {
    return NextResponse.json({ ok: true });
  }

  // IRIS payload shape can vary; attempt to extract reference_no + status.
  const referenceNo =
    payload.reference_no || payload.referenceNo || payload.payout_reference || payload.payoutReference;
  const statusRaw = payload.status || payload.payout_status || payload.payoutStatus;
  const status = typeof statusRaw === "string" ? normalizeIrisDisbursementStatus(statusRaw) : null;

  if (!referenceNo || !status) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminSupabaseClient();

  // Best-effort: update any order with matching payout_reference.
  // Avoid regressing an already-paid payout.
  if (status === "paid_out") {
    const completedAt = new Date().toISOString();
    await admin
      .from("orders")
      .update({ payout_status: "paid_out", payout_completed_at: completedAt, status: "paid_out" })
      .eq("payout_reference", referenceNo)
      .eq("status", "completed")
      .neq("payout_status", "paid_out");
  } else {
    await admin
      .from("orders")
      .update({ payout_status: status })
      .eq("payout_reference", referenceNo)
      .neq("payout_status", "paid_out");
  }
  return NextResponse.json({ ok: true });
}
