"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { sendNotification } from "@/lib/notifications";

export type BarterOfferState = {
  error?: string;
  success?: string;
  room_id?: string;
} | null;

function nowIso() {
  return new Date().toISOString();
}

async function findBarterRoomId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, a: string, b: string) {
  const [p1, p2] = [a, b].sort();
  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("participant1", p1)
    .eq("participant2", p2)
    .maybeSingle();

  return room?.id || null;
}

async function postBarterRoomMessage(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userA: string,
  userB: string,
  senderId: string,
  content: string
) {
  const roomId = await findBarterRoomId(supabase, userA, userB);
  if (!roomId) return;

  await supabase.from("chat_messages").insert({
    room_id: roomId,
    sender_id: senderId,
    content,
    type: "text",
    metadata: null,
  });
}

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
    .select("id, user_id, barter_enabled, title, status")
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

  if (listing.status !== "published") {
    return { error: "Listing ini sudah tidak tersedia untuk barter." };
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

  await sendNotification({
    userId: sellerId,
    type: "transaction",
    title: "Tawaran Barter Baru",
    message: `${user.email || "Seseorang"} mengajukan barter untuk ${listing.title}.`,
    link: "/dashboard/barter",
    metadata: { listing_id: listingId, barter_status: "pending" },
  });

  revalidatePath("/dashboard/barter");
  revalidatePath(`/marketplace/${listingId}`);

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
    .select("id, listing_id, offerer_id, offered_item_name, status")
    .eq("id", offerId)
    .single();

  if (!offer) return { error: "Tawaran tidak ditemukan." };

  if (offer.status !== "pending") {
    return { error: "Tawaran ini sudah pernah diproses." };
  }

  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("id, user_id, title, status")
    .eq("id", offer.listing_id)
    .single();

  if (!listing || listing.user_id !== user.id) {
    return { error: "Anda tidak berhak merespons tawaran ini." };
  }

  if (listing.status !== "published") {
    return { error: "Listing ini sudah tidak bisa diproses untuk barter." };
  }

  const { error } = await supabase
    .from("barter_offers")
    .update({
      status,
      seller_response: sellerResponse || null,
      accepted_at: status === "accepted" ? nowIso() : null,
    })
    .eq("id", offerId);

  if (error) {
    console.error("Error responding to barter:", error);
    return { error: "Gagal merespons tawaran." };
  }

  if (status === "accepted") {
    const { error: listingError } = await supabase
      .from("marketplace_listings")
      .update({ status: "sold", sold_via: "barter" })
      .eq("id", listing.id)
      .eq("user_id", user.id)
      .eq("status", "published");

    if (listingError) {
      console.error("Error marking barter listing sold:", listingError);
      return { error: "Tawaran diterima, tetapi gagal menutup listing." };
    }

    const { error: cancelOthersError } = await supabase
      .from("barter_offers")
      .update({
        status: "cancelled",
        seller_response: "Tawaran lain sudah disepakati untuk listing ini.",
      })
      .eq("listing_id", listing.id)
      .eq("status", "pending")
      .neq("id", offerId);

    if (cancelOthersError) {
      console.error("Error cancelling other barter offers:", cancelOthersError);
    }
  }

  const content =
    status === "accepted"
      ? `Tawaran barter untuk ${listing.title} diterima.${sellerResponse ? ` ${sellerResponse}` : ""}`
      : `Tawaran barter untuk ${listing.title} ditolak.${sellerResponse ? ` ${sellerResponse}` : ""}`;

  await postBarterRoomMessage(supabase, user.id, offer.offerer_id, user.id, content);

  await sendNotification({
    userId: offer.offerer_id,
    type: "transaction",
    title: status === "accepted" ? "Barter Disetujui" : "Barter Ditolak",
    message:
      status === "accepted"
        ? `Tawaran barter Anda untuk ${listing.title} diterima.${sellerResponse ? ` ${sellerResponse}` : ""}`
        : `Tawaran barter Anda untuk ${listing.title} ditolak.${sellerResponse ? ` ${sellerResponse}` : ""}`,
    link: "/dashboard/barter",
    metadata: { offer_id: offerId, listing_id: listing.id, barter_status: status },
  });

  revalidatePath("/dashboard/barter");
  revalidatePath("/dashboard/listings");
  revalidatePath(`/marketplace/${listing.id}`);

  return {
    success: status === "accepted" ? "Tawaran diterima!" : "Tawaran ditolak.",
  };
}

export async function cancelBarterOffer(offerId: string): Promise<BarterOfferState> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda harus login." };
  }

  const { data: offer } = await supabase
    .from("barter_offers")
    .select("id, listing_id, offerer_id, status")
    .eq("id", offerId)
    .single();

  if (!offer || offer.offerer_id !== user.id) {
    return { error: "Tawaran tidak ditemukan." };
  }

  if (offer.status !== "pending") {
    return { error: "Hanya tawaran pending yang bisa dibatalkan." };
  }

  const { error } = await supabase
    .from("barter_offers")
    .update({
      status: "cancelled",
      seller_response: "Pengaju membatalkan tawaran barter ini.",
    })
    .eq("id", offerId)
    .eq("offerer_id", user.id)
    .eq("status", "pending");

  if (error) {
    console.error("Error cancelling barter offer:", error);
    return { error: "Gagal membatalkan tawaran barter." };
  }

  revalidatePath("/dashboard/barter");
  revalidatePath(`/marketplace/${offer.listing_id}`);

  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("title, user_id")
    .eq("id", offer.listing_id)
    .single();

  if (listing?.user_id) {
    await sendNotification({
      userId: listing.user_id,
      type: "transaction",
      title: "Tawaran Barter Dibatalkan",
      message: `Pengaju membatalkan salah satu tawaran barter untuk ${listing.title}.`,
      link: "/dashboard/barter",
      metadata: { offer_id: offerId, listing_id: offer.listing_id, barter_status: "cancelled" },
    });
  }

  return { success: "Tawaran barter berhasil dibatalkan." };
}

export async function updateBarterLifecycle(
  offerId: string,
  action: "mark_shipped" | "mark_completed"
): Promise<BarterOfferState> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda harus login." };
  }

  const { data: offer } = await supabase
    .from("barter_offers")
    .select(
      "id, listing_id, offerer_id, status, accepted_at, owner_shipped_at, offerer_shipped_at, owner_completed_at, offerer_completed_at"
    )
    .eq("id", offerId)
    .single();

  if (!offer) return { error: "Tawaran barter tidak ditemukan." };
  if (offer.status !== "accepted") return { error: "Barter ini belum siap diproses lebih lanjut." };

  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("id, title, user_id")
    .eq("id", offer.listing_id)
    .single();

  if (!listing) return { error: "Listing barter tidak ditemukan." };

  const isOwner = listing.user_id === user.id;
  const isOfferer = offer.offerer_id === user.id;
  if (!isOwner && !isOfferer) return { error: "Anda tidak berhak mengubah progres barter ini." };

  const updates: Record<string, string> = {};
  const timestamp = nowIso();
  let success = "";
  let roomMessage = "";
  let notifyUserId: string | null = null;
  let notifyTitle = "";
  let notifyMessage = "";

  if (action === "mark_shipped") {
    if (isOwner) {
      if (offer.owner_shipped_at) return { error: "Anda sudah menandai barang terkirim." };
      updates.owner_shipped_at = timestamp;
      success = "Barang Anda ditandai sudah dikirim/diserahkan.";
      roomMessage = `Pemilik listing menandai barang barter untuk ${listing.title} sudah dikirim/diserahkan.`;
      notifyUserId = offer.offerer_id;
      notifyTitle = "Barter Dalam Pengiriman";
      notifyMessage = `Pemilik listing menandai barang barter untuk ${listing.title} sudah dikirim/diserahkan.`;
    } else {
      if (offer.offerer_shipped_at) return { error: "Anda sudah menandai barang terkirim." };
      updates.offerer_shipped_at = timestamp;
      success = "Barang Anda ditandai sudah dikirim/diserahkan.";
      roomMessage = `Pengaju barter menandai barang barter untuk ${listing.title} sudah dikirim/diserahkan.`;
      notifyUserId = listing.user_id;
      notifyTitle = "Barter Dalam Pengiriman";
      notifyMessage = `Pengaju barter menandai barang barter untuk ${listing.title} sudah dikirim/diserahkan.`;
    }
  }

  if (action === "mark_completed") {
    if (isOwner) {
      if (!offer.offerer_shipped_at) return { error: "Tunggu pihak pengaju menandai barang sudah dikirim dulu." };
      if (offer.owner_completed_at) return { error: "Anda sudah mengonfirmasi barter selesai." };
      updates.owner_completed_at = timestamp;
      success = "Anda mengonfirmasi barter selesai dari sisi Anda.";
      roomMessage = `Pemilik listing mengonfirmasi barter untuk ${listing.title} sudah selesai.`;
      notifyUserId = offer.offerer_id;
      notifyTitle = "Konfirmasi Selesai Barter";
      notifyMessage = `Pemilik listing mengonfirmasi barter untuk ${listing.title} sudah selesai.`;
    } else {
      if (!offer.owner_shipped_at) return { error: "Tunggu pemilik listing menandai barang sudah dikirim dulu." };
      if (offer.offerer_completed_at) return { error: "Anda sudah mengonfirmasi barter selesai." };
      updates.offerer_completed_at = timestamp;
      success = "Anda mengonfirmasi barter selesai dari sisi Anda.";
      roomMessage = `Pengaju barter mengonfirmasi barter untuk ${listing.title} sudah selesai.`;
      notifyUserId = listing.user_id;
      notifyTitle = "Konfirmasi Selesai Barter";
      notifyMessage = `Pengaju barter mengonfirmasi barter untuk ${listing.title} sudah selesai.`;
    }
  }

  const { error: updateError } = await supabase.from("barter_offers").update(updates).eq("id", offerId).eq("status", "accepted");
  if (updateError) {
    console.error("Error updating barter lifecycle:", updateError);
    return { error: "Gagal mengubah progres barter." };
  }

  const ownerCompletedAt = updates.owner_completed_at || offer.owner_completed_at;
  const offererCompletedAt = updates.offerer_completed_at || offer.offerer_completed_at;
  if (ownerCompletedAt && offererCompletedAt) {
    const { error: completeError } = await supabase
      .from("barter_offers")
      .update({ status: "completed" })
      .eq("id", offerId)
      .eq("status", "accepted");

    if (completeError) {
      console.error("Error completing barter:", completeError);
      return { error: "Progress tersimpan, tetapi gagal menandai barter selesai." };
    }

    success = "Kedua pihak sudah mengonfirmasi. Barter selesai.";
    roomMessage = `Kedua pihak sudah mengonfirmasi barter untuk ${listing.title}. Barter selesai.`;
    await sendNotification({
      userId: listing.user_id,
      type: "transaction",
      title: "Barter Selesai",
      message: `Barter untuk ${listing.title} telah dikonfirmasi selesai oleh kedua pihak.`,
      link: "/dashboard/barter",
      metadata: { offer_id: offerId, listing_id: listing.id, barter_status: "completed" },
    });
    if (offer.offerer_id !== listing.user_id) {
      await sendNotification({
        userId: offer.offerer_id,
        type: "transaction",
        title: "Barter Selesai",
        message: `Barter untuk ${listing.title} telah dikonfirmasi selesai oleh kedua pihak.`,
        link: "/dashboard/barter",
        metadata: { offer_id: offerId, listing_id: listing.id, barter_status: "completed" },
      });
    }
  } else if (notifyUserId) {
    await sendNotification({
      userId: notifyUserId,
      type: "transaction",
      title: notifyTitle,
      message: notifyMessage,
      link: "/dashboard/barter",
      metadata: { offer_id: offerId, listing_id: listing.id, barter_status: action },
    });
  }

  await postBarterRoomMessage(supabase, listing.user_id, offer.offerer_id, user.id, roomMessage);

  revalidatePath("/dashboard/barter");
  revalidatePath(`/marketplace/${listing.id}`);

  return { success };
}
