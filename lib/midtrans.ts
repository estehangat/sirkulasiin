import { createHash } from "crypto";
import midtransClient from "midtrans-client";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export const PAYMENT_EXPIRY_MINUTES = 60;

type MidtransSyncResult =
  | { ok: true; orderId: string; status: string }
  | { ok: false; error: string };

type ExpireOrderResult =
  | { ok: true; status: "payment_expired" }
  | { ok: false; error: string };

type ReconcileExpiredOrderResult =
  | { ok: true; expired: false }
  | { ok: true; expired: true; status: "payment_expired" }
  | { ok: false; error: string };

export type MidtransTransactionStatus = {
  order_id: string;
  transaction_status: string;
  status_code: string;
  gross_amount: string;
  signature_key?: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_id?: string;
  transaction_time?: string;
  settlement_time?: string;
  status_message?: string;
  currency?: string;
  [key: string]: unknown;
};

type CreateMidtransTransactionInput = {
  localOrderId: string;
  paymentReference: string;
  listingId: string;
  itemName: string;
  grossAmount: number;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  shippingAddress: string;
  shippingCost?: number;
  shippingCourier?: string;
  shippingService?: string;
};

function getMidtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY is missing.");
  }

  return {
    serverKey,
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  };
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function getPaymentPageUrl(orderId: string) {
  return `${getSiteUrl()}/marketplace/order/${orderId}/payment`;
}

function getMidtransSnap() {
  const { serverKey, isProduction } = getMidtransConfig();

  return new midtransClient.Snap({
    serverKey,
    isProduction,
  });
}

function truncateItemName(name: string) {
  return name.length > 50 ? `${name.slice(0, 47)}...` : name;
}

function toIsoString(value?: string) {
  if (!value) return null;

  const normalized = value.includes("+")
    ? value.replace(" ", "T").replace(/ (\+\d{4})$/, "$1")
    : value.replace(" ", "T");
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isPastDue(value?: string | null) {
  if (!value) return false;
  return new Date(value).getTime() <= Date.now();
}

// Rollback sumber order saat pembayaran gagal/kedaluwarsa:
// listing → republish, offer WTB → buka kembali permintaan + offer pending lagi.
async function releaseOrderSource(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  order: { listing_id: string | null; wtb_offer_id?: string | null }
) {
  if (order.listing_id) {
    const { error } = await supabase
      .from("marketplace_listings")
      .update({ status: "published", reserved_at: null })
      .eq("id", order.listing_id)
      .eq("status", "reserved");

    return error ? { ok: false as const, error: error.message } : { ok: true as const };
  }

  if (order.wtb_offer_id) {
    const { data: offer, error: offerError } = await supabase
      .from("wtb_offers")
      .update({ status: "pending" })
      .eq("id", order.wtb_offer_id)
      .eq("status", "accepted")
      .select("wtb_id")
      .single();

    if (offerError || !offer) {
      return { ok: false as const, error: offerError?.message || "Offer WTB tidak ditemukan." };
    }

    const { error: wtbError } = await supabase
      .from("wtb_requests")
      .update({ status: "open", accepted_offer_id: null })
      .eq("id", offer.wtb_id)
      .eq("status", "in_checkout");

    return wtbError ? { ok: false as const, error: wtbError.message } : { ok: true as const };
  }

  return { ok: true as const };
}

export async function markOrderAsExpired(
  orderId: string,
  listingId: string | null,
  wtbOfferId?: string | null
): Promise<ExpireOrderResult> {
  const supabase = createAdminSupabaseClient();

  const { error: orderError } = await supabase
    .from("orders")
    .update({
      status: "payment_expired",
      payment_status: "expire",
      escrow_status: "cancelled",
      payout_status: "cancelled",
    })
    .eq("id", orderId)
    .eq("status", "pending_payment");

  if (orderError) {
    return { ok: false, error: orderError.message };
  }

  const release = await releaseOrderSource(supabase, { listing_id: listingId, wtb_offer_id: wtbOfferId });
  if (!release.ok) {
    return { ok: false, error: release.error };
  }

  return { ok: true, status: "payment_expired" };
}

export async function reconcileExpiredOrder(order: {
  id: string;
  status: string;
  listing_id: string | null;
  wtb_offer_id?: string | null;
  payment_expired_at?: string | null;
}): Promise<ReconcileExpiredOrderResult> {
  if (order.status !== "pending_payment" || !isPastDue(order.payment_expired_at)) {
    return { ok: true, expired: false };
  }

  const result = await markOrderAsExpired(order.id, order.listing_id, order.wtb_offer_id);
  if (!result.ok) {
    return result;
  }

  return { ok: true, expired: true, status: "payment_expired" };
}

export async function createMidtransTransaction({
  localOrderId,
  paymentReference,
  listingId,
  itemName,
  grossAmount,
  customerName,
  customerEmail,
  customerPhone,
  shippingAddress,
  shippingCost,
  shippingCourier,
  shippingService,
}: CreateMidtransTransactionInput) {
  const snap = getMidtransSnap();

  return snap.createTransaction({
    transaction_details: {
      order_id: paymentReference,
      gross_amount: grossAmount,
    },
    credit_card: {
      secure: true,
    },
    item_details: [
      {
        id: listingId,
        price: grossAmount - (shippingCost ?? 0),
        quantity: 1,
        name: truncateItemName(itemName),
      },
      ...((shippingCost && shippingCost > 0) ? [{
        id: "SHIPPING",
        price: shippingCost,
        quantity: 1,
        name: `Ongkir ${(shippingCourier ?? "").toUpperCase()} ${shippingService ?? ""}`.trim(),
      }] : []),
    ],
    customer_details: {
      first_name: customerName,
      email: customerEmail || undefined,
      phone: customerPhone,
      shipping_address: {
        first_name: customerName,
        email: customerEmail || undefined,
        phone: customerPhone,
        address: shippingAddress,
        country_code: "IDN",
      },
    },
    expiry: {
      unit: "minutes",
      duration: PAYMENT_EXPIRY_MINUTES,
    },
    callbacks: {
      finish: getPaymentPageUrl(localOrderId),
    },
  }) as Promise<{ token: string; redirect_url: string }>;
}

export async function getMidtransTransactionStatus(paymentReference: string) {
  const snap = getMidtransSnap();
  return snap.transaction.status(paymentReference) as Promise<MidtransTransactionStatus>;
}

export async function verifyAndNormalizeNotification(payload: MidtransTransactionStatus) {
  const { serverKey } = getMidtransConfig();

  if (!payload.signature_key) {
    return null;
  }

  const expectedSignature = createHash("sha512")
    .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`)
    .digest("hex");

  if (payload.signature_key !== expectedSignature) {
    return null;
  }

  // The dashboard "test notification" and some delivery attempts should not depend on an outbound
  // Midtrans API call. After verifying signature, trust the payload we received.
  return payload;
}

export async function syncOrderWithMidtransStatus(
  payload: MidtransTransactionStatus
): Promise<MidtransSyncResult> {
  const supabase = createAdminSupabaseClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status, listing_id, wtb_offer_id, paid_at, escrow_status, payout_status")
    .eq("payment_reference", payload.order_id)
    .single();

  if (error || !order) {
    // Midtrans can send "test notification" with a synthetic order_id, or we may get a late notify
    // after an order was deleted. Treat as non-fatal so webhook can still return 200.
    return { ok: false, error: "Order tidak ditemukan untuk notifikasi Midtrans." };
  }

  const transactionStatus = payload.transaction_status;
  const fraudStatus = payload.fraud_status;
  const currentStatus = order.status;
  const isPaidState =
    transactionStatus === "settlement" ||
    (transactionStatus === "capture" && fraudStatus === "accept");
  const isFailureState = ["cancel", "expire"].includes(transactionStatus);
  const isProtectedState = ["paid_escrow", "shipped", "completed", "paid_out"].includes(
    currentStatus
  );

  let nextOrderStatus = currentStatus;
  let nextEscrowStatus: string | null = null;
  let nextPayoutStatus: string | null = null;
  let releaseListing = false;

  if (isPaidState) {
    if (["pending_payment", "payment_failed", "payment_expired"].includes(currentStatus)) {
      nextOrderStatus = "paid_escrow";
    }
    // Never regress escrow/payout states for shipped/completed flows.
    if (["pending", "cancelled", null].includes((order.escrow_status as string | null) ?? null)) {
      nextEscrowStatus = "held";
    }
  } else if (
    transactionStatus === "pending" ||
    transactionStatus === "deny" ||
    transactionStatus === "challenge"
  ) {
    if (!isProtectedState) {
      nextOrderStatus = "pending_payment";
    }
  } else if (isFailureState) {
    if (!isProtectedState) {
      nextOrderStatus = transactionStatus === "expire" ? "payment_expired" : "payment_failed";
      nextEscrowStatus = "cancelled";
      nextPayoutStatus = "cancelled";
      releaseListing = true;
    }
  }

  const updates: Record<string, unknown> = {
    payment_provider: "midtrans",
    payment_status: transactionStatus,
    payment_method: payload.payment_type ?? null,
    midtrans_transaction_id: payload.transaction_id ?? null,
    midtrans_raw: payload,
  };

  if (nextOrderStatus !== currentStatus) {
    updates.status = nextOrderStatus;
  }

  if (nextEscrowStatus) {
    updates.escrow_status = nextEscrowStatus;
  }

  if (nextPayoutStatus) {
    updates.payout_status = nextPayoutStatus;
  }

  const paidAt = toIsoString(payload.settlement_time) || toIsoString(payload.transaction_time);
  if (isPaidState && !order.paid_at && paidAt) {
    updates.paid_at = paidAt;
    updates.escrow_held_at = paidAt;
  }

  const { error: updateError } = await supabase.from("orders").update(updates).eq("id", order.id);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  if (releaseListing) {
    const release = await releaseOrderSource(supabase, order);
    if (!release.ok) {
      return { ok: false, error: release.error };
    }
  }

  // Order WTB: pembayaran sukses menutup permintaan (fulfilled)
  if (isPaidState && order.wtb_offer_id && nextOrderStatus === "paid_escrow") {
    const { data: offer } = await supabase
      .from("wtb_offers")
      .select("wtb_id")
      .eq("id", order.wtb_offer_id)
      .single();

    if (offer) {
      await supabase
        .from("wtb_requests")
        .update({ status: "fulfilled" })
        .eq("id", offer.wtb_id)
        .eq("status", "in_checkout");
    }
  }

  return { ok: true, orderId: order.id, status: nextOrderStatus };
}
