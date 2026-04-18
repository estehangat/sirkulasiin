"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { isPayoutAdmin } from "@/lib/admin";
import {
  approveIrisPayout,
  createIrisPayout,
  getIrisPayoutDetails,
  rejectIrisPayout,
} from "@/lib/iris";

function getErrorMessage(err: unknown) {
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    return typeof msg === "string" ? msg : null;
  }
  return null;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeIrisDisbursementStatus(raw?: string | null) {
  const s = (raw || "").toLowerCase();
  if (!s) return null;

  // Midtrans docs list DISBURSEMENT statuses: REQUESTED | REJECTED | APPROVED | PROCESSING | COMPLETED | FAILED.
  if (s === "completed" || s === "success") return "paid_out";
  if (s === "requested") return "requested";
  if (s === "approved") return "approved";
  if (s === "processing") return "processing";
  if (s === "rejected") return "rejected";
  if (s === "failed") return "failed";

  // Some client responses may use these, keep them but avoid spraying unknown values.
  if (s === "queued" || s === "pending") return s;

  return "unknown";
}

export async function requestPayout(orderId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Anda harus login." };

  const { data: order } = await supabase
    .from("orders")
    .select("id, seller_id, status, payout_status, payout_amount")
    .eq("id", orderId)
    .single();

  if (!order || order.seller_id !== user.id) {
    return { success: false, error: "Pesanan tidak ditemukan." };
  }

  if (order.status !== "completed" || order.payout_status !== "ready_for_payout") {
    return { success: false, error: "Pesanan belum siap dicairkan." };
  }

  if (!order.payout_amount || order.payout_amount <= 0) {
    return { success: false, error: "Nominal payout tidak valid." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, payout_channel, payout_bank_code, payout_account_number, payout_account_name")
    .eq("id", user.id)
    .single();

  // Bank-only for now. E-wallet provider mapping depends on IRIS channel configuration.
  if (profile?.payout_channel && profile.payout_channel !== "bank") {
    return { success: false, error: "Payout via e-wallet belum didukung. Pilih channel Bank." };
  }

  if (!profile?.payout_bank_code || !profile.payout_account_number || !profile.payout_account_name) {
    return {
      success: false,
      error: "Metode pencairan belum lengkap. Lengkapi di Profil & Pengaturan.",
    };
  }

  const notes = `SirkulasiIn payout order:${order.id}`;

  try {
    const res = await createIrisPayout({
      beneficiaryName: profile.payout_account_name,
      beneficiaryAccount: profile.payout_account_number,
      beneficiaryBank: profile.payout_bank_code,
      beneficiaryEmail: user.email,
      amount: order.payout_amount,
      notes,
    });

    const referenceNo = res.payouts?.[0]?.reference_no;
    const statusFromApi = normalizeIrisDisbursementStatus(res.payouts?.[0]?.status);
    if (!referenceNo) {
      return { success: false, error: res.error_message || "Gagal membuat payout." };
    }

    const admin = createAdminSupabaseClient();
    const { error } = await admin
      .from("orders")
      .update({
        payout_reference: referenceNo,
        payout_requested_at: nowIso(),
        payout_status: statusFromApi || "requested",
      })
      .eq("id", orderId)
      .eq("payout_status", "ready_for_payout");

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/payouts");
    return { success: true, referenceNo };
  } catch (e: unknown) {
    return { success: false, error: getErrorMessage(e) || "Gagal membuat payout." };
  }
}

export async function adminApprovePayout(orderId: string, otp: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Anda harus login." };
  if (!isPayoutAdmin(user.email)) return { success: false, error: "Tidak diizinkan." };

  const admin = createAdminSupabaseClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, payout_reference, payout_status")
    .eq("id", orderId)
    .single();

  if (!order?.payout_reference) {
    return { success: false, error: "Payout reference tidak ditemukan." };
  }
  if (!["requested", "queued", "pending"].includes(order.payout_status)) {
    return { success: false, error: "Status payout tidak bisa di-approve." };
  }

  try {
    const res = await approveIrisPayout(order.payout_reference, otp);
    if (res.status && res.status !== "ok" && res.status !== "success") {
      return { success: false, error: res.error_message || "Approve payout gagal." };
    }
    await admin
      .from("orders")
      .update({ payout_status: "approved" })
      .eq("id", orderId)
      .in("payout_status", ["requested", "queued", "pending"]);

    revalidatePath("/dashboard/payouts");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: getErrorMessage(e) || "Approve payout gagal." };
  }
}

export async function adminRejectPayout(orderId: string, reason: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Anda harus login." };
  if (!isPayoutAdmin(user.email)) return { success: false, error: "Tidak diizinkan." };

  const admin = createAdminSupabaseClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, payout_reference, payout_status")
    .eq("id", orderId)
    .single();

  if (!order?.payout_reference) {
    return { success: false, error: "Payout reference tidak ditemukan." };
  }

  if (order.payout_status === "paid_out") {
    return { success: false, error: "Payout sudah selesai." };
  }

  try {
    await rejectIrisPayout(order.payout_reference, reason || "Rejected");
    await admin
      .from("orders")
      .update({ payout_status: "rejected" })
      .eq("id", orderId)
      .neq("payout_status", "paid_out");

    revalidatePath("/dashboard/payouts");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: getErrorMessage(e) || "Reject payout gagal." };
  }
}

export async function adminRefreshPayout(orderId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Anda harus login." };
  if (!isPayoutAdmin(user.email)) return { success: false, error: "Tidak diizinkan." };

  const admin = createAdminSupabaseClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, status, payout_reference, payout_status")
    .eq("id", orderId)
    .single();

  if (!order?.payout_reference) {
    return { success: false, error: "Payout reference tidak ditemukan." };
  }

  if (order.payout_status === "paid_out") {
    return { success: true, payoutStatus: "paid_out" };
  }

  try {
    const detail = await getIrisPayoutDetails(order.payout_reference);
    const next = normalizeIrisDisbursementStatus(detail.status);

    const updates: Record<string, unknown> = {
      payout_status: next || "unknown",
    };

    if (next === "paid_out" && order.status === "completed") {
      updates.payout_completed_at = nowIso();
      updates.status = "paid_out";
    }

    await admin.from("orders").update(updates).eq("id", orderId);
    revalidatePath("/dashboard/payouts");
    return { success: true, payoutStatus: next };
  } catch (e: unknown) {
    return { success: false, error: getErrorMessage(e) || "Refresh payout gagal." };
  }
}
