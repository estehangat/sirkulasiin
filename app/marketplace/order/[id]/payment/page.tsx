import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Navbar from "@/app/components/navbar";
import PaymentForm from "./PaymentForm";
import styles from "./payment.module.css";

export const metadata = {
  title: "Pembayaran | SirkulasiIn",
};

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/marketplace/order/${id}/payment`);
  }

  const { data: order } = await supabase
    .from("orders")
    .select("*, marketplace_listings(title)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  // Hanya pembeli yang bisa melihat halaman ini
  if (order.buyer_id !== user.id) {
    redirect("/dashboard/transactions");
  }

  // Jika sudah dibayar atau status lain, redirect ke dashboard
  if (order.status !== "pending_payment") {
    redirect("/dashboard/transactions");
  }

  return (
    <main className={styles.pageShell}>
      <Navbar activeNav="marketplace" />
      <div className={styles.container}>
        <div className={styles.paymentCard}>
          <div className={styles.iconWrap}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <h1 className={styles.title}>Menunggu Pembayaran</h1>
          <p className={styles.subtitle}>
            Pesanan Anda untuk <strong>{order.marketplace_listings?.title || "Produk preloved"}</strong> sedang menunggu pembayaran.
          </p>
          
          <div className={styles.amountBox}>
            <div className={styles.amountLabel}>Total Tagihan</div>
            <div className={styles.amountValue}>
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(order.total_price)}
            </div>
          </div>

          <PaymentForm orderId={order.id} />
        </div>
      </div>
    </main>
  );
}
