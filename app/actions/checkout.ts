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

  // Insert order
  const { error: orderError } = await supabase.from("orders").insert({
    buyer_id: user.id,
    listing_id: listingId,
    seller_id: sellerId,
    shipping_name: shippingName,
    shipping_phone: shippingPhone,
    shipping_address: shippingAddress,
    shipping_notes: shippingNotes || null,
    total_price: totalPrice,
    status: "pending_payment",
  });

  if (orderError) {
    console.error("Order insert error:", orderError);
    return { error: "Gagal membuat pesanan. Silakan coba lagi." };
  }

  // Update listing status ke sold
  const { error: updateError } = await supabase
    .from("marketplace_listings")
    .update({ status: "sold" })
    .eq("id", listingId);

  if (updateError) {
    console.error("Listing update error:", updateError);
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

  redirect(`/marketplace`);
}
