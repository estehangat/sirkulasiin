import { createHash } from "crypto";
import midtransClient from "midtrans-client";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export const PAYMENT_EXPIRY_MINUTES = 60;

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
        price: grossAmount,
        quantity: 1,
        name: truncateItemName(itemName),
      },
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

  const snap = getMidtransSnap();
  return (await snap.transaction.notification(payload)) as MidtransTransactionStatus;
}

export async function syncOrderWithMidtransStatus(payload: MidtransTransactionStatus) {
  const supabase = createAdminSupabaseClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status, listing_id, paid_at")
    .eq("payment_reference", payload.order_id)
    .single();

  if (error || !order) {
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
    nextEscrowStatus = "held";
    nextPayoutStatus = currentStatus === "paid_out" ? "released" : "pending";
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
    const { error: listingError } = await supabase
      .from("marketplace_listings")
      .update({ status: "published", reserved_at: null })
      .eq("id", order.listing_id)
      .eq("status", "reserved");

    if (listingError) {
      return { ok: false, error: listingError.message };
    }
  }

  return { ok: true, orderId: order.id, status: nextOrderStatus };
}
