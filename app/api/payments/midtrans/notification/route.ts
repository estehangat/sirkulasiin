import { NextRequest, NextResponse } from "next/server";
import {
  syncOrderWithMidtransStatus,
  verifyAndNormalizeNotification,
  type MidtransTransactionStatus,
} from "@/lib/midtrans";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as MidtransTransactionStatus;
    const verifiedPayload = await verifyAndNormalizeNotification(payload);

    if (!verifiedPayload) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const result = await syncOrderWithMidtransStatus({
      ...payload,
      ...verifiedPayload,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Midtrans notification error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
