"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createMidtransTransaction,
  getMidtransTransactionStatus,
  PAYMENT_EXPIRY_MINUTES,
  syncOrderWithMidtransStatus,
} from "@/lib/midtrans";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export type CheckoutState = {
  error?: string;
  success?: string;
} | null;

function getPaymentExpiryDate() {
  return new Date(Date.now() + PAYMENT_EXPIRY_MINUTES * 60 * 1000).toISOString();
}

function canAccessOrder(userId: string, order: { buyer_id: string; seller_id: string }) {
  return order.buyer_id === userId || order.seller_id === userId;
}

export async function placeOrder(
  _prevState: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda harus login untuk melakukan pembelian." };
  }

  const listingId = formData.get("listing_id") as string;
  const sellerId = formData.get("seller_id") as string;
  const shippingName = (formData.get("shipping_name") as string)?.trim();
  const shippingPhone = (formData.get("shipping_phone") as string)?.trim();
  const shippingAddress = (formData.get("shipping_address") as string)?.trim();
  const shippingNotes = (formData.get("shipping_notes") as string)?.trim();
  const totalPrice = parseInt(formData.get("total_price") as string) || 0;

  if (!listingId || !sellerId) {
    return { error: "Data listing tidak valid." };
  }

  if (user.id === sellerId) {
    return { error: "Anda tidak bisa membeli listing Anda sendiri." };
  }

  if (!shippingName || !shippingPhone || !shippingAddress) {
    return { error: "Nama, telepon, dan alamat pengiriman wajib diisi." };
  }

  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("id, title, price, status")
    .eq("id", listingId)
    .single();

  if (!listing || listing.status !== "published") {
    return { error: "Listing ini sudah tidak tersedia." };
  }

  if (!totalPrice || totalPrice <= 0 || totalPrice !== listing.price) {
    return { error: "Harga tidak valid." };
  }

  const { data: orderId, error: rpcError } = await supabase.rpc("rpc_place_order", {
    p_listing_id: listingId,
    p_seller_id: sellerId,
    p_shipping_name: shippingName,
    p_shipping_phone: shippingPhone,
    p_shipping_address: shippingAddress,
    p_shipping_notes: shippingNotes || null,
    p_total_price: listing.price,
  });

  if (rpcError || !orderId) {
    console.error("RPC place_order error:", rpcError);
    return { error: "Gagal membuat pesanan. Silakan coba lagi." };
  }

  const paymentReference = `SIRK-${orderId}`;

  try {
    const transaction = await createMidtransTransaction({
      localOrderId: orderId,
      paymentReference,
      listingId,
      itemName: listing.title,
      grossAmount: listing.price,
      customerName: shippingName,
      customerEmail: user.email,
      customerPhone: shippingPhone,
      shippingAddress,
    });

    const adminSupabase = createAdminSupabaseClient();
    const { error: paymentUpdateError } = await adminSupabase
      .from("orders")
      .update({
        payment_provider: "midtrans",
        payment_reference: paymentReference,
        payment_token: transaction.token,
        payment_redirect_url: transaction.redirect_url,
        payment_status: "pending",
        payment_expired_at: getPaymentExpiryDate(),
      })
      .eq("id", orderId);

    if (paymentUpdateError) {
      throw paymentUpdateError;
    }
  } catch (error) {
    console.error("Midtrans transaction error:", error);

    try {
      const adminSupabase = createAdminSupabaseClient();
      await adminSupabase
        .from("orders")
        .update({
          status: "payment_failed",
          payment_provider: "midtrans",
          payment_reference: paymentReference,
          payment_status: "failed_to_create",
          escrow_status: "cancelled",
          payout_status: "cancelled",
        })
        .eq("id", orderId);

      await adminSupabase
        .from("marketplace_listings")
        .update({ status: "published", reserved_at: null })
        .eq("id", listingId)
        .eq("status", "reserved");
    } catch (rollbackError) {
      console.error("Midtrans rollback error:", rollbackError);
    }

    return { error: "Gagal membuat sesi pembayaran Midtrans. Silakan coba lagi." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("address")
    .eq("id", user.id)
    .single();

  if (profile && !profile.address) {
    await supabase
      .from("profiles")
      .update({ address: shippingAddress, phone: shippingPhone })
      .eq("id", user.id);
  }

  redirect(`/marketplace/order/${orderId}/payment`);
}

export async function refreshPaymentStatus(orderId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Anda harus login." };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, buyer_id, seller_id, payment_reference")
    .eq("id", orderId)
    .single();

  if (!order || !canAccessOrder(user.id, order)) {
    return { success: false, error: "Pesanan tidak ditemukan." };
  }

  if (!order.payment_reference) {
    return { success: false, error: "Sesi pembayaran belum tersedia." };
  }

  try {
    const paymentStatus = await getMidtransTransactionStatus(order.payment_reference);
    const result = await syncOrderWithMidtransStatus(paymentStatus);

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    revalidatePath(`/marketplace/order/${orderId}/payment`);
    revalidatePath("/dashboard/transactions");
    return { success: true };
  } catch (error) {
    console.error("Refresh payment status error:", error);
    return { success: false, error: "Gagal memeriksa status pembayaran." };
  }
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Anda harus login." };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, buyer_id, seller_id, listing_id, status")
    .eq("id", orderId)
    .single();

  if (!order) {
    return { success: false, error: "Pesanan tidak ditemukan." };
  }

  const adminSupabase = createAdminSupabaseClient();

  if (newStatus === "shipped") {
    if (order.seller_id !== user.id || order.status !== "paid_escrow") {
      return { success: false, error: "Pesanan belum siap dikirim." };
    }

    const { error } = await adminSupabase
      .from("orders")
      .update({
        status: "shipped",
        shipped_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      console.error("Update status error:", error);
      return { success: false, error: "Gagal mengupdate status" };
    }
  } else if (newStatus === "completed") {
    if (order.buyer_id !== user.id || order.status !== "shipped") {
      return { success: false, error: "Pesanan belum bisa diselesaikan." };
    }

    const completedAt = new Date().toISOString();
    const { error: orderError } = await adminSupabase
      .from("orders")
      .update({
        status: "completed",
        delivered_at: completedAt,
        completed_at: completedAt,
        escrow_status: "releasable",
        escrow_released_at: completedAt,
        payout_status: "ready_for_payout",
      })
      .eq("id", orderId);

    if (orderError) {
      console.error("Complete order error:", orderError);
      return { success: false, error: "Gagal mengupdate status" };
    }

    const { error: listingError } = await adminSupabase
      .from("marketplace_listings")
      .update({ status: "sold" })
      .eq("id", order.listing_id);

    if (listingError) {
      console.error("Update listing status error:", listingError);
      return { success: false, error: "Gagal menyelesaikan transaksi" };
    }
  } else {
    return { success: false, error: "Status tidak didukung." };
  }

  revalidatePath("/dashboard/transactions");
  revalidatePath(`/marketplace/order/${orderId}/payment`);
  return { success: true };
}
