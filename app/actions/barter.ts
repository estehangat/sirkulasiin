"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";

export type BarterOfferState = {
  error?: string;
  success?: string;
} | null;

export async function submitBarterOffer(
  _prevState: BarterOfferState,
  formData: FormData
): Promise<BarterOfferState> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda harus login untuk mengajukan tawaran barter." };
  }

  const listingId = formData.get("listing_id") as string;
  const offeredItemName = formData.get("offered_item_name") as string;
  const offeredItemDescription = formData.get("offered_item_description") as string;
  const cashAdditionStr = formData.get("cash_addition") as string;
  const message = formData.get("message") as string;

  if (!listingId || !offeredItemName) {
    return { error: "Nama barang yang ditawarkan wajib diisi." };
  }

  // Cegah user barter listing sendiri
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("user_id, barter_enabled")
    .eq("id", listingId)
    .single();

  if (!listing) {
    return { error: "Listing tidak ditemukan." };
  }

  if (listing.user_id === user.id) {
    return { error: "Anda tidak bisa barter dengan listing sendiri." };
  }

  if (!listing.barter_enabled) {
    return { error: "Listing ini tidak menerima barter." };
  }

  const cashAddition = parseInt(cashAdditionStr?.replace(/\./g, "") || "0");

  const { error } = await supabase.from("barter_offers").insert({
    listing_id: listingId,
    offerer_id: user.id,
    offered_item_name: offeredItemName,
    offered_item_description: offeredItemDescription || null,
    cash_addition: cashAddition,
    message: message || null,
  });

  if (error) {
    console.error("Error submitting barter offer:", error);
    return { error: "Gagal mengirim tawaran. Silakan coba lagi." };
  }

  return { success: "Tawaran barter berhasil dikirim!" };
}

export async function respondBarterOffer(
  offerId: string,
  status: "accepted" | "rejected",
  sellerResponse?: string
): Promise<BarterOfferState> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda harus login." };
  }

  // Verifikasi bahwa user adalah pemilik listing
  const { data: offer } = await supabase
    .from("barter_offers")
    .select("listing_id")
    .eq("id", offerId)
    .single();

  if (!offer) return { error: "Tawaran tidak ditemukan." };

  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("user_id")
    .eq("id", offer.listing_id)
    .single();

  if (!listing || listing.user_id !== user.id) {
    return { error: "Anda tidak berhak merespons tawaran ini." };
  }

  const { error } = await supabase
    .from("barter_offers")
    .update({
      status,
      seller_response: sellerResponse || null,
    })
    .eq("id", offerId);

  if (error) {
    console.error("Error responding to barter:", error);
    return { error: "Gagal merespons tawaran." };
  }

  return {
    success: status === "accepted" ? "Tawaran diterima!" : "Tawaran ditolak.",
  };
}
