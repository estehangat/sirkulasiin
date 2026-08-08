"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { sendNotification } from "@/lib/notifications";
import { createMidtransTransaction, PAYMENT_EXPIRY_MINUTES } from "@/lib/midtrans";

export type WtbState = {
  error?: string;
  success?: string;
  room_id?: string;
} | null;

type SupabaseServer = Awaited<ReturnType<typeof createServerSupabaseClient>>;

const WTB_CATEGORIES = ["glass", "plastic", "paper", "metal", "textile", "electronic", "other"];

function parseRupiah(raw: string | null) {
  return parseInt((raw || "").replace(/\./g, "").replace(/\D/g, "") || "0");
}

async function getOrCreateRoom(supabase: SupabaseServer, a: string, b: string) {
  const [p1, p2] = [a, b].sort();

  const { data: existingRoom } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("participant1", p1)
    .eq("participant2", p2)
    .maybeSingle();

  if (existingRoom) return existingRoom.id;

  const { data: newRoom, error } = await supabase
    .from("chat_rooms")
    .insert({ participant1: p1, participant2: p2 })
    .select("id")
    .single();

  if (error || !newRoom) {
    console.error("Failed to create chat room for WTB:", error);
    return null;
  }

  return newRoom.id;
}

async function postRoomTextMessage(
  supabase: SupabaseServer,
  userA: string,
  userB: string,
  senderId: string,
  content: string,
  metadata: Record<string, unknown> | null = null
) {
  const roomId = await getOrCreateRoom(supabase, userA, userB);
  if (!roomId) return;

  await supabase.from("chat_messages").insert({
    room_id: roomId,
    sender_id: senderId,
    content,
    type: "text",
    metadata,
  });
}

// ═══════════════════════════════════════════
// CRUD PERMINTAAN (WTB post)
// ═══════════════════════════════════════════

export async function createWtbRequest(
  _prevState: WtbState,
  formData: FormData
): Promise<WtbState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda harus login untuk membuat permintaan." };
  }

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const budgetMax = parseRupiah(formData.get("budget_max") as string);
  const city = (formData.get("city") as string)?.trim();

  if (!title || !category || !city) {
    return { error: "Judul, kategori, dan kota wajib diisi." };
  }

  if (!WTB_CATEGORIES.includes(category)) {
    return { error: "Kategori tidak valid." };
  }

  if (!budgetMax || budgetMax <= 0) {
    return { error: "Budget maksimal harus lebih dari 0." };
  }

  const { data: wtb, error } = await supabase
    .from("wtb_requests")
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      category,
      budget_max: budgetMax,
      city,
      status: "open",
    })
    .select("id")
    .single();

  if (error || !wtb) {
    console.error("Error creating WTB request:", error);
    return { error: "Gagal membuat permintaan. Silakan coba lagi." };
  }

  revalidatePath("/marketplace?tab=dicari");
  redirect(`/wtb/${wtb.id}`);
}

export async function updateWtbRequest(
  _prevState: WtbState,
  formData: FormData
): Promise<WtbState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Anda harus login." };

  const wtbId = formData.get("wtb_id") as string;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const budgetMax = parseRupiah(formData.get("budget_max") as string);
  const city = (formData.get("city") as string)?.trim();

  if (!wtbId || !title || !category || !city || !budgetMax || budgetMax <= 0) {
    return { error: "Judul, kategori, kota, dan budget wajib diisi dengan benar." };
  }

  if (!WTB_CATEGORIES.includes(category)) {
    return { error: "Kategori tidak valid." };
  }

  const { data: wtb } = await supabase
    .from("wtb_requests")
    .select("id, user_id, status")
    .eq("id", wtbId)
    .single();

  if (!wtb || wtb.user_id !== user.id) {
    return { error: "Permintaan tidak ditemukan." };
  }

  if (wtb.status !== "open") {
    return { error: "Permintaan yang sudah diproses tidak bisa diubah." };
  }

  const { error } = await supabase
    .from("wtb_requests")
    .update({
      title,
      description: description || null,
      category,
      budget_max: budgetMax,
      city,
    })
    .eq("id", wtbId)
    .eq("status", "open");

  if (error) {
    console.error("Error updating WTB:", error);
    return { error: "Gagal menyimpan perubahan." };
  }

  revalidatePath(`/wtb/${wtbId}`);
  revalidatePath("/marketplace?tab=dicari");
  revalidatePath("/dashboard/wtb");
  return { success: "Permintaan berhasil diperbarui." };
}

export async function closeWtbRequest(wtbId: string): Promise<WtbState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Anda harus login." };

  const { data: wtb } = await supabase
    .from("wtb_requests")
    .select("id, user_id, status, title")
    .eq("id", wtbId)
    .single();

  if (!wtb || wtb.user_id !== user.id) {
    return { error: "Permintaan tidak ditemukan." };
  }

  if (wtb.status === "in_checkout") {
    return { error: "Ada pembayaran yang sedang berjalan. Tunggu hingga selesai atau kedaluwarsa." };
  }

  if (wtb.status !== "open") {
    return { error: "Permintaan ini sudah ditutup." };
  }

  const { error } = await supabase
    .from("wtb_requests")
    .update({ status: "closed" })
    .eq("id", wtbId)
    .eq("status", "open");

  if (error) {
    console.error("Error closing WTB:", error);
    return { error: "Gagal menutup permintaan." };
  }

  // Batalkan semua offer pending + kabari seller-nya
  const { data: pendingOffers } = await supabase
    .from("wtb_offers")
    .update({ status: "cancelled" })
    .eq("wtb_id", wtbId)
    .eq("status", "pending")
    .select("seller_id");

  for (const offer of pendingOffers ?? []) {
    await sendNotification({
      userId: offer.seller_id,
      type: "transaction",
      title: "Permintaan Ditutup",
      message: `Permintaan "${wtb.title}" ditutup oleh pembuatnya, tawaran Anda dibatalkan.`,
      link: "/dashboard/wtb",
      metadata: { wtb_id: wtbId, wtb_status: "closed" },
    });
  }

  revalidatePath(`/wtb/${wtbId}`);
  revalidatePath("/marketplace?tab=dicari");
  revalidatePath("/dashboard/wtb");
  return { success: "Permintaan berhasil ditutup." };
}

// ═══════════════════════════════════════════
// OFFER DARI SELLER
// ═══════════════════════════════════════════

export async function submitWtbOffer(
  _prevState: WtbState,
  formData: FormData
): Promise<WtbState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda harus login untuk menawarkan barang." };
  }

  const wtbId = formData.get("wtb_id") as string;
  const itemName = (formData.get("item_name") as string)?.trim();
  const itemDescription = (formData.get("item_description") as string)?.trim();
  const itemImageUrl = (formData.get("item_image_url") as string)?.trim();
  const price = parseRupiah(formData.get("price") as string);
  const weightGrams = parseInt(formData.get("weight_grams") as string) || 1000;
  const message = (formData.get("message") as string)?.trim();

  if (!wtbId || !itemName) {
    return { error: "Nama barang yang ditawarkan wajib diisi." };
  }

  if (!price || price <= 0) {
    return { error: "Harga penawaran harus lebih dari 0." };
  }

  const { data: wtb } = await supabase
    .from("wtb_requests")
    .select("id, user_id, title, status, expires_at")
    .eq("id", wtbId)
    .single();

  if (!wtb) {
    return { error: "Permintaan tidak ditemukan." };
  }

  if (wtb.user_id === user.id) {
    return { error: "Anda tidak bisa menawar permintaan sendiri." };
  }

  const isExpired = new Date(wtb.expires_at).getTime() <= Date.now();
  if (wtb.status !== "open" || isExpired) {
    return { error: "Permintaan ini sudah tidak menerima tawaran." };
  }

  // Seller wajib punya alamat terstruktur — dipakai sebagai origin ongkir saat checkout
  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select("shipping_area_id")
    .eq("id", user.id)
    .single();

  if (!sellerProfile?.shipping_area_id) {
    return { error: "Lengkapi alamat pengiriman di Pengaturan dulu sebelum menawarkan barang." };
  }

  const { data: offer, error } = await supabase
    .from("wtb_offers")
    .insert({
      wtb_id: wtbId,
      seller_id: user.id,
      item_name: itemName,
      item_description: itemDescription || null,
      item_image_url: itemImageUrl || null,
      price,
      weight_grams: weightGrams > 0 ? weightGrams : 1000,
      message: message || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Anda sudah pernah mengirim tawaran untuk permintaan ini." };
    }
    console.error("Error submitting WTB offer:", error);
    return { error: "Gagal mengirim tawaran. Silakan coba lagi." };
  }

  // ── Chat room + bubble wtb_card ──
  const roomId = await getOrCreateRoom(supabase, user.id, wtb.user_id);

  if (roomId) {
    await supabase.from("chat_messages").insert({
      room_id: roomId,
      sender_id: user.id,
      content: "",
      type: "wtb_card",
      metadata: {
        wtb_id: wtbId,
        wtb_title: wtb.title,
        offer_id: offer.id,
        item_name: itemName,
        item_description: itemDescription || null,
        item_image_url: itemImageUrl || null,
        price,
        message: message || null,
      },
    });
  }

  await sendNotification({
    userId: wtb.user_id,
    type: "transaction",
    title: "Tawaran Baru untuk Permintaan Anda",
    message: `${user.email || "Seseorang"} menawarkan "${itemName}" untuk permintaan ${wtb.title}.`,
    link: `/wtb/${wtbId}`,
    metadata: { wtb_id: wtbId, offer_id: offer.id, wtb_status: "offer_pending" },
  });

  revalidatePath(`/wtb/${wtbId}`);
  revalidatePath("/dashboard/wtb");

  return { success: "Tawaran berhasil dikirim ke pembuat permintaan!", room_id: roomId ?? undefined };
}

export async function cancelWtbOffer(offerId: string): Promise<WtbState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Anda harus login." };

  const { data: offer } = await supabase
    .from("wtb_offers")
    .select("id, wtb_id, seller_id, item_name, status")
    .eq("id", offerId)
    .single();

  if (!offer || offer.seller_id !== user.id) {
    return { error: "Tawaran tidak ditemukan." };
  }

  if (offer.status !== "pending") {
    return { error: "Hanya tawaran pending yang bisa dibatalkan." };
  }

  const { error } = await supabase
    .from("wtb_offers")
    .update({ status: "cancelled" })
    .eq("id", offerId)
    .eq("seller_id", user.id)
    .eq("status", "pending");

  if (error) {
    console.error("Error cancelling WTB offer:", error);
    return { error: "Gagal membatalkan tawaran." };
  }

  const { data: wtb } = await supabase
    .from("wtb_requests")
    .select("user_id, title")
    .eq("id", offer.wtb_id)
    .single();

  if (wtb?.user_id) {
    await sendNotification({
      userId: wtb.user_id,
      type: "transaction",
      title: "Tawaran Dibatalkan",
      message: `Tawaran "${offer.item_name}" untuk permintaan ${wtb.title} dibatalkan oleh penawar.`,
      link: `/wtb/${offer.wtb_id}`,
      metadata: { wtb_id: offer.wtb_id, offer_id: offerId, wtb_status: "offer_cancelled" },
    });
  }

  revalidatePath(`/wtb/${offer.wtb_id}`);
  revalidatePath("/dashboard/wtb");
  return { success: "Tawaran berhasil dibatalkan." };
}

// ═══════════════════════════════════════════
// RESPON DARI PEMILIK WTB
// ═══════════════════════════════════════════

export async function respondWtbOffer(
  offerId: string,
  action: "accepted" | "rejected"
): Promise<WtbState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Anda harus login." };

  const { data: offer } = await supabase
    .from("wtb_offers")
    .select("id, wtb_id, seller_id, item_name, price, status")
    .eq("id", offerId)
    .single();

  if (!offer) return { error: "Tawaran tidak ditemukan." };

  if (offer.status !== "pending") {
    return { error: "Tawaran ini sudah pernah diproses." };
  }

  const { data: wtb } = await supabase
    .from("wtb_requests")
    .select("id, user_id, title, status")
    .eq("id", offer.wtb_id)
    .single();

  if (!wtb || wtb.user_id !== user.id) {
    return { error: "Anda tidak berhak merespons tawaran ini." };
  }

  if (wtb.status !== "open") {
    return { error: "Permintaan ini sudah tidak menerima respon baru." };
  }

  const { error } = await supabase
    .from("wtb_offers")
    .update({ status: action })
    .eq("id", offerId)
    .eq("status", "pending");

  if (error) {
    console.error("Error responding to WTB offer:", error);
    return { error: "Gagal merespons tawaran." };
  }

  if (action === "accepted") {
    // Kunci WTB ke offer ini; batalkan offer pending lain
    const { error: lockError } = await supabase
      .from("wtb_requests")
      .update({ status: "in_checkout", accepted_offer_id: offerId })
      .eq("id", wtb.id)
      .eq("status", "open");

    if (lockError) {
      console.error("Error locking WTB:", lockError);
      return { error: "Tawaran diterima, tetapi gagal mengunci permintaan." };
    }

    await supabase
      .from("wtb_offers")
      .update({ status: "cancelled" })
      .eq("wtb_id", wtb.id)
      .eq("status", "pending")
      .neq("id", offerId);
  }

  const content =
    action === "accepted"
      ? `Tawaran "${offer.item_name}" untuk permintaan ${wtb.title} diterima. Menunggu pembayaran dari pembuat permintaan.`
      : `Tawaran "${offer.item_name}" untuk permintaan ${wtb.title} ditolak.`;

  await postRoomTextMessage(supabase, user.id, offer.seller_id, user.id, content, {
    kind: "wtb_status",
    action,
  });

  await sendNotification({
    userId: offer.seller_id,
    type: "transaction",
    title: action === "accepted" ? "Tawaran Diterima" : "Tawaran Ditolak",
    message:
      action === "accepted"
        ? `Tawaran "${offer.item_name}" diterima! Menunggu pembayaran dari pembuat permintaan.`
        : `Tawaran "${offer.item_name}" untuk permintaan ${wtb.title} ditolak.`,
    link: "/dashboard/wtb",
    metadata: { wtb_id: wtb.id, offer_id: offerId, wtb_status: action },
  });

  revalidatePath(`/wtb/${wtb.id}`);
  revalidatePath("/dashboard/wtb");

  if (action === "accepted") {
    redirect(`/wtb/${wtb.id}/checkout`);
  }

  return { success: "Tawaran ditolak." };
}

// ═══════════════════════════════════════════
// CHECKOUT WTB (buyer = pembuat permintaan)
// ═══════════════════════════════════════════

export async function placeWtbOrder(
  _prevState: WtbState,
  formData: FormData
): Promise<WtbState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anda harus login untuk melakukan pembayaran." };
  }

  const wtbId = formData.get("wtb_id") as string;
  const shippingName = (formData.get("shipping_name") as string)?.trim();
  const shippingPhone = (formData.get("shipping_phone") as string)?.trim();
  const shippingAddress = (formData.get("shipping_address") as string)?.trim();
  const shippingNotes = (formData.get("shipping_notes") as string)?.trim();
  const totalPrice = parseInt(formData.get("total_price") as string) || 0;
  const shippingCost = parseInt(formData.get("shipping_cost") as string) || 0;
  const shippingCourier = (formData.get("shipping_courier") as string)?.trim();
  const shippingService = (formData.get("shipping_service") as string)?.trim();
  const shippingEtd = (formData.get("shipping_etd") as string)?.trim();
  const originAreaId = (formData.get("shipping_origin_area_id") as string)?.trim();
  const originPostal = (formData.get("shipping_origin_postal") as string)?.trim();
  const destAreaId = (formData.get("shipping_destination_area_id") as string)?.trim();
  const destPostal = (formData.get("shipping_destination_postal") as string)?.trim();

  if (!wtbId || !shippingName || !shippingPhone || !shippingAddress) {
    return { error: "Data pengiriman tidak lengkap." };
  }

  const { data: wtb } = await supabase
    .from("wtb_requests")
    .select("id, user_id, title, status, accepted_offer_id")
    .eq("id", wtbId)
    .single();

  if (!wtb || wtb.user_id !== user.id) {
    return { error: "Permintaan tidak ditemukan." };
  }

  if (wtb.status !== "in_checkout" || !wtb.accepted_offer_id) {
    return { error: "Permintaan ini tidak sedang menunggu pembayaran." };
  }

  const { data: offer } = await supabase
    .from("wtb_offers")
    .select("id, seller_id, item_name, price, status")
    .eq("id", wtb.accepted_offer_id)
    .single();

  if (!offer || offer.status !== "accepted") {
    return { error: "Tawaran yang dipilih sudah tidak valid." };
  }

  if (!totalPrice || totalPrice !== offer.price + shippingCost) {
    return { error: "Harga tidak valid." };
  }

  if (shippingCost > 0 && !shippingCourier) {
    return { error: "Silakan pilih kurir pengiriman." };
  }

  const { data: orderId, error: rpcError } = await supabase.rpc("rpc_place_wtb_order", {
    p_offer_id: offer.id,
    p_shipping_name: shippingName,
    p_shipping_phone: shippingPhone,
    p_shipping_address: shippingAddress,
    p_shipping_notes: shippingNotes || null,
    p_total_price: totalPrice,
    p_shipping_cost: shippingCost,
    p_shipping_courier: shippingCourier || null,
    p_shipping_service: shippingService || null,
    p_shipping_etd: shippingEtd || null,
    p_shipping_origin_area_id: originAreaId || null,
    p_shipping_origin_postal: originPostal || null,
    p_shipping_destination_area_id: destAreaId || null,
    p_shipping_destination_postal: destPostal || null,
  });

  if (rpcError || !orderId) {
    console.error("RPC place_wtb_order error:", rpcError);
    return { error: "Gagal membuat pesanan. Silakan coba lagi." };
  }

  const paymentReference = `SIRK-${orderId}`;

  try {
    const transaction = await createMidtransTransaction({
      localOrderId: orderId,
      paymentReference,
      listingId: offer.id,
      itemName: `${offer.item_name} (WTB: ${wtb.title})`,
      grossAmount: totalPrice,
      customerName: shippingName,
      customerEmail: user.email,
      customerPhone: shippingPhone,
      shippingAddress,
      shippingCost,
      shippingCourier,
      shippingService,
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
        payment_expired_at: new Date(Date.now() + PAYMENT_EXPIRY_MINUTES * 60 * 1000).toISOString(),
      })
      .eq("id", orderId);

    if (paymentUpdateError) {
      throw paymentUpdateError;
    }
  } catch (error) {
    console.error("Midtrans WTB transaction error:", error);

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

      // Rollback lock: WTB terbuka lagi, offer kembali pending
      await adminSupabase
        .from("wtb_requests")
        .update({ status: "open", accepted_offer_id: null })
        .eq("id", wtbId)
        .eq("status", "in_checkout");
      await adminSupabase
        .from("wtb_offers")
        .update({ status: "pending" })
        .eq("id", offer.id)
        .eq("status", "accepted");
    } catch (rollbackError) {
      console.error("Midtrans WTB rollback error:", rollbackError);
    }

    return { error: "Gagal membuat sesi pembayaran Midtrans. Silakan coba lagi." };
  }

  await sendNotification({
    userId: offer.seller_id,
    type: "transaction",
    title: "Pembayaran Dimulai",
    message: `Pembuat permintaan sedang memproses pembayaran untuk "${offer.item_name}".`,
    link: "/dashboard/transactions",
    metadata: { wtb_id: wtbId, offer_id: offer.id, order_id: orderId },
  });

  redirect(`/marketplace/order/${orderId}/payment`);
}
