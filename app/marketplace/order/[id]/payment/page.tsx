import { redirect, notFound } from "next/navigation";
import { reconcileExpiredOrder } from "@/lib/midtrans";
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

  const expireResult = await reconcileExpiredOrder(order);
  if (!expireResult.ok) {
    throw new Error(expireResult.error);
  }

  const currentOrder = expireResult.expired
    ? {
        ...order,
        status: "payment_expired",
      }
    : order;

  // Hanya pembeli yang bisa melihat halaman ini
  if (currentOrder.buyer_id !== user.id) {
    redirect("/dashboard/transactions");
  }

  const titleByStatus: Record<string, string> = {
    pending_payment: "Menunggu Pembayaran",
    paid_escrow: "Pembayaran Berhasil",
    payment_expired: "Pembayaran Kedaluwarsa",
    payment_failed: "Pembayaran Gagal",
  };

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
          <h1 className={styles.title}>{titleByStatus[currentOrder.status] || "Status Pembayaran"}</h1>
          <p className={styles.subtitle}>
            Pesanan Anda untuk <strong>{currentOrder.marketplace_listings?.title || "Produk preloved"}</strong>{" "}
            {currentOrder.status === "paid_escrow"
              ? "sudah dibayar dan dana sedang ditahan dalam escrow."
              : currentOrder.status === "payment_expired"
                ? "gagal dibayar karena sesi pembayaran telah kedaluwarsa."
                : currentOrder.status === "payment_failed"
                  ? "belum berhasil diproses pembayarannya."
                  : "sedang menunggu pembayaran."}
          </p>
          
          <div className={styles.amountBox}>
            <div className={styles.amountLabel}>Total Tagihan</div>
            <div className={styles.amountValue}>
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
                }).format(currentOrder.total_price)}
            </div>
          </div>

          <PaymentForm
            orderId={currentOrder.id}
            status={currentOrder.status}
            paymentUrl={currentOrder.payment_redirect_url}
            paymentExpiredAt={currentOrder.payment_expired_at}
          />
        </div>
      </div>
    </main>
  );
}
