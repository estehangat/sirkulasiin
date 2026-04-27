"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import {
  buildPublicTrackingUrl,
  cancelOrder as biteshipCancelOrder,
  createOrder as biteshipCreateOrder,
  getRates as biteshipGetRates,
  getTracking,
  normalizeDeliveryStatus,
} from "@/lib/biteship";

type ActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };

// Origin company info (default fallback dipakai jika seller profile kosong)
const ORIGIN_NAME = process.env.BITESHIP_ORIGIN_NAME || "Warehouse SirkulasiIn";
const ORIGIN_PHONE = process.env.BITESHIP_ORIGIN_PHONE || "081234567890";
const ORIGIN_ADDRESS = process.env.BITESHIP_ORIGIN_ADDRESS || "Jl. SirkulasiIn No. 1";
const ORIGIN_EMAIL = process.env.BITESHIP_ORIGIN_EMAIL || "warehouse@sirkulasiin.id";

type LoadOrderResult =
  | { ok: false; error: string }
  | { ok: true; order: SellerOrder; userId: string };

type SellerOrder = {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  status: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_courier: string | null;
  shipping_service: string | null;
  shipping_cost: number | null;
  shipping_origin_area_id: string | null;
  shipping_origin_postal: string | null;
  shipping_destination_area_id: string | null;
  shipping_destination_postal: string | null;
  awb: string | null;
  shipping_provider: string | null;
  shipping_order_id: string | null;
  shipping_tracking_id: string | null;
  pickup_status: string | null;
  delivery_status: string | null;
  total_price: number;
  marketplace_listings: { title: string; weight_grams: number | null } | null;
  seller: {
    full_name: string | null;
    phone: string | null;
    address: string | null;
    shipping_area_id: string | null;
    shipping_postal: string | null;
    full_address: string | null;
  } | null;
  buyer: { full_name: string | null; phone: string | null } | null;
};

async function loadOrderForSeller(orderId: string): Promise<LoadOrderResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Anda harus login." };
  }

  // Pakai admin client untuk bypass RLS — ownership di-verify manual di bawah.
  // FK orders.seller_id → auth.users(id), BUKAN ke profiles, jadi fetch
  // profile terpisah untuk hindari error PostgREST relationship.
  const adminSupabase = createAdminSupabaseClient();
  const { data: order, error } = await adminSupabase
    .from("orders")
    .select(
      `id, buyer_id, seller_id, listing_id, status,
       shipping_name, shipping_phone, shipping_address,
       shipping_courier, shipping_service, shipping_cost,
       shipping_origin_area_id, shipping_origin_postal,
       shipping_destination_area_id, shipping_destination_postal,
       awb, shipping_provider, shipping_order_id, shipping_tracking_id,
       pickup_status, delivery_status, total_price,
       marketplace_listings ( title, weight_grams )`
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("[shipping] loadOrderForSeller query error:", error);
    return { ok: false, error: `DB error: ${error.message}` };
  }

  if (!order) {
    return { ok: false, error: `Pesanan dengan ID ${orderId} tidak ditemukan.` };
  }

  if (order.seller_id !== user.id) {
    return { ok: false, error: "Hanya penjual yang bisa mengelola pengiriman ini." };
  }

  // Fetch seller profile terpisah
  const { data: sellerProfile } = await adminSupabase
    .from("profiles")
    .select("full_name, phone, address, shipping_area_id, shipping_postal, full_address")
    .eq("id", order.seller_id)
    .maybeSingle();

  const enrichedOrder: SellerOrder = {
    ...(order as unknown as SellerOrder),
    seller: sellerProfile ?? null,
    buyer: null,
  };

  return { ok: true, order: enrichedOrder, userId: user.id };
}


// ─── Action: Create Shipping Order (Generate AWB) ────────────────────────────

export async function createShippingOrderAction(
  orderId: string
): Promise<ActionResult<{ awb: string; orderNo: string }>> {
  const result = await loadOrderForSeller(orderId);
  if (!result.ok) return { success: false, error: result.error };

  const { order } = result;

  if (order.status !== "paid_escrow") {
    return { success: false, error: "Pesanan belum dibayar atau sudah diproses." };
  }
  if (order.awb) {
    return { success: false, error: "Resi sudah pernah dibuat untuk pesanan ini." };
  }
  if (!order.shipping_courier || !order.shipping_service) {
    return { success: false, error: "Pesanan tidak memiliki kurir/layanan." };
  }

  // Origin area_id: prioritas dari seller profile, fallback ke ENV
  const originAreaId = result.order.seller?.shipping_area_id || process.env.BITESHIP_ORIGIN_AREA_ID;
  const originPostal = result.order.seller?.shipping_postal || process.env.BITESHIP_ORIGIN_POSTAL_CODE;
  if (!originAreaId) {
    return {
      success: false,
      error: "Penjual belum mengisi alamat pengiriman di profil.",
    };
  }

  // Destination area_id: dari snapshot order (di-set saat checkout)
  const destinationAreaId = order.shipping_destination_area_id;
  const destinationPostal = order.shipping_destination_postal;
  if (!destinationAreaId) {
    return {
      success: false,
      error: "Pesanan tidak memiliki area pengiriman tujuan. Buyer perlu re-input alamat.",
    };
  }

  const listing = order.marketplace_listings;
  const seller = order.seller;

  const itemPrice = Math.max(0, (order.total_price || 0) - (order.shipping_cost || 0));
  const itemWeight = Math.max(listing?.weight_grams || 500, 100);
  const requestedCourier = order.shipping_courier!.toLowerCase();
  const requestedService = order.shipping_service!.toLowerCase();

  try {
    // Resolve service code yang valid via getRates.
    // Service code di DB (e.g., "dat" dari RajaOngkir) bisa beda dengan Biteship,
    // jadi kita cocokkan otomatis.
    let resolvedCourier = requestedCourier;
    let resolvedService = requestedService;

    try {
      const rates = await biteshipGetRates({
        originAreaId,
        destinationAreaId,
        couriers: requestedCourier,
        items: [{ name: listing?.title || "Item", value: itemPrice, quantity: 1, weight: itemWeight }],
      });

      // Cari service exact match dulu, kalau tidak ada ambil yang pertama untuk courier ini
      const exactMatch = rates.find(
        (r) => r.courier_code === requestedCourier && r.courier_service_code === requestedService
      );
      const courierMatch = rates.find((r) => r.courier_code === requestedCourier);
      const anyMatch = rates[0];

      const picked = exactMatch || courierMatch || anyMatch;
      if (picked) {
        resolvedCourier = picked.courier_code;
        resolvedService = picked.courier_service_code;
        console.info(
          `[shipping] resolved courier ${requestedCourier}/${requestedService} → ${resolvedCourier}/${resolvedService}`
        );
      }
    } catch (rateErr) {
      console.warn("[shipping] getRates gagal, lanjut dengan service requested:", rateErr);
    }

    const created = await biteshipCreateOrder({
      shipperContactName: seller?.full_name || ORIGIN_NAME,
      shipperContactPhone: seller?.phone || ORIGIN_PHONE,
      shipperContactEmail: ORIGIN_EMAIL,
      shipperOrganization: "SirkulasiIn",
      originContactName: seller?.full_name || ORIGIN_NAME,
      originContactPhone: seller?.phone || ORIGIN_PHONE,
      originAddress: seller?.full_address || seller?.address || ORIGIN_ADDRESS,
      originPostalCode: originPostal ? Number(originPostal) : undefined,
      originAreaId,
      destinationContactName: order.shipping_name,
      destinationContactPhone: order.shipping_phone,
      destinationAddress: order.shipping_address,
      destinationPostalCode: destinationPostal ? Number(destinationPostal) : undefined,
      destinationAreaId,
      courierCompany: resolvedCourier,
      courierType: resolvedService,
      deliveryType: "now",
      orderNote: `SirkulasiIn order #${order.id.slice(0, 8)}`,
      items: [
        {
          name: listing?.title || "Produk SirkulasiIn",
          value: itemPrice,
          quantity: 1,
          weight: itemWeight,
        },
      ],
    });

    const trackingId = created.courier?.tracking_id || null;
    const waybill = created.courier?.waybill_id || null;
    const publicUrl =
      created.courier?.link || buildPublicTrackingUrl(created.id);

    const adminSupabase = createAdminSupabaseClient();
    const { error: updateError } = await adminSupabase
      .from("orders")
      .update({
        shipping_provider: "biteship",
        shipping_order_id: created.id,
        shipping_tracking_id: trackingId,
        awb: waybill, // bisa null saat awal — akan diisi via webhook
        awb_created_at: new Date().toISOString(),
        shipping_label_url: created.shipping_label_url ?? null,
        public_tracking_url: publicUrl,
        shipping_raw: created as unknown as object,
        // Biteship auto-pickup saat delivery_type='now' → langsung set requested
        pickup_status: "requested",
        pickup_requested_at: new Date().toISOString(),
        // Setelah order Biteship berhasil dibuat, anggap pesanan "Sedang Dikirim"
        // sehingga pembeli langsung melihat status & tracking di transactions page.
        // Jika asalnya paid_escrow, promote ke shipped.
        ...(order.status === "paid_escrow"
          ? { status: "shipped", shipped_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", orderId)
      .is("shipping_order_id", null); // atomic guard

    if (updateError) {
      console.error("[shipping] update biteship error:", updateError);
      return { success: false, error: "Gagal menyimpan data pengiriman." };
    }

    revalidatePath(`/marketplace/order/${orderId}/payment`);
    revalidatePath("/dashboard/transactions");

    return {
      success: true,
      data: { awb: waybill || "-", orderNo: created.id },
      message: waybill
        ? `Resi berhasil dibuat: ${waybill}`
        : "Order pengiriman dibuat. AWB akan muncul setelah kurir konfirmasi.",
    };
  } catch (err) {
    console.error("[shipping] createShippingOrderAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal membuat resi pengiriman.",
    };
  }
}

// ─── Action: Sync Tracking (manual refresh) ──────────────────────────────────
// Biteship auto-pickup setelah create order, jadi tidak perlu request pickup
// terpisah. Status update via webhook + sync manual ini sebagai fallback.

export async function syncTrackingAction(
  orderId: string
): Promise<ActionResult<{ status: string }>> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Anda harus login." };

  const { data: order } = await supabase
    .from("orders")
    .select("id, buyer_id, seller_id, listing_id, status, shipping_tracking_id")
    .eq("id", orderId)
    .single();

  if (!order) return { success: false, error: "Pesanan tidak ditemukan." };
  if (order.buyer_id !== user.id && order.seller_id !== user.id) {
    return { success: false, error: "Akses ditolak." };
  }
  if (!order.shipping_tracking_id) {
    return { success: false, error: "Pesanan belum memiliki tracking ID." };
  }

  try {
    const tracking = await getTracking(order.shipping_tracking_id);
    const normalized = normalizeDeliveryStatus(tracking.status);

    const adminSupabase = createAdminSupabaseClient();
    const updates: Record<string, unknown> = {
      delivery_status: normalized,
      delivery_history: tracking.history,
    };

    // Update AWB kalau Biteship sudah kasih waybill_id (kadang baru muncul setelah dipickup)
    if (tracking.waybill_id) {
      updates.awb = tracking.waybill_id;
    }

    // Auto-promote order.status saat in_transit / picked_up pertama kali
    if (
      (normalized === "in_transit" || normalized === "picked_up") &&
      order.status === "paid_escrow"
    ) {
      updates.status = "shipped";
      updates.shipped_at = new Date().toISOString();
      updates.pickup_status = "picked_up";
      updates.pickup_at = new Date().toISOString();
    }

    await adminSupabase.from("orders").update(updates).eq("id", orderId);

    revalidatePath(`/marketplace/order/${orderId}/payment`);
    revalidatePath("/dashboard/transactions");

    return { success: true, data: { status: normalized }, message: "Status pengiriman diperbarui." };
  } catch (err) {
    console.error("[shipping] syncTrackingAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal sinkron tracking.",
    };
  }
}

// ─── Action: Cancel Shipping ─────────────────────────────────────────────────

export async function cancelShippingAction(
  orderId: string,
  reason?: string
): Promise<ActionResult> {
  const result = await loadOrderForSeller(orderId);
  if (!result.ok) return { success: false, error: result.error };

  const { order } = result;

  if (!order.shipping_order_id) {
    return { success: false, error: "Tidak ada resi untuk dibatalkan." };
  }
  if (order.pickup_status === "picked_up") {
    return { success: false, error: "Paket sudah dipickup, tidak bisa dibatalkan." };
  }

  try {
    await biteshipCancelOrder(order.shipping_order_id, reason);

    const adminSupabase = createAdminSupabaseClient();
    await adminSupabase
      .from("orders")
      .update({
        awb: null,
        shipping_order_id: null,
        shipping_tracking_id: null,
        awb_created_at: null,
        shipping_label_url: null,
        public_tracking_url: null,
        pickup_status: "cancelled",
        delivery_status: "cancelled",
      })
      .eq("id", orderId);

    revalidatePath(`/marketplace/order/${orderId}/payment`);
    revalidatePath("/dashboard/transactions");

    return { success: true, message: "Resi pengiriman berhasil dibatalkan." };
  } catch (err) {
    console.error("[shipping] cancelShippingAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal membatalkan resi.",
    };
  }
}
