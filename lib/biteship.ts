// ─── Biteship Delivery API Wrapper ───────────────────────────────────────────
// Auth: Authorization: Bearer <api_key>
// Base URL: https://api.biteship.com (sandbox & production via API key)
// Docs: https://biteship.com/id/docs/intro

import crypto from "node:crypto";

const BASE_URL = process.env.BITESHIP_BASE_URL || "https://api.biteship.com";

function getApiKey(): string {
  const key = process.env.BITESHIP_API_KEY;
  if (!key) throw new Error("BITESHIP_API_KEY belum di-set di environment.");
  return key;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type BiteshipArea = {
  id: string;
  name: string;
  country_name: string;
  administrative_division_level_1_name: string;
  administrative_division_level_2_name: string;
  administrative_division_level_3_name: string;
  administrative_division_level_4_name?: string;
  postal_code?: string | number;
};

export type BiteshipRateInput = {
  originAreaId: string;
  destinationAreaId: string;
  couriers: string; // comma-separated: "jne,jnt,sicepat"
  items: BiteshipItem[];
};

export type BiteshipItem = {
  name: string;
  description?: string;
  value: number;
  weight: number; // grams
  quantity: number;
};

export type BiteshipRate = {
  courier_code: string;
  courier_service_code: string;
  courier_service_name: string;
  courier_name: string;
  price: number;
  duration: string;
  type: string;
  description: string;
};

export type BiteshipCreateOrderInput = {
  shipperContactName: string;
  shipperContactPhone: string;
  shipperContactEmail?: string;
  shipperOrganization?: string;
  originContactName: string;
  originContactPhone: string;
  originAddress: string;
  originPostalCode?: number | string;
  originAreaId: string;
  destinationContactName: string;
  destinationContactPhone: string;
  destinationContactEmail?: string;
  destinationAddress: string;
  destinationPostalCode?: number | string;
  destinationAreaId: string;
  courierCompany: string;     // e.g., "jne"
  courierType: string;        // service code, e.g., "reg"
  deliveryType?: "now" | "later";
  orderNote?: string;
  items: BiteshipItem[];
};

export type BiteshipOrder = {
  id: string;
  status: string;
  courier: {
    company: string;
    type: string;
    tracking_id?: string;
    waybill_id?: string | null;
    link?: string;
    name?: string;
  };
  metadata?: Record<string, unknown>;
  shipping_label_url?: string;
};

export type BiteshipTrackingHistory = {
  note: string;
  service_type?: string;
  updated_at: string;
  status?: string;
};

export type BiteshipTracking = {
  status: string;
  waybill_id?: string;
  link?: string;
  history: BiteshipTrackingHistory[];
};

// ─── Internal: fetch helper ──────────────────────────────────────────────────

type FetchOpts = {
  method?: "GET" | "POST" | "DELETE";
  query?: Record<string, string | number | undefined>;
  body?: unknown;
};

async function biteshipFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const apiKey = getApiKey();
  const { method = "GET", query, body } = opts;

  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${apiKey}`,
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  console.info(`[biteship] ${method} ${url.pathname} → ${res.status}`);

  const j = (json as { success?: boolean; error?: string; message?: string }) ?? {};
  if (!res.ok || j.success === false) {
    const msg = j.error || j.message || `Biteship error ${res.status}`;
    // Log payload yang dikirim agar mudah debug
    console.error("[biteship] FAILED payload:", JSON.stringify(body, null, 2));
    console.error("[biteship] FAILED response:", JSON.stringify(json, null, 2));
    throw new Error(`[biteship] ${msg}`);
  }
  return json as T;
}

// ─── Search Area ─────────────────────────────────────────────────────────────

export async function searchAreas(keyword: string): Promise<BiteshipArea[]> {
  const json = await biteshipFetch<{ areas: BiteshipArea[] }>("/v1/maps/areas", {
    query: { countries: "ID", input: keyword, type: "single" },
  });
  return json.areas ?? [];
}

// ─── Get Rates (Cek Ongkir) ──────────────────────────────────────────────────

export async function getRates(input: BiteshipRateInput): Promise<BiteshipRate[]> {
  const body = {
    origin_area_id: input.originAreaId,
    destination_area_id: input.destinationAreaId,
    couriers: input.couriers,
    items: input.items,
  };
  const json = await biteshipFetch<{ pricing: BiteshipRate[] }>("/v1/rates/couriers", {
    method: "POST",
    body,
  });
  return json.pricing ?? [];
}

// ─── Create Order (Generate AWB & Pickup Auto) ───────────────────────────────

export async function createOrder(input: BiteshipCreateOrderInput): Promise<BiteshipOrder> {
  // Build body — postal_code dimasukkan sebagai number jika ada, skip kalau undefined
  // (Biteship dapat derive postal dari area_id pada beberapa kasus)
  const body: Record<string, unknown> = {
    shipper_contact_name: input.shipperContactName,
    shipper_contact_phone: input.shipperContactPhone,
    shipper_contact_email: input.shipperContactEmail,
    shipper_organization: input.shipperOrganization,

    origin_contact_name: input.originContactName,
    origin_contact_phone: input.originContactPhone,
    origin_address: input.originAddress,
    origin_area_id: input.originAreaId,

    destination_contact_name: input.destinationContactName,
    destination_contact_phone: input.destinationContactPhone,
    destination_contact_email: input.destinationContactEmail,
    destination_address: input.destinationAddress,
    destination_area_id: input.destinationAreaId,

    courier_company: input.courierCompany,
    courier_type: input.courierType,
    delivery_type: input.deliveryType ?? "now",
    order_note: input.orderNote,

    items: input.items,
  };

  if (input.originPostalCode !== undefined && input.originPostalCode !== null) {
    body.origin_postal_code = Number(input.originPostalCode);
  }
  if (input.destinationPostalCode !== undefined && input.destinationPostalCode !== null) {
    body.destination_postal_code = Number(input.destinationPostalCode);
  }

  const json = await biteshipFetch<BiteshipOrder>("/v1/orders", {
    method: "POST",
    body,
  });

  if (!json.id) {
    throw new Error("[biteship] Response order tidak mengandung id.");
  }
  return json;
}

// ─── Get Order Detail ────────────────────────────────────────────────────────

export async function getOrder(orderId: string): Promise<BiteshipOrder> {
  return biteshipFetch<BiteshipOrder>(`/v1/orders/${orderId}`);
}

// ─── Cancel Order ────────────────────────────────────────────────────────────

export async function cancelOrder(orderId: string, reason?: string): Promise<unknown> {
  return biteshipFetch<unknown>(`/v1/orders/${orderId}`, {
    method: "DELETE",
    body: { cancellation_reason: reason ?? "Cancelled by seller" },
  });
}

// ─── Tracking ────────────────────────────────────────────────────────────────

export async function getTracking(trackingId: string): Promise<BiteshipTracking> {
  const json = await biteshipFetch<BiteshipTracking>(`/v1/trackings/${trackingId}`);
  return {
    ...json,
    history: Array.isArray(json.history) ? json.history : [],
  };
}

// ─── Public Tracking URL Helper ──────────────────────────────────────────────

export function buildPublicTrackingUrl(orderId: string): string {
  return `https://biteship.com/track/${orderId}`;
}

// ─── Webhook Signature Verification (HMAC-SHA256) ────────────────────────────
// Biteship pasang signature di header `x-biteship-signature` =
//   HMAC-SHA256(rawBody, BITESHIP_WEBHOOK_SECRET)
// Secret di-set saat konfigurasi webhook di dashboard Biteship.

export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.BITESHIP_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[biteship] BITESHIP_WEBHOOK_SECRET tidak di-set, webhook tanpa verifikasi.");
    return true;
  }
  if (!signatureHeader) return false;

  const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  // Biteship kadang prefix dengan "sha256=" — handle both
  const cleaned = signatureHeader.replace(/^sha256=/, "").trim();
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(cleaned));
  } catch {
    return false;
  }
}

// ─── Status Mapping ──────────────────────────────────────────────────────────
// Biteship status: confirmed, allocated, picking_up, picked, dropping_off,
//                  delivered, returned, on_hold, rejected, courier_not_found, cancelled

export type NormalizedDeliveryStatus =
  | "on_process"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "returned"
  | "failed"
  | "cancelled"
  | "unknown";

export function normalizeDeliveryStatus(raw: string | undefined | null): NormalizedDeliveryStatus {
  if (!raw) return "unknown";
  const s = raw.toLowerCase();
  if (s === "delivered" || s.includes("delivered")) return "delivered";
  if (s === "dropping_off" || s.includes("transit") || s === "on_the_way") return "in_transit";
  if (s === "picked" || s === "picking_up" || s.includes("picked")) return "picked_up";
  if (s.includes("return")) return "returned";
  if (s === "cancelled" || s.includes("cancel")) return "cancelled";
  if (s === "rejected" || s === "courier_not_found" || s.includes("fail")) return "failed";
  if (s === "confirmed" || s === "allocated" || s === "on_hold" || s.includes("process")) return "on_process";
  return "unknown";
}
