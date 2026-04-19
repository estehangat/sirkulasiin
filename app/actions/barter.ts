"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";

export type BarterOfferState = {
  error?: string;
  success?: string;
  room_id?: string;
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
    .select("user_id, barter_enabled, title")
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

  // ── Create/find chat room and insert barter_card bubble ──
  const sellerId = listing.user_id;
  const [p1, p2] = [user.id, sellerId].sort();

  // Upsert chat room
  const { data: existingRoom } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("participant1", p1)
    .eq("participant2", p2)
    .maybeSingle();

  let roomId: string;

  if (existingRoom) {
    roomId = existingRoom.id;
  } else {
    const { data: newRoom, error: roomErr } = await supabase
      .from("chat_rooms")
      .insert({ participant1: p1, participant2: p2 })
      .select("id")
      .single();

    if (roomErr || !newRoom) {
      // Silently fail chat creation — barter offer already saved
      console.error("Failed to create chat room for barter:", roomErr);
      return { success: "Tawaran barter berhasil dikirim!" };
    }
    roomId = newRoom.id;
  }

  // Insert barter_card message
  await supabase.from("chat_messages").insert({
    room_id: roomId,
    sender_id: user.id,
    content: "",
    type: "barter_card",
    metadata: {
      listing_id: listingId,
      listing_title: listing.title,
      offered_item_name: offeredItemName,
      offered_item_description: offeredItemDescription || null,
      cash_addition: cashAddition,
      message: message || null,
    },
  });

  return { success: "Tawaran barter berhasil dikirim!", room_id: roomId };
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
