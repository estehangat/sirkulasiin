import type { Metadata } from "next";
import { redirect } from "next/navigation";
import styles from "../section.module.css";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isPayoutAdmin } from "@/lib/admin";
import PayoutAdminClient from "./payouts-client";

type PayoutAdminRow = {
  id: string;
  created_at: string;
  seller_id: string;
  total_price: number;
  status: string;
  payout_status: string | null;
  payout_reference: string | null;
  payout_requested_at: string | null;
  payout_completed_at: string | null;
  profiles: Array<{ full_name: string | null }> | null;
};

export const metadata: Metadata = {
  title: "Payout Admin — SirkulasiIn",
  description: "Approve payout IRIS untuk transaksi marketplace.",
};

export default async function PayoutsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!isPayoutAdmin(user.email)) redirect("/dashboard");

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, created_at, seller_id, total_price, status, payout_status, payout_reference, payout_requested_at, payout_completed_at, profiles!orders_seller_id_fkey(full_name)"
    )
    .in("payout_status", [
      "requested",
      "approved",
      "paid_out",
      "rejected",
      "failed",
      "unknown",
      "queued",
      "pending",
    ])
    .order("payout_requested_at", { ascending: false });

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>Payout Admin</h1>
      <p className={styles.subtitle}>
        Approve payout Midtrans IRIS. Butuh OTP dari Midtrans Dashboard.
      </p>

      <PayoutAdminClient orders={(orders as PayoutAdminRow[]) || []} />
    </section>
  );
}
