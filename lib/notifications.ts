import { createServerSupabaseClient } from "./supabase-server";

export type NotificationType = 'system' | 'transaction' | 'scan' | 'admin_alert' | 'social' | 'reward';

interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Mengirim notifikasi ke user tertentu melalui Database Supabase.
 * Karena tabel notifications terdaftar di Realtime Publication,
 * user yang sedang online akan langsung menerimanya.
 */
export async function sendNotification({
  userId,
  type,
  title,
  message,
  link,
  metadata = {},
}: SendNotificationParams) {
  try {
    const supabase = await createServerSupabaseClient();
    
    console.log(`[Notification] Attempting to send to ${userId}. Type: ${type}`);
    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link,
        metadata,
      });

    if (error) {
      console.error("[Notification] Error sending notification:", error);
      return { success: false, error };
    }

    console.log("[Notification] Success! Sent to:", userId);
    return { success: true };
  } catch (err) {
    console.error("[Notification] Unexpected error:", err);
    return { success: false, error: err };
  }
}

/**
 * Mengirim notifikasi ke semua Admin.
 */
export async function notifyAdmins({
  type = 'admin_alert',
  title,
  message,
  link,
  metadata = {},
}: Omit<SendNotificationParams, 'userId'> & { type?: NotificationType }) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Cari semua user dengan role admin
    // Note: Sesuaikan nama tabel 'profiles' atau 'users' sesuai skema Anda
    const { data: admins, error: adminError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (adminError || !admins) {
      console.error("[Notification] Error fetching admins:", adminError);
      return { success: false, error: adminError };
    }

    const notifications = admins.map((admin) => ({
      user_id: admin.id,
      type,
      title,
      message,
      link,
      metadata,
    }));

    const { error } = await supabase.from("notifications").insert(notifications);

    if (error) {
      console.error("[Notification] Error sending admin notifications:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error("[Notification] Unexpected error in notifyAdmins:", err);
    return { success: false, error: err };
  }
}
