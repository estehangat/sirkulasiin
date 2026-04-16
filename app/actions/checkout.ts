"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export type CheckoutState = {
  error?: string;
  success?: string;
} | null;

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

  // Validasi
  if (!listingId || !sellerId) {
    return { error: "Data listing tidak valid." };
  }

  if (user.id === sellerId) {
    return { error: "Anda tidak bisa membeli listing Anda sendiri." };
  }

  if (!shippingName || !shippingPhone || !shippingAddress) {
    return { error: "Nama, telepon, dan alamat pengiriman wajib diisi." };
  }

  if (!totalPrice || totalPrice <= 0) {
    return { error: "Harga tidak valid." };
  }

  // Cek listing masih available
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("id, status")
    .eq("id", listingId)
    .single();

  if (!listing || listing.status !== "published") {
    return { error: "Listing ini sudah tidak tersedia." };
  }

  // Panggil RPC untuk insert order & update listing secara atomic (melewati RLS listing)
  const { data: orderId, error: rpcError } = await supabase.rpc("rpc_place_order", {
    p_listing_id: listingId,
    p_seller_id: sellerId,
    p_shipping_name: shippingName,
    p_shipping_phone: shippingPhone,
    p_shipping_address: shippingAddress,
    p_shipping_notes: shippingNotes || null,
    p_total_price: totalPrice,
  });

  if (rpcError || !orderId) {
    console.error("RPC place_order error:", rpcError);
    return { error: "Gagal membuat pesanan. Silakan coba lagi." };
  }

  // Simpan info pengiriman ke profil jika alamat kosong
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

export async function processMockPayment(orderId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("id", orderId)
    .eq("status", "pending_payment");
  
  if (error) {
    console.error("Payment error:", error);
    return { error: "Gagal memproses pembayaran" };
  }

  // Juga tambahkan update pada marketplace_listings untuk validasi ekstra? Tidak perlu, sudah 'sold'
  redirect("/dashboard/transactions");
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);
    
  if (error) {
    console.error("Update status error:", error);
    return { success: false, error: "Gagal mengupdate status" };
  }
  
  return { success: true };
}
